const net = require('net');
const winston = require('winston');
const NoiseState = require('./noise-state');
const { generateKey } = require('./key');
const messages = require('./messages/message-factory');
const MessageHandler = require('./message-handler');

class PeerClient {
  constructor({ localSecret, remoteSecret, host, port = 9735 }) {
    let ephemeralSecret = generateKey();
    this.noiseState = new NoiseState({ ls: localSecret, rs: remoteSecret, es: ephemeralSecret });
    this.messageHandler = new MessageHandler(this);
    this.host = host;
    this.port = port;

    this._buffer = Buffer.alloc(0);
    this.completedAct = 0;

    setInterval(this.ping.bind(this), 60000);
  }

  async ping() {
    try {
      let pingMessage = messages.construct(18);
      pingMessage.num_pong_bytes = 8;
      await this.sendMessage(pingMessage);
    } catch (ex) {
      winston.error(ex);
    }
  }

  async connect() {
    await this._open();
  }

  async _open() {
    winston.debug('connecting to', this.host, this.port);
    this.socket = net.connect({ host: this.host, port: this.port }, this._onConnected.bind(this));
    this.socket.on('error', this._onError.bind(this));
    this.socket.on('data', this._onData.bind(this));
    this.socket.on('timeout', this._onClose.bind(this));
    this.socket.on('close', this._onClose.bind(this));
  }

  async sendMessage(m) {
    winston.debug('sending', JSON.stringify(m));
    m = m.serialize();
    m = await this.noiseState.encryptMessage(m);
    this.socket.write(m);
  }

  _onClose() {
    winston.error('connection closed');
  }

  _onError(err) {
    winston.error(err);
  }

  async _onConnected() {
    try {
      await this.noiseState.initialize();
      let m = await this.noiseState.initiatorAct1();
      winston.debug('sending', m.toString('hex'));
      this.socket.write(m);
      this.completedAct = 1;
    } catch (err) {
      winston.error(err);
    }
  }

  async _onData(data) {
    try {
      winston.debug('receiving', data.toString('hex'));
      // this should probably convert into a stream...
      this._buffer = Buffer.concat([this._buffer, data]);

      if (this.completedAct === 1 && this._buffer.length >= 50) {
        let m = this._buffer.slice(0, 50);
        this._buffer = this._buffer.slice(50);
        m = await this.noiseState.initiatorAct2Act3(m);
        winston.debug('sending', m.toString('hex'));
        this.socket.write(m);
        this.completedAct = 3;

        // send init message
        await this.sendMessage(messages.construct(16));
        //
      } else if (this.completedAct === 3) {
        let l = this.l;
        this.l = undefined;

        // check if we had a length from a prior chunk
        if (!l) {
          let lc = this._buffer.slice(0, 18);
          this._buffer = this._buffer.slice(18);
          l = await this.noiseState.decryptLength(lc);
        }

        // it will be in the next message
        if (!this._buffer.length) {
          this.l = l;
          return;
        }

        let c = this._buffer.slice(0, l + 16);
        this._buffer = this._buffer.slice(l + 16);
        let m = await this.noiseState.decryptMessage(c);

        m = messages.deserialize(m);
        winston.debug('received', JSON.stringify(m));
        this.messageHandler.routeMessage(m);
      }
    } catch (err) {
      winston.error(err);
    }
  }
}

module.exports = PeerClient;
