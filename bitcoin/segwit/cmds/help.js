const menus = {
  main: `
    segwit [command] <options>

    key ............... generate or display a named key
    address ........... generate an address by type for a key
    tx ................ generate a transaction
    help .............. show help for a command
    `,

  key: `
    segwit key <options>

    --wallet, -w ...... the name of the wallet
    `,

  address: `
    segwit address <options>

    --wallet, -w ...... the name of the wallet
    --type ............ the type of address: p2pkh, p2wpkh, np2wpkh
    `,

  tx: `
    segwit tx <options>

    --wallet, -w ...... the name of the wallet
    --type ............ the type of transaction: p2pkh, np2wpkh, raw
    --txid ............ the input txid
    --vout ............ the input vout index
    --sendto .......... the address to send to
    --amount .......... the amount to send
    `,
};

module.exports = args => {
  const subCmd = args._[0] === 'help' ? args._[1] : args._[0];

  console.log(menus[subCmd] || menus.main);
};
