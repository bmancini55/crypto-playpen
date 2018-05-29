const minimist = require('minimist');

module.exports = () => {
  const args = minimist(process.argv.slice(2));
  const cmd = args._[0];

  switch (cmd) {
    case 'create':
      require('./cmds/create')(args);
      break;
    case 'p2wpkh':
      require('./cmds/p2wpkh')(args);
      break;
    case 'np2wpkh':
      require('./cmds/np2wpkh')(args);
      break;
    case 'tx':
      require('./cmds/tx')(args);
      break;
  }
};
