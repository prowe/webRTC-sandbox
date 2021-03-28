import React, { FormEvent, useEffect, useState } from 'react';

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.1.google.com:19302" }
    ]
};

function setupListeners(connection: RTCPeerConnection, name: string, other: RTCPeerConnection) {
    connection.onicecandidate = (ev) => {
        console.log(name, 'onicecandidate', ev);
        if (ev.candidate) {
            other.addIceCandidate(ev.candidate);
        }
    };
    connection.oniceconnectionstatechange = (ev) => {
        console.log(name, 'oniceconnectionstatechange', ev);
    };
    connection.onicegatheringstatechange = (ev) => {
        console.log(name, 'onicegatheringstatechange', ev);
    };
    connection.ondatachannel = (ev: RTCDataChannelEvent) => {
        console.log(name, 'ondatachannel', ev);
        ev.channel.onmessage = (messageEvent) => {
            console.log(name, 'onmessage', messageEvent);
        };
    };
}

export default function AsyncRTC() {
    // const [offerConnection, setOfferConnection] = useState<RTCPeerConnection>();
    // const [answerConnection, setAnswerConnection] = useState<RTCPeerConnection>();

    // useEffect(() => {
    //     async function setup() {
    //         const answerConnection = new RTCPeerConnection(configuration);
    //         setAnswerConnection(answerConnection);

    //         const offerConnection = new RTCPeerConnection(configuration);
    //         setupListeners(answerConnection, 'answer', offerConnection);
    //         setupListeners(offerConnection, 'offer', answerConnection);
    //         const dataChannel = offerConnection.createDataChannel('data1');
    //         offerConnection.onconnectionstatechange = (ev) => {
    //             const conn = ev.currentTarget as RTCPeerConnection;
    //             console.log('state change', conn.connectionState);
    //         };

    //         const offer = await offerConnection.createOffer();
    //         await offerConnection.setLocalDescription(offer);
    //         console.log('offer created', offer);
    //         setOfferConnection(offerConnection);

    //         await answerConnection.setRemoteDescription(offer);
    //         const answer = await answerConnection.createAnswer();
    //         await answerConnection.setLocalDescription(answer);
    //         console.log('answer', answer);
    //         await offerConnection.setRemoteDescription(answer);
    //     }
    //     setup();
    // }, []);

    const [localConnection, setLocalConnection] = useState<RTCPeerConnection>();
    const [sendChannel, setSendChannel] = useState<RTCDataChannel>();

    const [remoteConnection, setRemoteConnection] = useState<RTCPeerConnection>();
    const [receiveChannel, setReceiveChannel] = useState<RTCDataChannel>();
    const [messages, setMessages] = useState<string[]>([]);

    function receiveChannelCallback(event: RTCDataChannelEvent) {
        const receiveChannel = event.channel;
        function handleReceiveChannelStatusChange() {
            if (receiveChannel) {
                console.log("Receive channel's status has changed to ", receiveChannel.readyState);
            }
        }

        receiveChannel.onmessage = messageEvent => {
            console.log('onmessage', event);
            if (!messageEvent.data) {
                return;
            }
            setMessages((messages) => [
                ...messages,
                messageEvent.data as string
            ]);
        };
        receiveChannel.onopen = handleReceiveChannelStatusChange;
        receiveChannel.onclose = handleReceiveChannelStatusChange;
    }

    function handleSendChannelStatusChange(ev: Event) {
        console.log('send channel state change', ev);
    }

    useEffect(() => {
        const remoteConnection = new RTCPeerConnection(configuration);
        const localConnection = new RTCPeerConnection(configuration);

        remoteConnection.ondatachannel = receiveChannelCallback;
        remoteConnection.onicecandidate = async e => {
            console.log('remoteConnection', 'onicecandidate', e.candidate);
            try {
                if (e.candidate) {
                    await localConnection?.addIceCandidate(e.candidate)
                }
            } catch (e) {
                console.error(e);
            }
        };
        setRemoteConnection(remoteConnection);

        localConnection.onicecandidate = async e => {
            console.log('localConnection', 'onicecandidate', e.candidate);
            try {
                if (e.candidate) {
                    await remoteConnection?.addIceCandidate(e.candidate)
                }
            } catch (e) {
                console.error(e);
            }
        };

        const sendChannel = localConnection.createDataChannel("sendChannel");
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;

        setLocalConnection(localConnection);
        setSendChannel(sendChannel);
    }, []);

    async function onConnectClicked() {
        if (!localConnection || !remoteConnection) {
            console.error('not set', localConnection, remoteConnection);
            return;
        }

        try {
            const offer = await localConnection.createOffer();
            await localConnection.setLocalDescription(offer)

            if (localConnection.localDescription)
                await remoteConnection.setRemoteDescription(localConnection.localDescription);

            const answer = await remoteConnection.createAnswer();
            await remoteConnection.setLocalDescription(answer);

            if(remoteConnection.localDescription)
                await localConnection.setRemoteDescription(remoteConnection.localDescription);
        } catch (e) {
            console.error(e);
        }
    }

    function onDisconnectClicked() {

    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const messageInput = event.currentTarget.elements.namedItem('message') as HTMLInputElement;
        const messageText = messageInput.value;

        if(sendChannel) {
            sendChannel.send(messageText);
        }

        event.currentTarget.reset();
    }

    return (
        <main>
            <button onClick={onConnectClicked}>Connect</button>
            <button onClick={onDisconnectClicked}>Disconnect</button>

            <form onSubmit={onSubmit}>
                <label>Enter a message:
                    <input
                        type="text" name="message"
                        placeholder="Message text"
                        inputMode="text"
                        size={60}
                        maxLength={120} />
                </label>
                <button type='submit'>Send</button>
            </form>

            <div>
                <p>Messages received:</p>
                <ul>
                    {messages.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
            </div>
        </main>
    );
}