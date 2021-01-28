import { FormEvent, useEffect, useReducer, useRef, useState } from "react";
import FabricConnection from "./FabricConnection";

function statusMessagesReducer(currentMessages: string[], message: string): string[] {
    return [message, ...currentMessages];
}

function payloadReducer(currentMessages: any[], message: any): any[] {
    return [message, ...currentMessages];
}

function SendMessageForm({dataChannel}: {dataChannel: RTCDataChannel}) {
    const [message, setMessage] = useState<string>('');

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        dataChannel.send(JSON.stringify({message}));
    }

    return (
        <form onSubmit={onSubmit}>
            <textarea onChange={e => setMessage(e.currentTarget.value)} value={message} />
            <button type='submit'>Send</button>
        </form>
    )
}

export default function Chat2() {
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
            {dataChannel && <SendMessageForm dataChannel={dataChannel} />}

        </section>
    );
}