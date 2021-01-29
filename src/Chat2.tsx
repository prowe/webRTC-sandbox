// import SignJWT from "jose/dist/browser/jwt/sign";
import { FormEvent, useEffect, useReducer, useRef, useState } from "react";
import FabricConnection from "./FabricConnection";

function statusMessagesReducer(currentMessages: string[], message: string): string[] {
    return [message, ...currentMessages];
}

function payloadReducer(currentMessages: any[], message: any): any[] {
    return [message, ...currentMessages];
}


interface Envelope {
    ttl: number;
    payload: string;
    publicKey: JsonWebKey;
    signature: string;
}

interface SendMessageFormProps {
    keyPair: CryptoKeyPair;
    dataChannel: RTCDataChannel;
}
function SendMessageForm({dataChannel, keyPair}: SendMessageFormProps) {
    const [message, setMessage] = useState<string>('');
    const [jwk, setJwk] = useState<JsonWebKey>();

    useEffect(() => {
        crypto.subtle.exportKey("jwk", keyPair.publicKey)
            .then(jwk => setJwk(jwk));
    }, [keyPair]);

    async function sendPost() {
        const header = {
            typ: 'JWT',
            jwk,
        };
        const payload = {
            type: 'post',
            message
        };
        const encodedHeader = atob(JSON.stringify(header));
        const encodedPayload = atob(JSON.stringify(payload));
        const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
        const signature = await crypto.subtle.sign(keyPair.publicKey.algorithm, keyPair.publicKey, data);
        const signedJWT = `${encodedHeader}.${encodedPayload}.${signature}`;

        // const signedJWT = await new SignJWT(payload)
        // .setProtectedHeader({
        //   jwk,
        // })
        // .sign(keyPair.privateKey);
        console.log('Generated', signedJWT);
        dataChannel.send(signedJWT);
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        sendPost();
    }

    return (
        <form onSubmit={onSubmit}>
            <textarea onChange={e => setMessage(e.currentTarget.value)} value={message} />
            <button type='submit'>Send</button>
        </form>
    );
}

export interface Chat2Props {
    keyPair: CryptoKeyPair;
}

export default function Chat2({keyPair}: Chat2Props) {
    const fabricConnection = useRef<FabricConnection>();
    const [statusMessages, addStatusMessage] = useReducer(statusMessagesReducer, []);
    const [messages, addPayload] = useReducer(payloadReducer, []);

    useEffect(() => {
        fabricConnection.current = new FabricConnection({
            bootstrapServer: 'ws://localhost:8080',
            onStatusChange: message => addStatusMessage(message),
            onDataChannelMessage: addPayload,
        });
    }, []);

    const dataChannel = fabricConnection.current?.dataChannel;

    return (
        <section>
            <ul>
                {statusMessages.map((message, index) => <li key={index}>{message}</li>)}
            </ul>
            <ul>
                {messages.map((message, index) => <li key={index}>{JSON.stringify(message)}</li>)}
            </ul>
            {dataChannel && <SendMessageForm dataChannel={dataChannel} keyPair={keyPair}/>}

        </section>
    );
}