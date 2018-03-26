const { expect } = require('chai');
const bip39 = require('bip39');

describe('bip39', () => {
  describe('.generateMnemonic', () => {
    it('should default to 12 words', () => {
      let result = bip39.generateMnemonic();
      expect(result.split(' ').length).to.equal(12);
    });
    it('should allow 24 words', () => {
      let result = bip39.generateMnemonic(256);
      expect(result.split(' ').length).to.equal(24);
    });
  });
  describe('.validateMnemonic', () => {
    it('should return true for valid mnemonics', () => {
      let mnemonic = 'image oval name degree act gentle fan champion surge bargain creek senior';
      let result = bip39.validateMnemonic(mnemonic);
      expect(result).to.be.true;
    });
    it('should return false for invalid mnemonics', () => {
      let mnemonic = 'mage oval name degree act gentle fan champion surge bargain creek senior';
      let result = bip39.validateMnemonic(mnemonic);
      expect(result).to.be.false;
    });
  });
  describe('.mnemonicToSeed', () => {
    it('should return the seed as a buffer', () => {
      let mnemonic = 'image oval name degree act gentle fan champion surge bargain creek senior';
      let result = bip39.mnemonicToSeed(mnemonic);
      expect(result.toString('hex')).to.deep.equal(
        '733513d56d61c33b04e2fb644779084caebc0941a8dddd484d937fe3b804567a6824197ee6159fc95828a1b7a48a596a64128b01a3f82f5c4872bb26014f7e34'
      );
    });
  });
  describe('.mnemonicToSeedHex', () => {
    it('should return the seed as a hex string', () => {
      let mnemonic = 'image oval name degree act gentle fan champion surge bargain creek senior';
      let result = bip39.mnemonicToSeedHex(mnemonic);
      expect(result).to.deep.equal(
        '733513d56d61c33b04e2fb644779084caebc0941a8dddd484d937fe3b804567a6824197ee6159fc95828a1b7a48a596a64128b01a3f82f5c4872bb26014f7e34'
      );
    });
  });
  describe('.mnemonicToEntropy', () => {
    it('should return the entropy as a string', () => {
      let mnemonic = 'image oval name degree act gentle fan champion surge bargain creek senior';
      let result = bip39.mnemonicToEntropy(mnemonic);
      expect(result).to.equal('7153b64b1ce026c254b130da4254cce1');
    });
  });
  describe('.entropyToMnemonic', () => {
    it('should return the mneomonic as a string', () => {
      let entropy = '7153b64b1ce026c254b130da4254cce1';
      let result = bip39.entropyToMnemonic(entropy);
      expect(result).to.equal(
        'image oval name degree act gentle fan champion surge bargain creek senior'
      );
    });
  });
});
