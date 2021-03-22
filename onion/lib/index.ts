import * as crypto from "@node-lightning/crypto";
import { buildSimple } from "./buildSimple";

const nodes = [
  crypto.getPublicKey(Buffer.alloc(32, 0x01), true),
  crypto.getPublicKey(Buffer.alloc(32, 0x02), true),
  crypto.getPublicKey(Buffer.alloc(32, 0x03), true),
  crypto.getPublicKey(Buffer.alloc(32, 0x04), true),
];

const data = [
  Buffer.alloc(4, 0x01),
  Buffer.alloc(4, 0x02),
  Buffer.alloc(4, 0x03),
  Buffer.alloc(4, 0x04),
];

const seed = Buffer.alloc(32, 0x05);

console.log("SIMPLE EXAMPLE");
buildSimple(seed, nodes, data);
