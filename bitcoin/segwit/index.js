const minimist = require('minimist');

module.exports = () => {
  const args = minimist(process.argv.slice(2));
  let cmd = args._[0] || 'help';

  if (args.version || args.v) {
    cmd = 'version';
  }

  if (args.help || args.h) {
    cmd = 'help';
  }

  switch (cmd) {
    case 'key':
      require('./cmds/key')(args);
      break;

    case 'address':
      require('./cmds/address')(args);
      break;

    case 'tx':
      require('./cmds/tx')(args);
      break;

    case 'version':
      require('./cmds/version')(args);
      break;

    case 'help':
      require('./cmds/help')(args);
      break;

    default:
      console.error(`"${cmd}" is not a command!`);
      break;
  }
};
