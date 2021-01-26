import { useEffect, useReducer, useRef } from "react";
import FabricConnection from "./FabricConnection";
import useFabricConnection from "./useFabricConnection"

function statusMessagesReducer(currentMessages: string[], message: string): string[] {
    return [message, ...currentMessages];
}

function payloadReducer(currentMessages: any[], message: any): any[] {
    return [message, ...currentMessages];
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
    }, [])

    return (
        <section>
            <ul>
                {statusMessages.map((message, index) => <li key={index}>{message}</li>)}
            </ul>
            <ul>
                {messages.map((message, index) => <li key={index}>{JSON.stringify(message)}</li>)}
            </ul>
        </section>
    );
}