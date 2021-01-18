import { FormEvent, useEffect, useReducer, useState } from 'react';

const config: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    }
  ],
};
const peerConnection = new RTCPeerConnection(config);

(window as any).peerConnection = peerConnection;

function iceReducer(canidates: RTCIceCandidate[], newCanidate: RTCIceCandidate): RTCIceCandidate[] {
  return [...canidates, newCanidate];
}

function Agent() {
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>();
  const [iceCanidates, addIceCandiates] = useReducer(iceReducer, []);

  useEffect(() => {
    peerConnection.addEventListener('connectionstatechange', () => {
      setConnectionState(peerConnection.connectionState);
    });

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        addIceCandiates(event.candidate);
      }
    };

    peerConnection.onicecandidateerror = (ev: RTCPeerConnectionIceErrorEvent) => {
      console.error(ev);
    };

    peerConnection.oniceconnectionstatechange = (event: Event) => {
      console.log('Ice Connection State', peerConnection.iceConnectionState);
    };

  }, []);

  const [localDescription, setLocalDescription] = useState<RTCSessionDescriptionInit>();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
  const [messages, setMessages] = useState<any[]>([]);

  async function initCall() {
    const newChannel = peerConnection.createDataChannel('my-channel');
    setDataChannel(newChannel);
    newChannel.onmessage = ((ev: MessageEvent<any>) => {

    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    setLocalDescription(offer);
  }

  async function onAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sdpInput = event.currentTarget.elements.namedItem('offer') as HTMLTextAreaElement;
    const offer = JSON.parse(sdpInput.value) as RTCSessionDescriptionInit;

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    if (!localDescription) {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      setLocalDescription(answer);
    }
  }

  async function addCanidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sdpInput = event.currentTarget.elements.namedItem('canidate') as HTMLTextAreaElement;
    const canidate = JSON.parse(sdpInput.value) as RTCIceCandidate;
    await peerConnection.addIceCandidate(canidate);
  }

  return (
    <section>
      <div>Connection State: {connectionState}</div>
      {peerConnection.signalingState}
      Canidates:
      <ul>
        {iceCanidates.map((canidate, i) => (
          <li key={i}>
            <code lang='json'>{JSON.stringify(canidate, null, 2)}</code>
          </li>
        ))}
      </ul>
      <div>
        <button onClick={initCall}>Create Call</button>
        <label>
          Local SDP:
          <code lang='json'>{JSON.stringify(localDescription, null, 2)}</code>
        </label>
      </div>

      <form onSubmit={onAnswer}>
        <label>
          Remote SDP:
          <textarea required name='offer' rows={5} cols={80}></textarea>
        </label>
        <button type='submit'>Answer</button>
      </form>

      <form onSubmit={addCanidate}>
        <label>
          Add Canidate:
          <textarea required name='canidate' rows={5} cols={80}></textarea>
          <button type='submit'>Add</button>
        </label>
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
