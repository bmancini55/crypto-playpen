const crypto = require('crypto');

module.exports = {
  merkleTree,
};

// https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees

function sha256(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest();
}

function dhash(buffer) {
  return sha256(sha256(buffer));
}

function merkleTree(chunks) {
  let leaves = merkleLeaves(chunks);
  return recurseNodes(leaves);
}

function merkleLeaves(chunks) {
  let nodes = [];

  // construct
  for (let chunk of chunks) {
    let hash = dhash(chunk);
    nodes.push({ key: hash, data: chunk, left: undefined, right: undefined });
  }

  return nodes;
}

function recurseNodes(childNodes) {
  if (childNodes.length === 1) return childNodes[0];
  if (childNodes.length % 2) childNodes.push(childNodes[childNodes.length - 1]);

  let nodes = [];
  for (let i = 0; i < childNodes.length; i += 2) {
    let left = childNodes[i];
    let right = childNodes[i + 1];

    let hash = dhash(Buffer.concat([left.key, right.key]));
    nodes.push({ key: hash, left, right });
  }

  return recurseNodes(nodes);
}
