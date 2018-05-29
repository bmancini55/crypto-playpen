const bitcoin = require('bitcoinjs-lib');

module.exports = {
  p2wpkh,
  np2wpkh,
};

function p2wpkh(key, network = bitcoin.networks.testnet) {
  let pubkey = key.getPublicKeyBuffer();
  let scriptPubKey = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubkey));
  let address = bitcoin.address.fromOutputScript(scriptPubKey, network);
  return address;
}

function np2wpkh(key, network = bitcoin.networks.testnet) {
  let pubkey = key.getPublicKeyBuffer();
  let redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubkey));
  let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
  let address = bitcoin.address.fromOutputScript(scriptPubKey, network);
  return address;
}
