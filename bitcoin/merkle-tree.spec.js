const { expect } = require('chai');
const { merkleRoot, reverse, fromHex } = require('./merkle-tree');

describe('merkle-tree', () => {
  it('should generate a merkle root for one tx', () => {
    // block 0
    let input = ['4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b']
      .map(reverse)
      .map(fromHex);
    let result = merkleRoot(input);
    let expected = reverse('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
    expect(result.toString('hex')).to.equal(expected);
  });
  it('should generate a merkle root for two tx', () => {
    // block 91000
    let input = [
      'a675c2ef16d32d2bb54e0fef4a28486ee3abb4f300425dcd2679fae3156bcee3',
      '023610bfffc483c80c311d7b99d817b9912c4cfc7a4669928857e1bb03a10707',
    ]
      .map(reverse)
      .map(fromHex);
    let result = merkleRoot(input);
    let expected = reverse('e22e7f473e3c50e2a5eab4ee1bc1bd8bb6d21a5485542ccebbda9282bb75491f');
    expect(result.toString('hex')).to.equal(expected);
  });
  it('should generate a merkle root for three txs', () => {
    // block 91006
    let input = [
      '5f42b28b3e75b3ad65bcc727694721e83f7ed53e4289818c7d49ed4b32ae7e7c',
      '4c60078a8093cd72654a4cda557a5f810976176c1eb0241dd3103cdcf26297ed',
      '5882868a5209b6f412af5af56d3cd3d9ee558fed98fe9ad044e314e737c62efd',
    ]
      .map(reverse)
      .map(fromHex);
    let result = merkleRoot(input);
    let expected = reverse('729cf6546038aee50daf66ecd696558ff42883f3fc9f82f6c7bf628c8b5c2b9f');
    expect(result.toString('hex')).to.equal(expected);
  });
  it('should generate a merkle root for many tx', () => {
    // bitcoin block 100000
    let input = [
      '8c14f0db3df150123e6f3dbbf30f8b955a8249b62ac1d1ff16284aefa3d06d87',
      'fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4',
      '6359f0868171b1d194cbee1af2f16ea598ae8fad666d9b012c8ed2b79a236ec4',
      'e9a66845e05d5abc0ad04ec80f774a7e585c6e8db975962d069a522137b80c1d',
    ]
      .map(reverse)
      .map(fromHex);
    let result = merkleRoot(input);
    let expected = reverse('f3e94742aca4b5ef85488dc37c06c3282295ffec960994b2c0d5ac2a25a95766');
    expect(result.toString('hex')).to.equal(expected);
  });
});
