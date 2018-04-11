let BufferReader = require('../buffer-reader');
let BufferWriter = require('../buffer-writer');

class ChannelAnnouncement {
  constructor({
    node_signature_1,
    node_signature_2,
    bitcoin_signature_1,
    bitcoin_signature_2,
    features,
    chain_hash,
    short_channel_id,
    node_id_1,
    node_id_2,
    bitcoin_key_1,
    bitcoin_key_2,
  }) {
    this.type = 256;
    this.node_signature_1 = node_signature_1;
    this.node_signature_2 = node_signature_2;
    this.bitcoin_signature_1 = bitcoin_signature_1;
    this.bitcoin_signature_2 = bitcoin_signature_2;
    this.features = features;
    this.chain_hash = chain_hash;
    this.short_channel_id = short_channel_id;
    this.node_id_1 = node_id_1;
    this.node_id_2 = node_id_2;
    this.bitcoin_key_1 = bitcoin_key_1;
    this.bitcoin_key_2 = bitcoin_key_2;
  }

  static deserialize(payload) {
    let instance = new ChannelAnnouncement();
    let reader = BufferReader.from(payload);
    instance.node_signature_1 = reader.readBytes(8);
    instance.node_signature_2 = reader.readBytes(8);
    instance.bitcoin_signature_1 = reader.readBytes(8);
    instance.bitcoin_signature_2 = reader.readBytes(8);

    let len = reader.readUInt16();
    instance.features = reader.readBytes(len);
    instance.chain_hash = reader.readBytes(4);
    instance.short_channel_id = reader.readUInt8();
    instance.node_id_1 = reader.readBytes(33);
    instance.node_id_2 = reader.readBytes(33);
    instance.bitcoin_key_1 = reader.readBytes(33);
    instance.bitcoin_key_2 = reader.readBytes(33);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(172 + this.features.length);
    let writer = BufferWriter.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.node_signature_1);
    writer.writeBytes(this.node_signature_2);
    writer.writeBytes(this.bitcoin_signature_1);
    writer.writeBytes(this.bitcoin_signature_2);
    writer.writeUInt16BE(this.features.length);
    writer.writeBytes(this.features);
    writer.writeBytes(this.chain_hash);
    writer.writeBytes(this.short_channel_id);
    writer.writeBytes(this.node_id_1);
    writer.writeBytes(this.node_id_2);
    writer.writeBytes(this.bitcoin_key_1);
    writer.writeBytes(this.bitcoin_key_2);
    return result;
  }
}

module.exports = ChannelAnnouncement;
