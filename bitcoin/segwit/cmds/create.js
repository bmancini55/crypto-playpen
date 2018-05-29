const wallet = require('../lib/wallet');

module.exports = args => {
  let walletName = args.wallet || args.w;
  if (!wallet.exists(walletName)) {
    let key = wallet.create(walletName);
    console.log(`created wallet ${walletName} ${key.toWIF()}`);
  } else {
    console.log(`wallet ${walletName} already exists`);
  }
};
