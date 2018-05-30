const wallet = require('../lib/wallet');

module.exports = args => {
  let walletName = args.wallet || args.w;

  if (!walletName) {
    require('./help')(args);
    return;
  }

  if (!wallet.exists(walletName)) {
    let key = wallet.create(walletName);
    console.log(`key ${walletName}: ${key.toWIF()}`);
  } else {
    let key = wallet.load(walletName);
    console.log(`key ${walletName}: ${key.toWIF()}`);
  }
};
