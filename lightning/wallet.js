const winston = require('winston');
const bip39 = require('bip39');
const bitcoin = require('bitcore-lib');
const walletio = require('./wallet-io');

class Wallet {
  constructor({ seed }) {
    winston.debug('wallet seed', seed);
    this._seed = Buffer.isBuffer(seed) ? seed : Buffer.from(seed, 'hex');
  }

  static fromJson(json) {
    let wallet = new Wallet();
    wallet.seed = json.seed;
    return wallet;
  }

  set seed(val) {
    this._seed = val;
  }

  get seed() {
    return this._seed;
  }

  toJson() {
    return JSON.stringify({
      seed: this._seed.toString('hex'),
    });
  }

  static async generate(passphrase) {
    winston.debug('generating wallet');

    let mneuonic = bip39.generateMnemonic(256);
    winston.warn('WRITE THIS DOWN!!!');
    winston.warn(mneuonic);
    let seed = bip39.mnemonicToSeed(mneuonic);

    let wallet = new Wallet({ seed });
    let walletJson = wallet.toJson();

    await walletio.writeWallet({ passphrase, walletJson });
    return wallet;
  }

  static async unlock(passphrase) {
    winston.debug('unlocking wallet');

    let walletJson = await walletio.readWallet(passphrase);
    let wallet = new Wallet(walletJson);
    return wallet;
  }

  get rootAddress() {
    if (!this._rootAddress) {
      this._rootAddress = new bitcoin.HDPrivateKey(this.seed);
      winston.debug('root address', this._rootAddress.getAddress());
    }
    return this._rootAddress;
  }

  get bitcoinAddress() {
    if (!this._bitcoinAddress) {
      // eslint-disable-next-line
      this._bitcoinAddress = this.rootAddress.derivePath("m/44'/0'/0'/0/0");
      winston.debug('bitcoin address', this._bitcoinAddress.getAddress());
    }
    return this._bitcoinAddress;
  }
}

module.exports = Wallet;
