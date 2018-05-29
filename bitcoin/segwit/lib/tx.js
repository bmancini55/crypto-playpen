const bitcoin = require('bitcoinjs-lib');

module.exports = {
  create,
};

function create(key, txid, vout, addr, amount) {
  let pubKey = key.getPublicKeyBuffer();
  let pubKeyHash = bitcoin.crypto.hash160(pubKey);
  let redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash);

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout);
  txb.addOutput(addr, amount - 50000);
  txb.sign(0, key, redeemScript, null, amount);

  let tx = txb.build();

  console.log(tx);
  return tx.toHex();
}
