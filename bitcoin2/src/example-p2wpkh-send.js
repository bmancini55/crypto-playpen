const OPS = require('bitcoin-ops');
const secp256k1 = require('secp256k1');
const { sha256, hash160 } = require('./crypto');
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
  txid: Buffer.from('e975292df223bc5aded3b40a36430e153506c0a1e03aac7bb86c432244e2048f', 'hex'),
  vout: 1,
  hash: Buffer.from('e975292df223bc5aded3b40a36430e153506c0a1e03aac7bb86c432244e2048f', 'hex').reverse(), // prettier-ignore
  sequence: 0xffffffff,
  script: p2pkhScript(fromBase58Check('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv').hash),
  scriptSig: null,
});

// 3: add output for new address
tx.vouts.push({
  script: p2wpkhScript(fromBech32('tb1qeakm4zty44k7t63jcjzcjkaj6rylma92m6mtt9').hash),
  value: 10000,
});

tx.vouts.push({
  script: p2pkhScript(fromBase58Check('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv').hash),
  value: 108900 - 10000 - 1900, // fees 1900
});

// 4. attach scriptSig to input 0
let privKey1 = Buffer.from('60226ca8fb12f6c8096011f36c5028f8b7850b63d495bc45ec3ca478a29b473d', 'hex'); // prettier-ignore
let pubKey1 = secp256k1.publicKeyCreate(privKey1);
tx.vins[0].scriptSig = compileScript([signInput(tx, 0, privKey1, 0x01), pubKey1]);

// 5: to hex
let result = txToBuffer(tx).toString('hex');
console.log(result);
console.log(
  result ===
    '02000000018f04e24422436cb87bac3ae0a1c00635150e43360ab4d3de5abc23f22d2975e9010000006b483045022100d2dabe9b29ddfd966a06b1b3ae30380e497af812003ef8a5f703dd7446862ec0022014c87ac81097f934600593d3200451f910681b435a67170a666040b4d7566eb6012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff021027000000000000160014cf6dba8964ad6de5ea32c485895bb2d0c9fdf4aae87a0100000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000'
);

// bitcoin-cli -testnet sendrawtransaction 02000000018f04e24422436cb87bac3ae0a1c00635150e43360ab4d3de5abc23f22d2975e9010000006b483045022100d2dabe9b29ddfd966a06b1b3ae30380e497af812003ef8a5f703dd7446862ec0022014c87ac81097f934600593d3200451f910681b435a67170a666040b4d7566eb6012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff021027000000000000160014cf6dba8964ad6de5ea32c485895bb2d0c9fdf4aae87a0100000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000
// txid: 65c044e1600243bac7910c75727b5cdb4391e20e9f43977b51c237c95f4350a9

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

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/address.js
// function toBase58Check(privKey, version = 0x6f) {
//   let buffer = Buffer.alloc(21);
//   buffer.writeInt8(version);
//   hash160(secp256k1.publicKeyCreate(privKey)).copy(buffer, 1);
//   return bs58check.encode(buffer);
// }

// refer to https://en.bitcoin.it/wiki/Transaction#General_format_of_a_Bitcoin_transaction_.28inside_a_block.29
function calcTxBytes(vins, vouts) {
  return (
    4 + // version
    varuint.encodingLength(vins.length) +
    vins
      .map(vin => (vin.scriptSig ? vin.scriptSig.length : vin.script.length))
      .reduce((sum, len) => sum + 40 + varuint.encodingLength(len) + len, 0) +
    varuint.encodingLength(vouts.length) +
    vouts
      .map(vout => vout.script.length)
      .reduce((sum, len) => sum + 8 + varuint.encodingLength(len) + len, 0) +
    4 // locktime
  );
}

function txToBuffer(tx) {
  let buffer = Buffer.alloc(calcTxBytes(tx.vins, tx.vouts));
  let cursor = new BufferCursor(buffer);

  // version
  cursor.writeInt32LE(tx.version);

  // vin length
  cursor.writeBytes(varuint.encode(tx.vins.length));

  // vin
  for (let vin of tx.vins) {
    cursor.writeBytes(vin.hash);
    cursor.writeUInt32LE(vin.vout);
    if (vin.scriptSig) {
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
