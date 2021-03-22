import * as crypto from "@node-lightning/crypto";

export function encryptData(key: Buffer, data: Buffer): Buffer {
  const iv = Buffer.alloc(16);
  const zeros = Buffer.alloc(data.length);
  const stream = crypto.chachaEncrypt(key, iv, zeros);
  return crypto.xor(data, stream);
}
