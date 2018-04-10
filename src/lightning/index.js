const winston = require('winston');
winston.level = 'debug';

const prompt = require('prompt-promise');
const Wallet = require('./wallet');
const { walletExists } = require('./wallet-io');

class App {
  static async run() {
    try {
      let app = new App();
      if (!await app.hasWallet()) {
        await app.generateWallet();
      } else {
        await app.unlockWallet();
      }
    } catch (ex) {
      winston.error(ex);
      process.exit(1);
    }
  }

  set wallet(value) {
    this._wallet = value;
  }

  get wallet() {
    return this._wallet;
  }

  async hasWallet() {
    return walletExists();
  }

  async generateWallet() {
    let passphrase = await prompt.password(
      'Enter a strong passphrase that will unlock your wallet: '
    );
    let wallet = await Wallet.generate(passphrase);
    this.wallet = wallet;
  }

  async unlockWallet() {
    let passphrase = await prompt.password('Enter wallet unlock passphrase: ');
    let wallet = await Wallet.unlock(passphrase);
    this.wallet = wallet;
  }
}

App.run();
