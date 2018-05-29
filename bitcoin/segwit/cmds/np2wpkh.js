const wallet = require('../lib/wallet');
const addresses = require('../lib/addresses');

module.exports = args => {
  let walletName = args.wallet || args.w;
  let key = wallet.load(walletName);
  console.log(addresses.np2wpkh(key));
};
