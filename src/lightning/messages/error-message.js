class ErrorMessage {
  constructor({ channel_id, data }) {
    this.type = 17;
    this.channel_id = channel_id;
    this.data = data;
  }

  static deserialize(payload) {
    let instance = new ErrorMessage();
    instance.channel_id = payload.readUInt32BE(0);

    let len = payload.readUInt16BE(4);
    instance.data = payload.slice(6, len);

    return instance;
  }

  serialize() {
    let result = Buffer.alloc(2 + 2 + this.payload.length);
    result.writeUInt16BE(this.type, 0);
    result.writeUInt16BE(this.payload.length, 2);
    for (let i = 0; i < this.payload.length; i++) {
      result.writeUInt8(this.payload[i], i + 4);
    }
    return result;
  }
}

module.exports = ErrorMessage;
