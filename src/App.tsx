import { FormEvent, useEffect, useReducer, useRef, useState } from 'react';

const config: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    }
  ],
};

function iceReducer(canidates: RTCIceCandidate[], newCanidate: RTCIceCandidate): RTCIceCandidate[] {
  return [...canidates, newCanidate];
}

function Agent() {
  const [, rerender] = useReducer((val: number) => val++, 0);
  const [webSocket] = useState<WebSocket>(() => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      console.log('ws opened');
    };
    return ws;
  });
  const [peerConnection] = useState<RTCPeerConnection>(() => {
    const conn = new RTCPeerConnection(config);
    return conn;
  });
  const [sendChannel, setSendChannel] = useState<RTCDataChannel>();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    peerConnection.onicecandidate = ({candidate}: RTCPeerConnectionIceEvent) => {
      if (candidate) {
        console.log('Got canidate: ', candidate);
        webSocket.send(JSON.stringify({candidate}));
      }
      rerender();
    };
    peerConnection.onicecandidateerror = (ev: RTCPeerConnectionIceErrorEvent) => {
      console.error(ev);
    };
    peerConnection.onconnectionstatechange = () => {
      rerender();
    };
    peerConnection.onsignalingstatechange = () => {
      rerender();
    };
    peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
      console.log('Got data channel event: ', event);
    };
  }, [peerConnection, webSocket]);

  useEffect(() => {
    webSocket.onmessage = async (ev: MessageEvent<any>) => {
      console.log('Got WS message', ev);
      const payload = JSON.parse(ev.data);

      if (payload.offer) {
        await peerConnection.setRemoteDescription(payload.offer);
        const answer = await peerConnection.createAnswer();
        peerConnection.setLocalDescription(answer);
        console.log('Created answer: ', answer);
        webSocket.send(JSON.stringify({answer}));
      }

      if (payload.answer) {
        console.log('Got answer ', payload.answer);
        await peerConnection.setRemoteDescription(payload.answer);
      }

      if (payload.canidate) {
        await peerConnection.addIceCandidate(payload.canidate);
      }
    };
  }, [webSocket, peerConnection]);

  async function initCall() {
    const dataChannel = peerConnection.createDataChannel('message-channel');
    dataChannel.onopen = () => console.log('send channel opened');
    dataChannel.onclose = () => console.log('send channel closed');
    setSendChannel(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    webSocket.send(JSON.stringify({offer}));

    peerConnection.ondatachannel = (ev: RTCDataChannelEvent) => {
      console.log('Data channel event: ', ev);
    };
  }

  // async function onAnswer(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   const sdpInput = event.currentTarget.elements.namedItem('offer') as HTMLTextAreaElement;
  //   const offer = JSON.parse(sdpInput.value) as RTCSessionDescriptionInit;

  //   peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  //   if (!localDescription) {
  //     const answer = await peerConnection.createAnswer();
  //     await peerConnection.setLocalDescription(answer);
  //     setLocalDescription(answer);
  //   }
  // }

  // async function addCanidate(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   const sdpInput = event.currentTarget.elements.namedItem('canidate') as HTMLTextAreaElement;
  //   const canidate = JSON.parse(sdpInput.value) as RTCIceCandidate;
  //   await peerConnection.addIceCandidate(canidate);
  // }

  const [currentMessage, setCurrentMessage] = useState('');
  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendChannel?.send(JSON.stringify({message: currentMessage}));
    setCurrentMessage('');
  }

  return (
    <section>
      <button onClick={initCall}>Create Call</button>
      <div>Connection State: {peerConnection.connectionState}</div>
      <div>Signaling State: {peerConnection.signalingState}</div>

      <form onSubmit={sendMessage}>
        <input
          value={currentMessage}
          onChange={e => setCurrentMessage(e.currentTarget.value)}
        />
        <button type='submit'>Send</button>
      </form>
    </section>
  );
}

function App() {
  return (
    <div >
      <h1>Hello Web RTC</h1>
      <Agent />
    </div>
  );
}

export default App;
