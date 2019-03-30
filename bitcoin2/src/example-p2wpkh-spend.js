const OPS = require('bitcoin-ops');
const secp256k1 = require('secp256k1');
const { sha256, hash256, hash160 } = require('./crypto');
const bip66 = require('bip66');
const bs58check = require('bs58check');
const bech32 = require('bech32');
const varuint = require('varuint-bitcoin');
const pushdata = require('pushdata-bitcoin');
const BufferCursor = require('./buffer-cursor');

////////////////////////////////////////////////////////////

// 1: create base tx
let tx = { version: 2, locktime: 0, vins: [], vouts: [] };

// 2: add input
tx.vins.push({
  txid: Buffer.from('65c044e1600243bac7910c75727b5cdb4391e20e9f43977b51c237c95f4350a9', 'hex'),
  vout: 1,
  hash: Buffer.from('65c044e1600243bac7910c75727b5cdb4391e20e9f43977b51c237c95f4350a9 ', 'hex').reverse(), // prettier-ignore
  sequence: 0xffffffff,
  script: p2pkhScript(fromBech32('tb1qeakm4zty44k7t63jcjzcjkaj6rylma92m6mtt9').hash),
  scriptSig: null,
});

// 3: add output for new address
tx.vouts.push({
  script: p2pkhScript(fromBase58Check('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv').hash),
  value: 9000, // fees 1000
});

// 4. attach witness data to input 0
let privKey1 = Buffer.from('bccb30842073b011b3463c0a52ec30bdadbf5b5c289c6d5f37af4e3528de73ff', 'hex'); // prettier-ignore
let pubKey1 = secp256k1.publicKeyCreate(privKey1);
// tb1qeakm4zty44k7t63jcjzcjkaj6rylma92m6mtt9

// let hash = hashForWitnessV0(tx, 0, 10000, 0x01);
// console.log('hash\n', hash.toString('hex'));
// console.log(
//   hash.toString('hex') === 'ed620d292eb22f923a8b6dc5b7559c7bfe0917df96a525425db63a109e6c1fa1'
// );

tx.vins[0].witness = [
  signWitnessInput(tx, 0, privKey1, 0x01, 10000),
  pubKey1,
]; // prettier-ignore

// console.log(tx.vins[0].witness[0].toString('hex'));
// console.log(
//   tx.vins[0].witness[0].toString('hex') ===
//     '3045022100fdeae5b93c14de551a07cc17d02e9ae258950c123dc7f6e288cf55e68aa4dab70220430c2d2b5d81e9eeeb33ff301d985321977cdabad2a91dad9ac89e6a41258f2501'
// );
// console.log(tx.vins[0].witness[1].toString('hex'));
// console.log(
//   tx.vins[0].witness[1].toString('hex') ===
//     '024700bc5719a368bbb59d98e1f080d7bff293d6dc594110bbca19edc846d7ae45'
// );

// 5: to hex
let result = txToBuffer(tx).toString('hex');
console.log(result);
console.log(
  result ===
    '02000000000101a950435fc937c2517b97439f0ee29143db5c7b72750c91c7ba430260e144c0650000000000ffffffff0128230000000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac02483045022100fdeae5b93c14de551a07cc17d02e9ae258950c123dc7f6e288cf55e68aa4dab70220430c2d2b5d81e9eeeb33ff301d985321977cdabad2a91dad9ac89e6a41258f250121024700bc5719a368bbb59d98e1f080d7bff293d6dc594110bbca19edc846d7ae4500000000'
);

// bitcoin-cli -testnet sendrawtransaction 02000000000101a950435fc937c2517b97439f0ee29143db5c7b72750c91c7ba430260e144c0650000000000ffffffff0128230000000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac02483045022100fdeae5b93c14de551a07cc17d02e9ae258950c123dc7f6e288cf55e68aa4dab70220430c2d2b5d81e9eeeb33ff301d985321977cdabad2a91dad9ac89e6a41258f250121024700bc5719a368bbb59d98e1f080d7bff293d6dc594110bbca19edc846d7ae4500000000
// txid: fa59265417897f8c9b94bc5a6a5cbce066ef0fc5f51793c89eea19d61999c390

///////////////////////////////////////////////////////////

function cloneBuffer(buffer) {
  let result = Buffer.alloc(buffer.length);
  buffer.copy(result);
  return result;
}

function cloneTx(tx) {
  let result = { version: tx.version, locktime: tx.locktime, vins: [], vouts: [] };
  for (let vin of tx.vins) {
    result.vins.push({
      txid: cloneBuffer(vin.txid),
      vout: vin.vout,
      hash: cloneBuffer(vin.hash),
      sequence: vin.sequence,
      script: cloneBuffer(vin.script),
      scriptPub: null,
    });
  }
  for (let vout of tx.vouts) {
    result.vouts.push({
      script: cloneBuffer(vout.script),
      value: vout.value,
    });
  }
  return result;
}

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script.js#L35
function compileScript(chunks) {
  function asMinimalOP(buffer) {
    if (buffer.length === 0) return OPS.OP_0;
    if (buffer.length !== 1) return;
    if (buffer[0] >= 1 && buffer[0] <= 16) return OPS.OP_RESERVED + buffer[0];
    if (buffer[0] === 0x81) return OPS.OP_1NEGATE;
  }

  let bufferSize = chunks.reduce((accum, chunk) => {
    // data chunk
    if (Buffer.isBuffer(chunk)) {
      // adhere to BIP62.3, minimal push policy
      if (chunk.length === 1 && asMinimalOP(chunk) !== undefined) {
        return accum + 1;
      }
      return accum + pushdata.encodingLength(chunk.length) + chunk.length;
    }
    // opcode
    return accum + 1;
  }, 0.0);

  let buffer = Buffer.alloc(bufferSize);
  let offset = 0;

  chunks.forEach(chunk => {
    // data chunk
    if (Buffer.isBuffer(chunk)) {
      // adhere to BIP62.3, minimal push policy
      const opcode = asMinimalOP(chunk);
      if (opcode !== undefined) {
        buffer.writeUInt8(opcode, offset);
        offset += 1;
        return;
      }

      offset += pushdata.encode(buffer, chunk.length, offset);
      chunk.copy(buffer, offset);
      offset += chunk.length;

      // opcode
    } else {
      buffer.writeUInt8(chunk, offset);
      offset += 1;
    }
  });
  if (offset !== buffer.length) throw new Error('Could not decode chunks');
  return buffer;
}

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/address.js
function fromBase58Check(address) {
  let payload = bs58check.decode(address);
  let version = payload.readUInt8(0);
  let hash = payload.slice(1);
  return { version, hash };
}

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/address.js
function toBase58Check(privKey, version = 0x6f) {
  let buffer = Buffer.alloc(21);
  buffer.writeInt8(version);
  hash160(secp256k1.publicKeyCreate(privKey)).copy(buffer, 1);
  return bs58check.encode(buffer);
}

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/address.js#L23
function fromBech32(address) {
  let decoded = bech32.decode(address);
  let version = decoded.words.shift();
  const data = bech32.fromWords(decoded.words);
  return {
    version,
    prefix: decoded.prefix,
    hash: Buffer.from(data),
  };
}

function toBech32(privKey, version, prefix) {
  let hash160Pubkey = hash160(secp256k1.publicKeyCreate(privKey));
  let words = bech32.toWords(hash160Pubkey);
  words.unshift(version);
  return bech32.encode(prefix, words);
}

// refer to https://en.bitcoin.it/wiki/Transaction#General_format_of_a_Bitcoin_transaction_.28inside_a_block.29
function calcTxBytes(vins, vouts) {
  let hasWitness = vins.some(p => p.witness);
  let result = (
    4 + // version
    (hasWitness ? 2 : 0) + // witness flag
    varuint.encodingLength(vins.length) +
    vins
      .map(vin => (vin.witness ? 0 : vin.scriptSig ? vin.scriptSig.length : vin.script.length))
      .reduce((sum, len) => sum + 40 + varuint.encodingLength(len) + len, 0) +
    varuint.encodingLength(vouts.length) +
    vouts
      .map(vout => vout.script.length)
      .reduce((sum, len) => sum + 8 + varuint.encodingLength(len) + len, 0) +
    (hasWitness ? vins
      .filter(p => p.witness)
      .reduce((sum, vin) => sum + varuint.encodingLength(vin.witness.length) +
        vin.witness.reduce((dsum, d) => dsum + varuint.encodingLength(d.length) + d.length, 0) ,0) : 0) +
    4 // locktime
  ); // prettier-ignore
  return result;
}

function txToBuffer(tx) {
  let buffer = Buffer.alloc(calcTxBytes(tx.vins, tx.vouts));
  let cursor = new BufferCursor(buffer);
  let hasWitness = tx.vins.some(p => p.witness);

  // version
  cursor.writeInt32LE(tx.version);

  // add witness flags
  if (hasWitness) {
    cursor.writeUInt8(0x00); // segwit transaction marker
    cursor.writeUInt8(0x01); // segwit transaction flag
  }

  // vin length
  cursor.writeBytes(varuint.encode(tx.vins.length));

  // vin
  for (let vin of tx.vins) {
    cursor.writeBytes(vin.hash);
    cursor.writeUInt32LE(vin.value);
    if (vin.witness) {
      cursor.writeBytes(varuint.encode(0));
    } else if (vin.scriptSig) {
      cursor.writeBytes(varuint.encode(vin.scriptSig.length));
      cursor.writeBytes(vin.scriptSig);
    } else {
      cursor.writeBytes(varuint.encode(vin.script.length));
      cursor.writeBytes(vin.script);
    }
    cursor.writeUInt32LE(vin.sequence);
  }

  // vout length
  cursor.writeBytes(varuint.encode(tx.vouts.length));

  // vouts
  for (let vout of tx.vouts) {
    cursor.writeUInt64LE(vout.value);
    cursor.writeBytes(varuint.encode(vout.script.length));
    cursor.writeBytes(vout.script);
  }

  // add witness data
  for (let vin of tx.vins) {
    if (vin.witness) {
      cursor.writeBytes(varuint.encode(vin.witness.length));
      for (let datum of vin.witness) {
        cursor.writeBytes(varuint.encode(datum.length));
        cursor.writeBytes(datum);
      }
    }
  }

  // locktime
  cursor.writeUInt32LE(tx.locktime);

  return buffer;
}

// refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script_signature.js
function toDER(x) {
  let i = 0;
  while (x[i] === 0) ++i;
  if (i === x.length) return Buffer.alloc(1);
  x = x.slice(i);
  if (x[0] & 0x80) return Buffer.concat([Buffer.alloc(1), x], 1 + x.length);
  return x;
}

// refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script_signature.js
function encodeSig(signature, hashType) {
  const hashTypeMod = hashType & ~0x80;
  if (hashTypeMod <= 0 || hashTypeMod >= 4) throw new Error('Invalid hashType ' + hashType);

  const hashTypeBuffer = Buffer.from([hashType]);

  const r = toDER(signature.slice(0, 32));
  const s = toDER(signature.slice(32, 64));

  return Buffer.concat([bip66.encode(r, s), hashTypeBuffer]);
}

/////////////////////////////////////////

function signInput(tx, vindex, privKey, hashType = 0x01) {
  let clone = cloneTx(tx);

  // clean up relevant script
  let filteredPrevOutScript = clone.vins[vindex].script.filter(op => op !== OPS.OP_CODESEPARATOR);
  clone.vins[vindex].script = filteredPrevOutScript;

  // zero out scripts of other inputs
  for (let i = 0; i < clone.vins.length; i++) {
    if (i === vindex) continue;
    clone.vins[i].script = Buffer.alloc(0);
  }

  // write to the buffer
  let buffer = txToBuffer(clone);

  // extend and append hash type
  buffer = Buffer.alloc(buffer.length + 4, buffer);

  // append the hash type
  buffer.writeInt32LE(hashType, buffer.length - 4);

  // double-sha256
  let hash = sha256(sha256(buffer));

  // sign input
  let sig = secp256k1.sign(hash, privKey);

  // encode
  return encodeSig(sig.signature, hashType);
}

function hashForWitnessV0(tx, vindex, value, hashType = 0x01) {
  let buffer;
  let cursor;

  let vin = tx.vins[vindex];
  buffer = Buffer.alloc(156 + varuint.encodingLength(vin.script.length) + vin.script.length);
  cursor = new BufferCursor(buffer);

  cursor.writeUInt32LE(tx.version);

  // construct hashPrevOuts
  let tbuffer = Buffer.alloc(36 * tx.vins.length);
  let tcursor = new BufferCursor(tbuffer);
  for (let vin of tx.vins) {
    tcursor.writeBytes(vin.hash);
    tcursor.writeUInt32LE(vin.index);
  }
  let hashPrevOuts = hash256(tbuffer);
  cursor.writeBytes(hashPrevOuts);

  // construct hashSequence
  tbuffer = Buffer.alloc(4 * tx.vins.length);
  tcursor = new BufferCursor(tbuffer);
  for (let vin of tx.vins) {
    tcursor.writeUInt32LE(vin.sequence);
  }
  let hashSequence = hash256(tbuffer);
  cursor.writeBytes(hashSequence);

  cursor.writeBytes(vin.hash);
  cursor.writeUInt32LE(vin.index);
  cursor.writeBytes(varuint.encode(vin.script.length));
  cursor.writeBytes(vin.script);
  cursor.writeUInt64LE(value);
  cursor.writeUInt32LE(vin.sequence);

  // hash the outputs
  let voutSize = tx.vouts.reduce(
    (sum, vout) => sum + 8 + varuint.encodingLength(vout.script.length) + vout.script.length,
    0
  );
  tbuffer = Buffer.alloc(voutSize);
  tcursor = new BufferCursor(tbuffer);
  for (let vout of tx.vouts) {
    tcursor.writeUInt64LE(vout.value);
    tcursor.writeBytes(varuint.encode(vout.script.length));
    tcursor.writeBytes(vout.script);
  }
  let hashOutputs = hash256(tbuffer);
  cursor.writeBytes(hashOutputs);

  cursor.writeUInt32LE(tx.locktime);
  cursor.writeUInt32LE(hashType);

  return hash256(buffer);
}

function signWitnessInput(tx, vindex, privKey, hashType, value) {
  // double-sha256
  let hash = hashForWitnessV0(tx, vindex, value, hashType);

  // sign input
  let sig = secp256k1.sign(hash, privKey);

  // encode
  return encodeSig(sig.signature, hashType);
}

// Refer to:
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58
function p2pkhScript(hash160PubKey) {
  // prettier-ignore
  return compileScript([
    OPS.OP_DUP,
    OPS.OP_HASH160,
    hash160PubKey,
    OPS.OP_EQUALVERIFY,
    OPS.OP_CHECKSIG
  ]);
}

function p2shScript(hash160Script) {
  // prettier-ignore
  return compileScript([
    OPS.OP_HASH160,
    hash160Script,
    OPS.OP_EQUAL
  ]);
}

// Refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2ms.js#L58
function p2msScript(m, n, pubkeys) {
  // prettier-ignore
  return compileScript([
    80 + m,
    ...pubkeys,
    80 + n,
    OPS.OP_CHECKMULTISIG,
  ]);
}

// Refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2wpkh.js#L65
function p2wpkhScript(hash160PubKey) {
  // prettier-ignore
  return compileScript([
    OPS.OP_0,
    hash160PubKey,
  ]);
}
