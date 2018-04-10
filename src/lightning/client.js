const bitcoin = require('bitcoinjs-lib');

class LightningClient {}

class WalletIO {}

class Wallet {
  constructor({ walletio }) {
    if (!walletio) {
      throw new Error('requires walletio');
    }

    this._walletio = walletio;
  }

  load() {}

  unlock() {}
  lock() {}
}

class NoiseProtocol {}
