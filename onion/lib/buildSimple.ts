import * as crypto from "@node-lightning/crypto";

export function buildSimple(secret: Buffer, nodeIds: Buffer[], info: Buffer[]): void {
  const ephemeralPoint = crypto.getPublicKey(secret, true);

  let hopData = Buffer.alloc(0);

  // iterate in reverse order
  while (info.length) {
    const nodeId = nodeIds.pop();

    // creates a shared secret based on the node's publicId and the secret
    // using ECDH
    const sharedSecret = crypto.ecdh(nodeId, secret);

    // Append the prior payload to the current payload. Normally the
    // prior payload information would be an encrypted onion and our
    // payload would contain information needed to decrypt it.
    hopData = Buffer.concat([info.pop(), hopData]);

    const hmac = crypto.hmac(sharedSecret, hopData);

    console.log("node   ", nodeId.toString("hex"));
    console.log("version", 0x00);
    console.log("point  ", ephemeralPoint.toString("hex"));
    console.log("payload", hopData.toString("hex"));
    console.log("hmac   ", hmac.toString("hex"));
    console.log();
  }
}
