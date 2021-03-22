import * as crypto from "@node-lightning/crypto";
import { BufferWriter } from "@node-lightning/bufio";

/**
 * This is a simple and insecure onion example.
 *
 * Simplifications are:
 * - Reuse of the same secret at each hop
 * - Use of variable length onions
 *
 * @param secret - 32-byte secret
 * @param nodeIds - list of 33-byte public keys for each node to route through
 * @param info - data to wrap in onion for each hop
 */
export function buildSimple(secret: Buffer, nodeIds: Buffer[], info: Buffer[]): Buffer {
  const ephemeralPoint = crypto.getPublicKey(secret, true);

  let lastHmac: Buffer = Buffer.alloc(32);
  let lastHopData: Buffer = Buffer.alloc(0);

  // Iterate in reverse order
  while (info.length) {
    const nodeId = nodeIds.pop();
    console.log("nodeId ", nodeId.toString("hex"));

    // creates a shared secret based on the node's publicId and the secret
    // using ECDH
    const sharedSecret = crypto.ecdh(nodeId, secret);
    console.log("ss     ", sharedSecret.toString("hex"));

    const currentHopData = info.pop();

    lastHopData = Buffer.concat([currentHopData, lastHopData, lastHmac]);

    console.log("data   ", currentHopData.toString("hex"));
    console.log("ek     ", ephemeralPoint.toString("hex"));
    console.log("hopData", lastHopData.toString("hex"));

    // Packet HMAC protects the entire packet contents
    const hmacBytes = new BufferWriter();
    hmacBytes.writeBytes(ephemeralPoint);
    hmacBytes.writeBytes(lastHopData);
    lastHmac = crypto.hmac(sharedSecret, hmacBytes.toBuffer(), "sha256");
    console.log("hmac   ", lastHmac.toString("hex"));
    console.log("");
  }
  return Buffer.concat([ephemeralPoint, lastHopData, lastHmac]);
}

/**
 * Reads a simple onion packet
 * @param packet
 * @param nodeKeys
 */
export function readSimple(packet: Buffer, nodeKeys: Buffer[]) {
  // we'll use the same for each one
  const ephemeralPoint = packet.slice(0, 33);
  const hopData = packet.slice(33, packet.length - 32);
  const hmac = packet.slice(packet.length - 32);

  console.log("ek      ", ephemeralPoint.toString("hex"));
  console.log("hopData ", hopData.toString("hex"));
  console.log("hmac    ", hmac.toString("hex"));

  const nodeKey = nodeKeys.shift();

  const sharedSecret = crypto.ecdh(ephemeralPoint, nodeKey);

  const calcedHmac = crypto.hmac(sharedSecret, packet.slice(0, packet.length - 32));

  console.log("calced  ", calcedHmac.toString("hex"));
  console.log("");

  if (!calcedHmac.equals(hmac)) {
    throw new Error("HMAC failed");
  }

  if (nodeKeys.length) {
    readSimple(Buffer.concat([ephemeralPoint, hopData.slice(4)]), nodeKeys);
  }
}
