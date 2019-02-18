const crypto = require('crypto');

module.exports = {
  sha256,
  ripemd160,
  hash160,
  hash256,
};

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function ripemd160(data) {
  let hash = crypto.createHash('ripemd160');
  hash.update(data);
  return hash.digest();
}

function hash160(data) {
  return ripemd160(sha256(data));
}

function hash256(data) {
  return sha256(sha256(data));
}
