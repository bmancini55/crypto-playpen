const bitcoin = require('bitcoinjs-lib');
const OPS = require('bitcoin-ops');

module.exports = {
  p2pkh,
  np2wpkh,
  raw,
};

function p2pkh(key, txid, vout, addr, amount) {
  //console.log(bitcoin.address.fromBase58Check(key.getAddress()));
  // console.log(
  //   bitcoin.script.pubKeyHash.output.encode(bitcoin.crypto.hash160(key.getPublicKeyBuffer()))
  // );
  // console.log(bitcoin.address.toOutputScript(key.getAddress(), bitcoin.networks.testnet));

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout);
  txb.addOutput(addr, amount - 20000);
  txb.sign(0, key);

  let tx = txb.build();
  return tx.toHex();
}

function raw(key, txid, vout, addr, amount) {
  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout);

  let address = bitcoin.address.fromBase58Check(addr);
  let pubKeyHash = address.hash;

  let buffer = [OPS.OP_DUP, OPS.OP_HASH160, pubKeyHash, OPS.OP_EQUALVERIFY, OPS.OP_CHECKSIG];
  let scriptPubKey = bitcoin.script.compile(buffer);

  txb.addOutput(scriptPubKey, amount - 20000);
  txb.sign(0, key);

  let tx = txb.build();
  return tx.toHex();
}

function np2wpkh(key, txid, vout, addr, amount) {
  let pubKey = key.getPublicKeyBuffer();
  let pubKeyHash = bitcoin.crypto.hash160(pubKey);
  let redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash);

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout);
  txb.addOutput(addr, amount - 20000);
  txb.sign(0, key, redeemScript, null, amount);

  let tx = txb.build();

  return tx.toHex();
}
