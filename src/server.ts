// Code modified from example on this blog:
// https://medium.com/factory-mind/websocket-node-js-express-step-by-step-using-typescript-725114ad5fe4

import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'ws';

const enum RPC_TYPE {
  GROUP = 'group',
  DEVICE = 'device'
}

interface ClientRpcMessage {
  from: {
    deviceId: string,
    groupId: string,
  },
  to: {
    type: RPC_TYPE,
    id: string
  }
  data: {
    type: string,
    msg?: any
  }
}

interface MyWebSocket extends WebSocket {
  deviceId: string
  groupId: string
}

const app = express();

// Create an HTTP server.
const httpServer = http.createServer(app);

// Create a WebSocket server.
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws: MyWebSocket, req: http.IncomingMessage) => {
  let deviceId = req.headers['deviceId'];
  let groupId = req.headers['groupId'];

  console.log(
    'A client connected with device ID [%s] and group ID [%s]!',
    deviceId,
    groupId
  );

  ws.on('message', onMessage.bind(null, ws));
});

// ==================================
// Start the HTTP server.
// ==================================
const PORT = process.env.PORT || 8999
httpServer.listen(PORT, () => {
  let serverAddress = <AddressInfo>httpServer.address();
  console.log(`Server started on port ${serverAddress.port}`);
});

// ==================================
// Business logic functions
// ==================================

function onMessage(ws: MyWebSocket, message: string) {
  // Log the received message.
  console.log('==========================');
  console.log('Received RPC!');
  console.log('Message: %s', message);

  // Parse string message into structure RPC object.
  let rpc = parseRpcMessage(ws, message);

  if (!rpc) {
    return;
  }

  // Set or update the device and group IDs for the connection.
  ws.deviceId = rpc.from.deviceId;
  console.log('Sender device ID: %s', ws.deviceId);
  ws.groupId = rpc.from.groupId;
  console.log('Sender group ID: %s', ws.groupId);
  console.log('==========================');

  // Process client RPC message.
  let msgToForward = {
    from: rpc.from,
    data: rpc.data
  };
  console.log('Message to foward: %j', msgToForward);

  wss.clients.forEach(client => {
    if (!rpc) {
      return;
    }

    // Do not send messages back to sender
    if (client != ws) {
      let otherDevice = <MyWebSocket>client;
      let shouldSend = false;

      if (rpc.to.type === RPC_TYPE.GROUP && otherDevice.groupId === rpc.to.id) {
        shouldSend = true;
        console.log('Forwarding message to group [%s].', rpc.to.id);
      }

      if (rpc.to.type == RPC_TYPE.DEVICE && otherDevice.deviceId === rpc.to.id) {
        shouldSend = true;
        console.log('Forwarding message to device [%s].', rpc.to.id);
      }

      if (shouldSend) {
        client.send(JSON.stringify(msgToForward));
      }
    }
  });
  console.log('==========================');
}

function parseRpcMessage(ws: MyWebSocket, message: string): Readonly<ClientRpcMessage> | undefined {
  let rpc;
  try {
    rpc = JSON.parse(message);
    console.log('rpc = %j', rpc);
  } catch (e) {
    console.log('Error parsing JSON from message: %s', message);
    ws.send('Failed to parse the message as JSON.');
    return;
  }

  if (!isValidFormat(rpc)) {
    // TODO: Would be nice to have real validation with useful error messages.
    let errorMsg = 'Message failed format validation check.';
    console.log(errorMsg);
    ws.send(errorMsg);
    return;
  }

  return rpc;
}

function isValidFormat(msg: any): boolean {
  if (
    msg.from === undefined ||
    msg.from.deviceId === undefined ||
    msg.from.groupId === undefined
  ) {
    console.log('Missing fields: msg.from OR msg.from.deviceId OR msg.from.groupId');
    return false;
  }

  if (
    msg.to === undefined ||
    msg.to.type === undefined ||
    msg.to.id === undefined
  ) {
    console.log('Missing fields: msg.to OR msg.to.type OR msg.to.id');
    return false;
  }

  if (msg.data === undefined || msg.data.type === undefined || msg.data.msg === undefined) {
    console.log('Missing fields: msg.data OR msg.data.type OR msg.data.msg');
    return false;
  }

  // return msg.type === undefined ||
  //   msg.sender === undefined ||
  //   msg.sender.deviceId === undefined ||
  //   msg.sender.groupId === undefined ||
  //   msg.data === undefined ||
  //   msg.data.type === undefined ||
  //   msg.data.msg === undefined;

  return true;
}
