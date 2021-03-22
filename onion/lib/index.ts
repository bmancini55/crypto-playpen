import * as crypto from "@node-lightning/crypto";

import * as ex1 from "./ex1";

const method = process.argv[2] || "ex1";

const nodeSecrets = [
  Buffer.alloc(32, 0x01),
  Buffer.alloc(32, 0x02),
  Buffer.alloc(32, 0x03),
  Buffer.alloc(32, 0x04),
];

const nodes = nodeSecrets.map((p) => crypto.getPublicKey(p, true));

const data = [
  Buffer.alloc(4, 0x11),
  Buffer.alloc(4, 0x22),
  Buffer.alloc(4, 0x33),
  Buffer.alloc(4, 0x44),
];

const seed = Buffer.alloc(32, 0x05);

let builder;
let reader;

switch (method) {
  case "ex1": {
    console.log("Stupid Simple Example");
    console.log("==================================================================\n");
    builder = ex1.build;
    reader = ex1.read;
  }
}

console.log("Building");
console.log("");

let packet = builder(data);

console.log("------------------------------------------------------------------\n");
console.log("Reading");
console.log("");

do {
  packet = reader(packet);
} while (packet && packet.length);
