const wallet = require('../lib/wallet');
const tx = require('../lib/tx');

module.exports = args => {
  let walletName = args.wallet || args.w;
  let txid = args.txid;
  let vout = args.vout;
  let sendto = args.sendto;
  let amount = parseInt(args.amount);

  console.log(args);

  if (txid === undefined || vout === undefined || sendto === undefined || amount === undefined)
    throw new Error('invalid args');

  let key = wallet.load(walletName);
  console.log(tx.create(key, txid, vout, sendto, amount));
};
