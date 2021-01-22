const WebSocket = require('ws');

const server = new WebSocket.Server({
    port: 8080,
});

server.on('connection', (ws) => {
    ws.on('message', (data) => {
        console.log('got message: ', data);
        server.clients.forEach(client => {
            if (client !== ws) {
                client.send(data);
            }
        });
    });
});