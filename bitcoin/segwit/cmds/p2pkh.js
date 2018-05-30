const wallet = require('../lib/wallet');
const addresses = require('../lib/addresses');

module.exports = args => {
  let walletName = args.wallet || args.w;
  let key = wallet.load(walletName);
  let address = addresses.p2pkh(key);
  console.log(address);
};
