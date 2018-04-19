const { readFile, writeFile, fileExists } = require('./fs');
const { aesEncrypt, aesDecrypt, generateKey } = require('./crypto');

module.exports = {
  writeWallet,
  readWallet,
  walletExists,
};

function getWalletPath() {
  return './wallet.dat';
}

async function walletExists() {
  return await fileExists(getWalletPath());
}

async function writeWallet({ passphrase, walletJson }) {
  let buffer = Buffer.from(walletJson);
  let { key, salt } = generateKey({ passphrase });
  buffer = aesEncrypt({ key, buffer });
  buffer = Buffer.concat([salt, buffer]);
  await writeFile(getWalletPath(), buffer);
}

async function readWallet(passphrase) {
  let buffer = await readFile(getWalletPath());
  let salt = buffer.slice(0, 16);
  buffer = buffer.slice(16);
  let { key } = generateKey({ passphrase, salt });
  buffer = aesDecrypt({ key, buffer });
  let data = JSON.parse(buffer.toString());
  return data;
}
