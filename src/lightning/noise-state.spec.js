const { expect } = require('chai');
const { generateKey } = require('./key');
const NoiseState = require('./noise-state');

describe('noise-state', () => {
  let sut;
  before(async () => {
    let rs = {
      pub: Buffer.from('028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7', 'hex'),
      compressed() {
        return Buffer.from(
          '028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7',
          'hex'
        );
      },
    };

    let ls = generateKey('1111111111111111111111111111111111111111111111111111111111111111');
    let es = generateKey('1212121212121212121212121212121212121212121212121212121212121212');
    sut = new NoiseState({ ls, rs, es });
  });

  describe('valid handshake', () => {
    describe('act1', async () => {
      let m;
      before(async () => {
        await sut.initialize();
        m = await sut.initiatorAct1();
      });
      it('should set the hash correctly', () => {
        expect(sut.h).to.deep.equal(
          Buffer.from('9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce', 'hex')
        );
      });
      it('should have the correct output', () => {
        expect(m).to.deep.equal(
          Buffer.from(
            '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
            'hex'
          )
        );
      });
    });

    describe('act2 and act3', () => {
      let m;
      before(async () => {
        let input = Buffer.from(
          '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
          'hex'
        );
        m = await sut.initiatorAct2Act3(input);
      });
      it('should have the correct output', () => {
        expect(m).to.deep.equal(
          Buffer.from(
            '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba',
            'hex'
          )
        );
      });
      it('should have the correct shared key', () => {
        expect(sut.rk).to.deep.equal(
          Buffer.from('bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442', 'hex')
        );
      });
      it('should have the correct shared key', () => {
        expect(sut.sk).to.deep.equal(
          Buffer.from('969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9', 'hex')
        );
      });
    });

    describe('send message', () => {
      it('should encrypt message properly', async () => {
        let m = await sut.encryptMessage(Buffer.from('68656c6c6f', 'hex'));
        expect(m).to.deep.equal(
          Buffer.from(
            'cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95',
            'hex'
          )
        );
      });
      it('should rotate the sending nonce', () => {
        expect(sut.sn).to.deep.equal(Buffer.from('000000000200000000000000', 'hex'));
      });
      it('should rotate keys correctly', async () => {
        let input = Buffer.from('68656c6c6f', 'hex');
        for (let i = 1; i < 1001; i++) {
          let m = await sut.encryptMessage(input);
          let tests = {
            1: '72887022101f0b6753e0c7de21657d35a4cb2a1f5cde2650528bbc8f837d0f0d7ad833b1a256a1',
            500: '178cb9d7387190fa34db9c2d50027d21793c9bc2d40b1e14dcf30ebeeeb220f48364f7a4c68bf8',
            501: '1b186c57d44eb6de4c057c49940d79bb838a145cb528d6e8fd26dbe50a60ca2c104b56b60e45bd',
            1000: '4a2f3cc3b5e78ddb83dcb426d9863d9d9a723b0337c89dd0b005d89f8d3c05c52b76b29b740f09',
            1001: '2ecd8c8a5629d0d02ab457a0fdd0f7b90a192cd46be5ecb6ca570bfc5e268338b1a16cf4ef2d36',
          };
          if (tests[i]) {
            expect(m).to.deep.equal(Buffer.from(tests[i], 'hex'), 'failed on message ' + i);
          }
        }
      });
    });
  });
});
