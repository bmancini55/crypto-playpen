/**
 * This is an example of using bitcoinjs-lib to construct the funding transaction test vector from Bolt #3
 * https://github.com/lightningnetwork/lightning-rfc/blob/v4.0.3/03-transactions.md#appendix-b-funding-transaction-test-vectors
 *
 * This example is not entirely complete, but is suffient to for understanding.
 */

const bitcoin = require('bitcoinjs-lib');
const OPS = require('bitcoin-ops');
const secp256k1 = require('secp256k1');
const bip69 = require('bip69');

let funding_txid = 'fd2105607605d2302994ffea703b09f66b6351816ee737a93e42a841ea20bbad';
let funding_output_index = 0;
// let input_satoshis = 5000000000;
let funding_amount_satosis = 10000000;
// let feerate_per_kw = 15000;
let change_satoshis = 4989986080;
let funding_privkey = Buffer.from(
  '6bd078650fcee8444e4e09825227b801a1ca928debb750eb36e6d56124bb20e8',
  'hex'
);
let funding_pubkey = secp256k1.publicKeyCreate(funding_privkey);
let local_funding_pubkey = Buffer.from(
  '023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb',
  'hex'
);
let remote_funding_pubkey = Buffer.from(
  '030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1',
  'hex'
);

console.log(`
#####################################################################
# STEP 1 - construct a new tx builder
#
# This object has an empty __input property where signatures will eventually be stored.
# It also has an empty __tx property where the tx that is being built is stored.
#
# Refer to:
#  https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js

`);
let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
console.log(txb);

console.log(`
#####################################################################
# STEP 2 - add a p2pkh input
#
# Adding an input uses the txId and output index. After being added
# they have an empty script property. This will be populated later
# (during sign and build steps).

`);
txb.addInput(funding_txid, funding_output_index);
console.log(txb.__tx);

console.log(`
#####################################################################
# STEP 3 - construct a compiled script
#
# Generating the script uses the scritp compiler to build a script
# from op codes. We will use this in the subsequent steps to
#
# Refer to:
#  https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/script.js

`);
let redeemScript = bitcoin.script.compile([
  bitcoin.script.number.encode(2),
  local_funding_pubkey,
  remote_funding_pubkey,
  bitcoin.script.number.encode(2),
  OPS.OP_CHECKMULTISIG,
]);
console.log(redeemScript);

console.log(`
#####################################################################
# STEP 4 - construct a p2wsh payment object
#
# The bitcoin.payments.p2wsh and otherp payment types that are defined
# in v4 of bitcoinjs-lib create payment objects that are used in
# a variety of stages throughout the journey.
#
# In this case, the user must supply a redeem object that contains an
# output property.
#
# The resulting object will also have an output object. The output
# property is defined a script.compile function in the format
# OP_o <hash>
#
# The hash property is defined as the sha256(redeem.output), or the
# sha256 of the redeem script buffer value.
#
# Refer to:
#  https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/payments/p2wsh.js#L80

`);
let primaryOutput = bitcoin.payments.p2wsh({
  redeem: { output: redeemScript, network: bitcoin.networks.testnet },
  network: bitcoin.networks.testnet,
});
console.log(primaryOutput);
console.log('\n.output\n');
console.log(primaryOutput.output);

console.log(`
#####################################################################
# STEP 5 - create a raw output object for use by bip69 sorting
#
# Given our output property which is the buffer of the script
# we can generate a simply output property that contains the
# script and the value of the output for use in bip69 sorting.

`);
let primaryOutputRaw = {
  script: primaryOutput.output,
  value: funding_amount_satosis,
};
console.log(primaryOutputRaw);

console.log(`
#####################################################################
# STEP 6 - create a p2wpkh that pays out to our pubkey
#
# This step is identical to step 4 except for a p2wpkh operation

`);
let changeOutput = bitcoin.payments.p2wpkh({
  pubkey: funding_pubkey,
  network: bitcoin.networks.testnet,
});
console.log(changeOutput);
console.log('\n.output\n');
console.log(changeOutput.output);

console.log(`
#####################################################################
# STEP 7 - create a raw output object for use by bip69 sorting
#
# This step is identical to step 6 except for a p2wpkh operation

`);
let changeOutputRaw = {
  script: changeOutput.output,
  value: change_satoshis,
};
console.log(changeOutputRaw);

console.log(`
#####################################################################
# STEP 8 - sort outputs via bip69
#

`);
let sortedOutputs = bip69.sortOutputs([primaryOutputRaw, changeOutputRaw]);
console.log(sortedOutputs);

console.log(`
#####################################################################
# STEP 9 - attach sorted outputs to the tx
#

`);
for (let sortedOutput of sortedOutputs) {
  txb.addOutput(sortedOutput.script, sortedOutput.value);
}
console.log(txb.__tx);

console.log(`
#####################################################################
# STEP 10 - sign vin[0]
#
# This is a complicated step. The goal of this step is to generate the
# values __inputs that will be used by the builder to complete the tx.
#
# When .sign is called:
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L642
#
#   The input is checked and if it can't yet be signed "prepareInput" is called.
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L220
#
#   prepareInput will determine the type of input, in this case it's a p2pkh operation:
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L364
#
#   it will create an "input" object.  This object has a prevOutScript defined
#   as the standard output script from the p2pkh object:
#
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/payments/p2pkh.js#L58
#
#   This object uses the standard "OP_DUP OP_HASH160 <hash160(pubkey)> OP_EQUALVERIFY OP_CHECKSIG"
#   script and uses the supplied pubkey to construct the proper input script.
#
#   The input script is necessary to perform the signature. OP_CHECKSIG has some specific rules
#   about how the signature is constructed. Therefore, the signature must construct the
#   script the same way as it is in the output (in theory you could go look it up for this type
#   of transaction).
#
#   Now that the inputs have been prepared, .sign will call the hashForSignature method
#   on the tx:
#
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L682
#
#   which is defined:
#
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction.js#L254
#
#   hashForSignature will do the necessary work to build the signature message (hash)
#   which retures removing OP_CODESEPERATOR and for SIGHASH_ALL will mark all other inputs with
#   an empty script and retain the cleaned script for the hash
#
#   Finally, the transaction is serialized and the transaction hash type is appended
#   and a double-sha256 hash is performed and returned.
#
#   Now the hash is returned the sign method in the transaction builder.
#
#   The txbuilder will sign the signatureHash and slap it in the inputs.signatures[i] for use
#   by the builder at a later step!
#   https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L695
`);
txb.sign(0, bitcoin.ECPair.fromPrivateKey(funding_privkey, { network: bitcoin.networks.testnet }));
console.log(txb);
console.log('\n__inputs', txb.__inputs);
console.log('\n__tx', txb.__tx);

console.log(`
#####################################################################
# STEP 11 - construct the tx
#
# Now the builder is used to compile the completed transaction.
# This method will iterate over all inputs and attempt to construct the
# proper scriptSig.
#
# https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L596
#
# Internally a build function is called for each input
# https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L378
#
# This function, using the appropriate type, will supply the information that is needed to
# construct the proper scriptSig for the transaction.
#
# For the example of a p2pkh the payments.p2pkh object is supplied with a pubkey and signature
# (of which was obtained from the input object).
#  https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L387
#
# And then the payment object has an input property (similar to output) that will construct
# the necessary script.
# https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/payments/p2pkh.js#L76
#
# Finally the build method will take that input script and replace the input.script
# property inside the transaction. This is what will be used in the toHex method.
`);
let tx = txb.build();
console.log(tx);

console.log(`
#####################################################################
# STEP 12 - convert to hex
#
# This method iterates through object and serializes it into a buffer
# and subsequent hex.
#
# https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction.js#L418
#
# This method will add:
#  1. version - int32le
#  2. ins length - varint
#  3. inputs - each
#       hash - 32-bytes
#       index - uint32le
#       scriptLen - varint
#       script - varbytes
#       sequence - uint32le
#  4. outs length - varint
#  5. outputs - each {
#       value - uint64le
#       scriptLen - varint
#       script - varbytes
#  6. locktime - uint32le
`);
let actual = tx.toHex();
console.log(actual);

console.log();
let expected =
  '0200000001adbb20ea41a8423ea937e76e8151636bf6093b70eaff942930d20576600521fd000000006b48304502210090587b6201e166ad6af0227d3036a9454223d49a1f11839c1a362184340ef0240220577f7cd5cca78719405cbf1de7414ac027f0239ef6e214c90fcaab0454d84b3b012103535b32d5eb0a6ed0982a0479bbadc9868d9836f6ba94dd5a63be16d875069184ffffffff028096980000000000220020c015c4a6be010e21657068fc2e6a9d02b27ebe4d490a25846f7237f104d1a3cd20256d29010000001600143ca33c2e4446f4a305f23c80df8ad1afdcf652f900000000';
console.log(expected);
console.log('\nmatch expected', actual === expected);

// transaction input signing...
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L642
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L220

// prepares an input since it is assumed to be a p2pkh without anything...
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L364

// transaction.hashForSignature
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction.js#L254

// tx.build
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/transaction_builder.js#L378

// in payment type, it generates an "input" property
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.3/src/payments/p2pkh.js#L58
