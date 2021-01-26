import { useEffect, useRef, useState } from "react";

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.1.google.com:19302" }
    ]
};


export default function Chat() {
    const webSocket = useRef<WebSocket>();
    const [socketOpen, setSocketOpen] = useState(false);
    const connection = useRef<RTCPeerConnection>();
    const [dataChannel, setDataChannel] = useState<RTCDataChannel>();

    function onIceCandidate(this: RTCPeerConnection, {candidate}: RTCPeerConnectionIceEvent) {
        console.log('got canidate', candidate)
        if (candidate) {
            webSocket.current?.send(JSON.stringify(candidate));
        }
    }

    function setupConnection(): RTCPeerConnection {
        const localConnection = new RTCPeerConnection(configuration);
        localConnection.onicecandidate = onIceCandidate;

        localConnection.ondatachannel = event => {
            console.log('got data channel');
            let receiveChannel = event.channel;
            receiveChannel.onopen = () => {
                console.log("Data channel is open and ready to be used.");
                setDataChannel(receiveChannel);
            };
            receiveChannel.onmessage = event => {
                console.log('Got data channel message: ', event.data);
            };
        };

        connection.current = localConnection;
        return localConnection;
    }

    async function onOffer(offer: RTCSessionDescriptionInit) {
        console.log("handling offer ", offer);
        const localConnection = setupConnection();
        await localConnection.setRemoteDescription(offer);
        const answer = await localConnection.createAnswer();
        localConnection.setLocalDescription(answer);
        webSocket.current?.send(JSON.stringify(answer));
        console.log('offer handled');
    }

    async function onAnswer(answer: RTCSessionDescription) {
        if (!connection.current) {
            throw new Error('no connection');
        }

        await connection.current.setRemoteDescription(answer);
        console.log('answer handled');

    }

    async function onCandidate (candidate: RTCIceCandidate) {
        await connection?.current?.addIceCandidate(candidate);
        console.log('handled candidate', candidate)
    };

    useEffect(() => {
        webSocket.current = new WebSocket("ws://localhost:8080");
        webSocket.current.onmessage = message => {
            const data = JSON.parse(message.data);
            console.log('got message ', data)
            if (data.type === 'offer') {
                onOffer(data as RTCSessionDescription);
            } else if (data.type === 'answer') {
                onAnswer(data as RTCSessionDescription);
            } else if (data.candidate) {
                onCandidate(data as RTCIceCandidate);
            }
        };
        webSocket.current.onclose = () => {
            webSocket?.current?.close();
        };
        webSocket.current.onopen = () => {
            setSocketOpen(true);
        }
        return () => webSocket?.current?.close();
    }, []);

    async function onCall() {
        try {
            const localConnection = setupConnection();
            const dataChannel = localConnection.createDataChannel("messenger");
            dataChannel.onerror = error => {
                console.error('Data channel error: ', error);
            };
            dataChannel.onopen = () => {
                console.log('data channel open');
                setDataChannel(dataChannel);
            }
            dataChannel.onmessage = event => {
                console.log('Got data channel message: ', event.data);
            };

            const offer = await localConnection.createOffer();
            localConnection.setLocalDescription(offer);
            console.log('created offer: ', offer);
            webSocket.current?.send(JSON.stringify(offer));
        } catch (e) {
            console.error(e);
        }
    }

    function onPing() {
        dataChannel?.send(JSON.stringify({
            type: 'ping',
            message: 'Hello World'
        }));
    }

    return (
        <main>
            Alert: {alert}
            {socketOpen ? 'Socket Open' : 'Loading...'
            }
            <button onClick={onCall}>Call</button>
            <button onClick={onPing}>Ping</button>
        </main>
    );
}