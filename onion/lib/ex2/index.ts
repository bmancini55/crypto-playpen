import crypto from "crypto";
import * as crypto2 from "@node-lightning/crypto";
import { BufferReader, BufferWriter } from "@node-lightning/bufio";

/**
 * This reads a simplified onion packet. Simplifications are:
 * - Reuse of the same ephemeral key at each hop
 * - Onion layers are not encrypted
 * - Use of variable length onion (grows in length with each hop)
 *
 * The packet parsing algorithm extracts from the packet:
 * - [1]   - version
 * - [33]  - ephemeral point (compressed secp256k1)
 * - [var] - variable length payload
 * - [32]  - HMAC
 *
 * From there, the payload is parsed:
 * - [1]   - data length
 * - [var] - data used by this hop
 * - [var] - data sent to next hop
 * - [32]  - HMAC covering the next packet constuction
 *
 * Once this information is parsed, we construct and return the next
 * packet.
 *
 * @param packet
 * @param nodeKeys
 */
export function read(packet: Buffer, nodeKeys: Buffer[]): Buffer {
  console.log("packet  ", packet.toString("hex"));

  const packetReader = new BufferReader(packet);

  // Read the version, we should always expect 0x00
  const version = packetReader.readUInt8();
  console.log("packet version ", version);

  // Read the ephemeral point, in this example we reuse the same point
  // which would allow correlation of the onion.
  const ephemeralPoint = packetReader.readBytes(33);
  console.log("packet ep      ", ephemeralPoint.toString("hex"));

  // Read the payload from the packet
  const payload = packetReader.readBytes(packet.length - 33 - 32 - 1);
  console.log("packet payload ", payload.toString("hex"));

  // Read the HMAC which is the final 32 bytes
  const hmac = packetReader.readBytes();
  console.log("packet hmac    ", hmac.toString("hex"));

  // Construct a shared secret using ECDH using the ephemeral point and
  // our public key.
  const nodeKey = nodeKeys.shift();
  const sharedSecret = crypto2.ecdh(ephemeralPoint, nodeKey);

  // Compute an HMAC using the shared secret and the packet (less the
  // HMAC). We can't compute the HMAC using the full packet, because
  // the HMAC can't include itself haha.
  const calcedHmac = crypto2.hmac(sharedSecret, packet.slice(0, packet.length - 32));
  console.log("processed hmac ", calcedHmac.toString("hex"));

  // Fail the packet if the HMAC is not the expected value!
  if (!crypto.timingSafeEqual(hmac, calcedHmac)) {
    throw new Error("HMAC failed");
  }

  // Parse the payload
  const payloadReader = new BufferReader(payload);
  const hopDataLen = payloadReader.readBigSize();
  const hopData = payloadReader.readBytes(Number(hopDataLen));
  const nextHmac = payloadReader.readBytes(32);
  const nextPayload = payloadReader.eof ? Buffer.alloc(0) : payloadReader.readBytes();

  console.log("payload data     ", hopData.toString("hex"));
  console.log("payload next hmac", nextHmac.toString("hex"));
  console.log("payload next data", nextPayload.toString("hex"));

  console.log("");

  // Abort when we don't have any more data
  if (!nextPayload.length) {
    return;
  }

  // Otherwise, return the next packet
  const packetWriter = new BufferWriter();
  packetWriter.writeUInt8(0);
  packetWriter.writeBytes(ephemeralPoint);
  packetWriter.writeBytes(nextPayload);
  packetWriter.writeBytes(nextHmac);
  return packetWriter.toBuffer();
}

/**
 * This onion construction adds an HMAC to each layer. The confusing
 * part is that we process in reverse order. The HMAC for the
 * inner layer must be supplied to the outer layer. The outer layer
 * uses the inner layers HMAC as part of the packet construction.
 *
 * Simplifications are:
 * - Reuse of the same ephemeral key at each hop
 * - Onions are not encrypted
 * - Use of variable length onion (no sphinx)
 *
 * @param info - data to wrap in onion for each hop
 * @param ephemeralSecret - 32-byte secret
 * @param nodeIds - list of 33-byte public keys for each node to route
 * through
 */
export function build(version: number, info: Buffer[], ephemeralSecret: Buffer, nodeIds: Buffer[]): Buffer {
  // Construct a single ephemeral point that will be used for each hop as
  // a simplification.
  const ephemeralPoint = crypto2.getPublicKey(ephemeralSecret, true);

  // Stores the last processed (inner) HMAC for use in packet
  // construction. Initially this is 0x00*32
  let lastHmac: Buffer = Buffer.alloc(32);

  // Stores the last payload for use in packet construction. Initially
  // this value is an empty buffer.
  let lastPayload: Buffer = Buffer.alloc(0);

  // Stores the last constructed packet, which is created to create the
  // HMAC. Conveniently, we return the last computed packet!
  let lastPacket: Buffer;

  // Iterate our hops in reverse order so we wrap inner onions in outer
  // onions. The outer onion HMAC will include the inner onion HMAC.
  while (info.length) {
    const nodeId = nodeIds.pop();
    console.log("nodeId ", nodeId.toString("hex"));

    // creates a shared secret based on the node's publicId and the secret
    // using ECDH
    const sharedSecret = crypto2.ecdh(nodeId, ephemeralSecret);
    console.log("ss     ", sharedSecret.toString("hex"));

    // In this example, the hopPayload includes the current hop's
    // information followed by the HMAC for the next packet, followed
    // by the remainder of the payload.
    const hopPayloadWriter = new BufferWriter();
    const hopData = info.pop();

    // Write the length of data in this hop (excludes the HMAC, though
    // it could).
    hopPayloadWriter.writeBigSize(hopData.length);
    console.log("datalen", hopData.length);

    // Write the hop's data
    hopPayloadWriter.writeBytes(hopData);
    console.log("data   ", hopData.toString("hex"));

    // Write the HMAC used in the packet for the next hop. Confusingly,
    // this is the LAST HMAC we built, since we're going in reverse order.
    hopPayloadWriter.writeBytes(lastHmac);
    console.log("hmac   ", lastHmac.toString("hex"));

    // Write the payload for the next hop
    hopPayloadWriter.writeBytes(lastPayload);
    console.log("wrapped", lastPayload.toString("hex"));

    const hopPayload = hopPayloadWriter.toBuffer();
    console.log("payload", hopPayload.toString("hex"));

    // This next part constructs the packet that will contain the data
    // we just created. This packet will be HMAC'd and used in the next
    // iteration.
    const packetWriter = new BufferWriter();

    // We always use version 0 for the onion packet version
    packetWriter.writeUInt8(version);

    // Ephemeral point that is the same for each hop. Future example
    // will rotate this value.
    packetWriter.writeBytes(ephemeralPoint);

    // Include the payload that we just constructed.
    packetWriter.writeBytes(hopPayload);

    // Finally we will construct the next HMAC for this packet using the
    // shared secret. This HMAC will be used by the next (outer) layer.
    lastHmac = crypto2.hmac(sharedSecret, packetWriter.toBuffer(), "sha256");

    lastPayload = hopPayload;
    lastPacket = packetWriter.toBuffer();
    console.log("");
  }

  // Finally we return the complete packet which includes the last
  // packet and the HMAC for it
  return Buffer.concat([lastPacket, lastHmac]);
}
