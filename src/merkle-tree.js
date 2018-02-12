const crypto = require('crypto');

module.exports = {
  merkleRoot,
  reverse,
  fromHex,
  sha256,
  dhash,
};

// https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees

function reverse(str) {
  let res = '';
  for (let i = str.length - 2; i >= 0; i -= 2) {
    res += str[i];
    res += str[i + 1];
  }
  return res;
}

function fromHex(str) {
  return Buffer.from(str, 'hex');
}

function sha256(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest();
}

function dhash(buffer) {
  return sha256(sha256(buffer));
}

function merkleRoot(chunks) {
  return recurseNodes(chunks);
}

function recurseNodes(childNodes) {
  if (childNodes.length === 1) return childNodes[0];
  if (childNodes.length % 2) childNodes.push(childNodes[childNodes.length - 1]);

  let nodes = [];
  for (let i = 0; i < childNodes.length; i += 2) {
    let left = childNodes[i];
    let right = childNodes[i + 1];

    let hash = dhash(Buffer.concat([left, right]));
    nodes.push(hash);
  }

  return recurseNodes(nodes);
}
