const bitcoin = require('bitcoinjs-lib');
const OPS = require('bitcoin-ops');
const secp256k1 = require('secp256k1');
const { sha256, hash160 } = require('./crypto');
const bip69 = require('bip69');
const varuint = require('varuint-bitcoin');

let funding_txid = 'fd2105607605d2302994ffea703b09f66b6351816ee737a93e42a841ea20bbad';
let funding_output_index = 0;
let input_satoshis = 5000000000;
let funding_amount_satosis = 10000000;
let feerate_per_kw = 15000;
let change_satoshis = 4989986080;
let funding_privkey = Buffer.from(
  // '6bd078650fcee8444e4e09825227b801a1ca928debb750eb36e6d56124bb20e801',
  '6bd078650fcee8444e4e09825227b801a1ca928debb750eb36e6d56124bb20e8',
  'hex'
);

let funding_pubkey = secp256k1.publicKeyCreate(funding_privkey);

let local_funding_pubkey = Buffer.from(
  '023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb',
  'hex'
);
let remote_funding_pubkey = Buffer.from(
  '030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1',
  'hex'
);

function verifuint(value, max) {
  if (typeof value !== 'number') throw new Error('cannot write a non-number as a number');
  if (value < 0) throw new Error('specified a negative value for writing an unsigned value');
  if (value > max) throw new Error('RangeError: value out of range');
  if (Math.floor(value) !== value) throw new Error('value has a fractional component');
}
function writeUInt64LE(buffer, value, offset) {
  verifuint(value, 0x001fffffffffffff);
  buffer.writeInt32LE(value & -1, offset);
  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4);
  return offset + 8;
}

function varSliceSize(sliceLen) {
  return varuint.encodingLength(sliceLen) + sliceLen;
}

function calcTxBytes(vins, vouts) {
  return (
    8 + // (hasWitnesses ? 10 : 8) +
    varuint.encodingLength(vins.length) +
    varuint.encodingLength(vouts.length) +
    vins.map(vin => vin.script.length).reduce((sum, len) => sum + 40 + varSliceSize(len), 0) +
    vouts.map(vout => vout.script.length).reduce((sum, len) => sum + 8 + varSliceSize(len), 0) +
    0 // (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0)
  );
}

function txToBuffer(buffer, tx) {
  let offset = 0;
  function writeSlice(slice) {
    offset += slice.copy(buffer, offset);
  }
  function writeUInt32(i) {
    offset = buffer.writeUInt32LE(i, offset);
  }
  function writeInt32(i) {
    offset = buffer.writeInt32LE(i, offset);
  }
  function writeUInt64(i) {
    offset = writeUInt64LE(buffer, i, offset);
  }
  function writeVarInt(i) {
    varuint.encode(i, buffer, offset);
    offset += varuint.encode.bytes;
  }
  function writeVarSlice(slice) {
    writeVarInt(slice.length);
    writeSlice(slice);
  }

  writeInt32(tx.version);

  writeVarInt(tx.vins.length);

  tx.vins.forEach(function(txIn) {
    writeSlice(txIn.hash);
    writeUInt32(txIn.index);
    writeVarSlice(txIn.script);
    writeUInt32(txIn.sequence);
  });

  writeVarInt(tx.vouts.length);
  tx.vouts.forEach(function(txOut) {
    if (!txOut.valueBuffer) {
      writeUInt64(txOut.value);
    } else {
      writeSlice(txOut.valueBuffer);
    }

    writeVarSlice(txOut.script);
  });

  writeUInt32(tx.locktime);

  // avoid slicing unless necessary
  return buffer;
}

function signp2pkh(vins, vouts, privKey) {
  let hashType = 0x01; // SIGHASH_ALL
  let filteredPrevOutScript = vins[0].script.filter(function(x) {
    return x !== OPS.OP_CODESEPARATOR;
  });

  vins[0].script = filteredPrevOutScript;

  // for (let vin of vouts) {
  //   // remove all the vin values
  // }

  let byteLength = calcTxBytes(vins, vouts);

  let buffer = Buffer.alloc(byteLength + 4);
  buffer.writeInt32LE(hashType, buffer.length - 4);

  txToBuffer(buffer, { version: 2, locktime: 0, vins, vouts });

  // console.log('signp2pkh');
  // console.log('  buffer', buffer.length);
  // console.log(buffer.toString('hex'));

  let hash = sha256(sha256(buffer));
  // console.log('  hash');
  // console.log(hash.toString('hex'));

  let sig = secp256k1.sign(hash, privKey);
  // console.log(sig);
  return bitcoin.script.signature.encode(sig.signature, 0x01);
}

function p2pkhInput(sig, pubkey) {
  return bitcoin.script.compile([sig, pubkey]);
}

// Refer to:
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58
function p2pkhOutput(pubkey, satoshis) {
  // prettier-ignore
  let scriptPubKey = bitcoin.script.compile([
    OPS.OP_DUP,
    OPS.OP_HASH160,
    hash160(pubkey),
    OPS.OP_EQUALVERIFY,
    OPS.OP_CHECKSIG
  ]);
  return {
    script: scriptPubKey,
    value: satoshis,
  };
}

// Refer to:
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2wpkh.js#L63
function p2wpkhOutput(pubkey, satoshis) {
  // prettier-ignore
  let scriptPubKey = bitcoin.script.compile([
    OPS.OP_0,
    hash160(pubkey) // 20-bytes
  ]);
  return {
    script: scriptPubKey,
    value: satoshis,
  };
}

// Refer to:
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2wsh.js#L80
function p2wshOutput(script, satoshis) {
  // prettier-ignore
  let scriptPubKey = bitcoin.script.compile([
    OPS.OP_0,
    sha256(script) // 32-bytes
  ]);
  return {
    script: scriptPubKey,
    value: satoshis,
  };
}

function toHex({ version = 2, locktime = 0, vins, vouts }) {
  let byteLength = calcTxBytes(vins, vouts);

  let buffer = Buffer.alloc(byteLength);

  return txToBuffer(buffer, { version, locktime, vins, vouts });
}

// refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script.js
let redeemScript = bitcoin.script.compile([
  bitcoin.script.number.encode(2),
  local_funding_pubkey,
  remote_funding_pubkey,
  bitcoin.script.number.encode(2),
  OPS.OP_CHECKMULTISIG,
]);

let primaryOutputRaw2 = p2wshOutput(redeemScript, funding_amount_satosis);
let changeOutputRaw2 = p2wpkhOutput(funding_pubkey, change_satoshis);

let sortedInputs = [
  {
    txId: Buffer.from(funding_txid, 'hex'),
    index: funding_output_index,
    hash: Buffer.from(funding_txid, 'hex').reverse(),
    script: p2pkhOutput(funding_pubkey, 0).script,
    sequence: 4294967295,
  },
];
let sortedOutputs = bip69.sortOutputs([primaryOutputRaw2, changeOutputRaw2]);

let sig = signp2pkh(sortedInputs, sortedOutputs, funding_privkey);
console.log('sig\n', sig.toString('hex'));

// replace the previous scriptpubkey with the scriptsig
sortedInputs[0].script = p2pkhInput(sig, funding_pubkey);

let actual = toHex({ version: 2, locktime: 0, vins: sortedInputs, vouts: sortedOutputs }).toString(
  'hex'
);

let expected =
  '0200000001adbb20ea41a8423ea937e76e8151636bf6093b70eaff942930d20576600521fd000000006b48304502210090587b6201e166ad6af0227d3036a9454223d49a1f11839c1a362184340ef0240220577f7cd5cca78719405cbf1de7414ac027f0239ef6e214c90fcaab0454d84b3b012103535b32d5eb0a6ed0982a0479bbadc9868d9836f6ba94dd5a63be16d875069184ffffffff028096980000000000220020c015c4a6be010e21657068fc2e6a9d02b27ebe4d490a25846f7237f104d1a3cd20256d29010000001600143ca33c2e4446f4a305f23c80df8ad1afdcf652f900000000';

console.log();
console.log(actual);
console.log();
console.log(expected);
console.log(actual === expected);
