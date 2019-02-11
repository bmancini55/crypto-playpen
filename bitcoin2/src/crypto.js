const crypto = require('crypto');

module.exports = {
  sha256,
  hash160,
};

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function hash160(data) {
  let hash = crypto.createHash('ripemd160');
  hash.update(sha256(data));
  return hash.digest();
}
