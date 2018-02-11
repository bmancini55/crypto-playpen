const { expect } = require('chai');
const { merkleTree } = require('./merkle-tree');

describe('merkle-tree', () => {
  it('should generate a merkle root for even input', () => {
    let input = 'abcd';
    let result = merkleTree(input);
    expect(result.key.toString('hex')).to.equal(
      'c7cd42509889acd266b6f7f0b2b04fb7e734189bcc70f6d5f633622c97a658b9'
    );
  });
  it('should generate a merkle root for odd input', () => {
    let input = 'abcde';
    let result = merkleTree(input);
    console.log(JSON.stringify(result, null, 2));
    expect(result.key.toString('hex')).to.equal(
      '082fd4446f2fc496edf18622b03064e519a63411e318a47f2f93ead6f87c783f'
    );
  });
});
