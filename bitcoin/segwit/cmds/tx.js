const wallet = require('../lib/wallet');
const tx = require('../lib/tx');

module.exports = args => {
  let walletName = args.wallet || args.w;
  let type = args.type;
  let txid = args.txid;
  let vout = args.vout;
  let sendto = args.sendto;
  let amount = parseInt(args.amount);

  if (
    txid === undefined ||
    type === undefined ||
    vout === undefined ||
    sendto === undefined ||
    amount === undefined
  )
    throw new Error('invalid args');

  let key = wallet.load(walletName);

  let result;
  switch (type) {
    case 'p2pkh':
      result = tx.p2pkh(key, txid, vout, sendto, amount);
      break;
    case 'np2wpkh':
      result = tx.np2wpkh(key, txid, vout, sendto, amount);
      break;
    case 'raw':
      result = tx.raw(key, txid, vout, sendto, amount);
      break;
    default:
      throw new Error('Unkown type');
  }

  console.log(result);
};
