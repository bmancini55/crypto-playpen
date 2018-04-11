const net = require('net');
const winston = require('winston');
const NoiseState = require('./noise-state');

class PeerClient {
  constructor({ localSecret, remoteSecret, ephemeralSecret, host, port = 9735 }) {
    this.noiseState = new NoiseState({ ls: localSecret, rs: remoteSecret, es: ephemeralSecret });
    this.host = host;
    this.port = port;

    this.completedAct = 0;
  }

  async connect() {
    await this._open();
  }

  async _open() {
    this.socket = net.connect({ host: this.host, port: this.port });
    this.socket.on('error', this._onError.bind(this));
    this.socket.on('data', this._onData.bind(this));
    this.socket.on('connected', this._onConnected.bind(this));
  }

  send(m) {
    this.socket.write(m);
  }

  _onError(err) {
    winston.error(err);
  }

  async _onConnected() {
    try {
      await this.noiseState.initialize();
      let m = await this.noiseState.initiatorAct1();
      this.send(m);
      this.completedAct = 1;
    } catch (err) {
      winston.error(err);
    }
  }

  async _onData(data) {
    try {
      // this should probably convert into a stream...
      this._buffer = Buffer.concat([this._buffer, data]);

      if (this.completedAct === 1 && this._buffer.length >= 50) {
        let m = this._buffer.slice(0, 50);
        this._buffer = this._buffer.slice(50);
        m = await this.noiseState.initiatorAct2Act3(m);
        this.send(m);
        this.completedAct = 3;
      } else {
        // wait for standard message length...
      }
    } catch (err) {
      winston.error(err);
    }
  }
}

module.exports = PeerClient;
