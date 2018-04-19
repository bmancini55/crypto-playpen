const fs = require('fs');
const util = require('util');

module.exports = {
  createReadStream: fs.createReadStream,
  createWriteStream: fs.createWriteStream,
  readFile: util.promisify(fs.readFile),
  writeFile: util.promisify(fs.writeFile),
  fileExists: fs.existsSync,
};
