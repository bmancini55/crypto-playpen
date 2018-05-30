const wallet = require('../lib/wallet');
const addresses = require('../lib/addresses');

module.exports = args => {
  let walletName = args.wallet || args.w;
  let type = args.type;
  let key = wallet.load(walletName);

  if (!walletName) {
    require('./help')(args);
    return;
  }

  let address;

  switch (type) {
    case 'p2pkh':
      address = addresses.p2pkh(key);
      break;
    case 'p2wpkh':
      address = addresses.p2wpkh(key);
      break;
    case 'np2wpkh':
      address = addresses.np2wpkh(key);
      break;
    default:
      require('./help')(args);
      return;
  }

  console.log(address);
};
