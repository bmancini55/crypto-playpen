let { merkleRoot, dhash, fromHex, reverse } = require('./merkle-tree');
let bigInt = require('big-integer');

let genesisBlockHex =
  '0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c0101000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000';

let genesisBlockHash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

// refer to https://en.bitcoin.it/wiki/Block_hashing_algorithm

function littleEndian(num) {
  let b = Buffer.alloc(4);
  b.writeUInt32LE(num);
  return b;
}

function unixtime(str) {
  return new Date(str).getTime() / 1000;
}

function readbyte(iter) {
  let { value, done } = iter.next();
  let [idx, byte] = value;
  return byte;
}

function readbytes(iter, len) {
  let bytes = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = readbyte(iter);
  }
  return bytes;
}

// Returns a BigInteger object to account for 64-bit int possibilities
// Refer to https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
// <= 0xFD 1 byte
// <= 0xFFFF 3 bytes (indicated by 0xFD)
// <= 0xFFFF FFFF 5 bytes (indicated by 0xFE)
// otherwise 9 bytes (indicated by 0xFF)
function varint(iter) {
  let byte = readbyte(iter);

  if (byte < 0xfd) return byte;
  if (byte === 0xfd) {
    return bigInt(readbyte(iter) + (readbyte(iter) << 8));
  }
  if (byte === 0xfe) {
    let bytes = readbytes(iter, 4);
    return bigInt(Buffer.from(bytes).readUInt32LE());
  }
  if (byte === 0xff) {
    let bytes = readbytes(iter, 8).swap64(); // convert to bigendian
    return bigInt(bytes.toString('hex'), 16);
  }
}

// 01000000
let version = littleEndian(1);

// 0000000000000000000000000000000000000000000000000000000000000000
let hashPreviousBlock = fromHex('0000000000000000000000000000000000000000000000000000000000000000');

// 3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a
let hashMerkleRoot = merkleRoot([
  fromHex(reverse('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b')),
]);

// 29ab5f49
let time = littleEndian(unixtime('2009-01-03 18:15:05 UTC'));

// ffff001d
let bits = littleEndian(486604799);

// 1dac2b7c
let nonce = littleEndian(2083236893);

let blockHash = reverse(
  dhash(Buffer.concat([version, hashPreviousBlock, hashMerkleRoot, time, bits, nonce])).toString(
    'hex'
  )
);

console.log(genesisBlockHash, blockHash);

function parseBlock(buffer) {
  let version = buffer.readUInt32LE(0);
  let hashPreviousBlock = buffer.slice(5, 36);
  let hashMerkleRoot = buffer.slice(36, 68);
  let time = buffer.readUInt32LE(68);
  let bits = buffer.readUInt32LE(72);
  let nonce = buffer.readUInt32LE(76);
  return {
    version,
    hashPreviousBlock: reverse(hashPreviousBlock.toString('hex')),
    hashMerkleRoot: reverse(hashMerkleRoot.toString('hex')),
    time,
    date: new Date(time * 1000).toISOString(),
    bits,
    nonce,
  };
}

console.log(parseBlock(Buffer.from(genesisBlockHex, 'hex')));
