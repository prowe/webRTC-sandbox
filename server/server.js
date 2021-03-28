const WebSocket = require('ws');

const server = new WebSocket.Server({
    port: 8080,
});

let onDeck = null;

function pairIfPossible(ws) {
    if (onDeck == null) {
        onDeck = ws;
    } else {
        onDeck.otherSide = ws;
        ws.otherSide = onDeck;
        ws.send({
            type: 'NEED_OFFER'
        })
        onDeck = null;
    }
}

server.on('connection', (ws) => {


    ws.on('message', (data) => {
        console.log('got message: ', data);
        if (ws.otherSide) {
            ws.otherSide.send(data);
        } else {
            console.warn('no otherside');
        }
    });
});