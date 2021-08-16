import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { OnionPacket } from "../OnionPacket";
import { OnionPayload } from "../OnionPayload";

/**
 * Reads info from the packet. No verification of information is
 * performed. This code simply reads from the front of the packet,
 * removes its information and then forwards on the remainder of the
 * packet.
 *
 * Any node could tamper with information along the way. And since there
 * is no decryption, anyone can see the information (no confidentiality).
 *
 * @param packet
 */
export function read(packet: Buffer): Buffer {
  // Read the packet which usually is constructed as:
  // version|eph_key|payload|hmac

  const packetReader = new BufferReader(packet);
  console.log("read packet: ", packet.toString("hex"));

  // read version
  const version = packetReader.readUInt8(); // expect version 1
  console.log("version:     ", version);

  // NO ephemeral key

  // read payload
  const payload = packetReader.readBytes();
  console.log("payload:     ", payload.toString("hex"));

  // NO HMAC

  // Next we read the payload which is constructed as:
  // len|data|next_data|next_hmac
  const payloadReader = new BufferReader(payload);

  // read len
  const len = payloadReader.readUInt8();
  console.log("payload len: ", len);

  // read data
  const data = payloadReader.readBytes(len);
  console.log("payload data:", data.toString("hex"));

  // read next payload
  const nextPayload = payloadReader.eof ? Buffer.alloc(0) : payloadReader.readBytes();
  console.log("next payload:", nextPayload.toString("hex"));

  // NO NEXT HMAC
  console.log("");

  // Abort when we don't have any more data
  if (!nextPayload.length) {
    return;
  }

  // Return the next packet
  const nextPacket = new BufferWriter();
  nextPacket.writeUInt8(version);
  // nextPacket.writeBytes(ephemeralPoint); - no ephemeral point
  nextPacket.writeBytes(nextPayload);
  // nextPacket.writeBytes(nextHmac); - no hmac
  return nextPacket.toBuffer();
}

/**
 * This example is really stupid but it acts as the foundation for
 * building cryptographic onions that actually protect information. This
 * construction simply takes the data and builds a linear ordering of
 * the data. There is no MAC, no shared secrets, nothing.
 *
 * As a result, any observer can see the data. Any observer can see
 * how many hops there are. Any hop can tamper with the data. So we
 * completely lack anonymity, confidentiality, and integrity.
 *
 * @param data - data to wrap in onion for each hop
 */
 export function build(version: number, data: Buffer[]): Buffer {
  let lastHopData: Buffer = Buffer.alloc(0);

  // Iterate in reverse order to construct our onion from the center
  // to the outside. This is not required for this implementation since
  // there is no cryptographic wrapping, however we can use a similar
  // construct in future implementations that improve on how things work.
  while (data.length) {
    // Extract the currrent hop information
    const currentHopData = data.pop();

    // Prepend the current hop information to the existing information
    const w = new BufferWriter();

    // write length
    w.writeBigSize(currentHopData.length);
    console.log("data size:", currentHopData.length);

    // write data
    w.writeBytes(currentHopData);
    console.log("data:     ", currentHopData.toString("hex"));

    // write prior data
    w.writeBytes(lastHopData);
    console.log("last data:", lastHopData.toString("hex"));

    lastHopData = w.toBuffer();
    console.log("onion:    ", lastHopData.toString("hex"));
    console.log("");
  }

  // Return the outer layer of the onion
  const packet = new BufferWriter();
  packet.writeUInt8(version);
  packet.writeBytes(lastHopData);
  return packet.toBuffer();
}
