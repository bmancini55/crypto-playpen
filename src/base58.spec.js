let { expect } = require('chai');
let base58 = require('./base58');

describe('base58', () => {
    describe('encode', () => {
        it('should encode to base58', () => {
            let input = '0202a406624211f2abbdc68da3df929f938c3399dd79fac1b51b0e4ad1d26a47aa';
            let expected =
                'Kmo4Bt66sguXw9GfC8Ynht7dme5Tzrpe85wjn4ekpmacHuwjCQ7Tk8x5aYAQchZfnHK7ho891qJ4NjW7qybsNwjHaQ';
            let result = base58.encode(input);
            expect(result).to.equal(expected);
        });
    });
    describe('decode', () => {
        it('should decode to plaintext', () => {
            let input =
                'Kmo4Bt66sguXw9GfC8Ynht7dme5Tzrpe85wjn4ekpmacHuwjCQ7Tk8x5aYAQchZfnHK7ho891qJ4NjW7qybsNwjHaQ';
            let expected = '0202a406624211f2abbdc68da3df929f938c3399dd79fac1b51b0e4ad1d26a47aa';
            let result = base58.decode(input);
            expect(result).to.equal(expected);
        });
    });
});
