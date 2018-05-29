const path = require('path');
const fs = require('fs');
const bitcoin = require('bitcoinjs-lib');

module.exports = {
  exists,
  create,
  load,
};

function buildPath(name) {
  return path.join(__dirname, '../', name);
}

function exists(name) {
  return fs.existsSync(buildPath(name));
}

function create(name) {
  let priv = bitcoin.ECPair.makeRandom({ compress: true, network: bitcoin.networks.testnet });
  fs.writeFileSync(buildPath(name), priv.toWIF());
  return priv;
}

function load(name) {
  let wif = fs.readFileSync(buildPath(name)).toString();
  return bitcoin.ECPair.fromWIF(wif, bitcoin.networks.testnet);
}
