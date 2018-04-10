const crypto = require('crypto');

module.exports = {
  aesEncrypt,
  aesDecrypt,
  generateKey,
};

function aesEncrypt({ key, buffer }) {
  const cipher = crypto.createCipher('aes256', key);
  let result = cipher.update(buffer);
  result = Buffer.concat([result, cipher.final()]);
  return result;
}

function aesDecrypt({ key, buffer }) {
  const decipher = crypto.createDecipher('aes256', key);
  let result = decipher.update(buffer);
  result = Buffer.concat([result, decipher.final()]);
  return result;
}

function generateKey({ passphrase, salt }) {
  if (!salt) {
    salt = crypto.randomBytes(16);
  }
  let key = crypto.pbkdf2Sync(passphrase, salt, 100000, 128, 'sha512');
  return {
    salt,
    key,
  };
}
