import * as crypto from "@node-lightning/crypto";
import { buildSimple, readSimple } from "./buildSimple";

const nodeSecrets = [
  Buffer.alloc(32, 0x01),
  Buffer.alloc(32, 0x02),
  Buffer.alloc(32, 0x03),
  Buffer.alloc(32, 0x04),
];

const nodes = nodeSecrets.map((p) => crypto.getPublicKey(p, true));

const data = [
  Buffer.alloc(4, 0x01),
  Buffer.alloc(4, 0x02),
  Buffer.alloc(4, 0x03),
  Buffer.alloc(4, 0x04),
];

const seed = Buffer.alloc(32, 0x05);

const packet = buildSimple(seed, nodes, data);

console.log("Reading");
console.log("");
readSimple(packet, nodeSecrets);
