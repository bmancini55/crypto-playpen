const PongMessage = require('./messages/pong-message');

class MessageRouter {
  constructor(peerClient) {
    this.peerClient = peerClient;
  }

  routeMessage(message) {
    if (message.type == 18) {
      let reply = new PongMessage();
      reply.createReply(message.num_pong_bytes);
      this.peerClient.sendMessage(reply);
      // complete!
    }
  }
}

module.exports = MessageRouter;
