
# The Protocol

## Bootstrap Server
Listens on a websocket. The first connection is held, when the second is connected, pair it with the first, the third is paird with the fourth, etc.

When a message is recieved, forward it to the paired connection.

## Gossip

Each node contains `L` connections to other nodes. For each connection it maintains a set of "interested in public keys". When it recieves a post, it forwards it to all interested nodes and decrements the TTL on those messages.

Nodes drop messages that have a TTL of 1.

Nodes can also send an interest message. This message lists public keys that the node is interested in.
When a Node recieves an interest message, it stores interest in the connection and forwards the interest message to connected nodes.

If a node does not renew interest after `x` amount of time it looses interest in that public key./fingerprint

## An Account
Consists of
- A public/private key pair
- A List of public keys that are being followed:
    - Each key can have an 'Alias' that is a user provided name for the key
- A timeline of messages recently received.

## References

- https://blog.logrocket.com/get-a-basic-chat-application-working-with-webrtc/
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto


## How should the network be wired?
Websockets and RTCDataChannel are just bi-directional pipes. Can we use them interchangebly?

