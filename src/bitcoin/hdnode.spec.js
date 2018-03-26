const { expect } = require('chai');
const bip39 = require('bip39');
const { HDNode, networks } = require('bitcoinjs-lib');

let MNEUMONIC = 'image oval name degree act gentle fan champion surge bargain creek senior';

describe('hdnode', () => {
  describe('.fromSeedHex', () => {
    it('should generate node', () => {
      let hex = bip39.mnemonicToSeedHex(MNEUMONIC);
      let node = HDNode.fromSeedHex(hex);
      expect(node.getAddress()).to.equal('12dVzM8wQL8jKXGxxDZFfzpSLeQd38PJ4m');
    });
  });
  describe('.fromSeed', () => {
    it('should generate node', () => {
      let seed = bip39.mnemonicToSeed(MNEUMONIC);
      let node = HDNode.fromSeedBuffer(seed);
      expect(node.getAddress()).to.equal('12dVzM8wQL8jKXGxxDZFfzpSLeQd38PJ4m');
    });
  });
  describe('.fromBase58', () => {
    it('should generate key node', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      );
      expect(node.getAddress()).to.equal('12dVzM8wQL8jKXGxxDZFfzpSLeQd38PJ4m');
    });
  });
  describe('.getIdentifier', () => {
    it('should generate buffer', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      );
      expect(node.getIdentifier().toString('hex')).to.equal(
        '11df4c8ad780fb16a37d3c48f10257b17a8a3ba6'
      );
    });
  });
  describe('.getFingerprint', () => {
    it('should generate buffer', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      );
      expect(node.getFingerprint().toString('hex')).to.equal('11df4c8a');
    });
  });
  describe('.getPublicKeyBuffer', () => {
    it('should generate buffer', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      );
      expect(node.getPublicKeyBuffer().toString('hex')).to.equal(
        '03665ae92ccef40f12c07daccbb27344e60832079bd29d1128bf09f997fd9b1de0'
      );
    });
  });
  describe('.neutered', () => {
    it('should get public version', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      ).neutered();
      expect(node.toBase58()).to.equal(
        'xpub661MyMwAqRbcFDC7aCCB92TmmEvr2k5sxhkJg7mfvyMa42rEw4yXathxwiZp9qmbavxKh23hCZB8UVGstyjCcVdCZUuUv7ZvJ6hJ9Xr6Lh3'
      );
    });
  });
  describe('.derive', () => {
    it('should dervive the child', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      ).derive(1);
      expect(node.getAddress()).to.equal('1Ng2sKDnz9yD5gGMXs2goNCSmRh1nnmXko');
    });
  });
  describe('.deriveHardened', () => {
    it('should dervive the child', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      ).derivePath('m/1');
      expect(node.getAddress()).to.equal('1Ng2sKDnz9yD5gGMXs2goNCSmRh1nnmXko');
    });
  });
  describe('.derivePath', () => {
    it('should derive a normal path', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      ).derive(1);
      expect(node.getAddress()).to.equal('1Ng2sKDnz9yD5gGMXs2goNCSmRh1nnmXko');
    });
    it('should derive a hardeneded path', () => {
      let node = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      ).derivePath("m/1'");
      expect(node.getAddress()).to.equal('1AYtaNeA7JWb5UdyipvdsuWsQduxFv83gN');
    });
    it('should derive a bip44 bitcoin account', () => {
      let root = HDNode.fromBase58(
        'xprv9s21ZrQH143K2j7eUAfAmtX3DD6MdHN2bUphsjN4NdpbBEX6PXfH36PV6RAmLJbbamoxzhWsydbzXazb31MNiBEgTeBXXLNtoWfjWz7bPNY'
      );
      let result = root
        .deriveHardened(44)
        .deriveHardened(0)
        .deriveHardened(0)
        .derive(0)
        .derive(0);
      expect(root.derivePath("m/44'/0'/0'/0/0")).to.deep.equal(result);
    });
  });
});
