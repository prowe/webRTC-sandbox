
export interface FabricConnection2 {
    sendMessage: (payload: any) => Promise<void>;
    interestedIn: () => Set<string>; // fingerprints
    // onMessage?
}

export class WebSocketFabricConnection implements FabricConnection2 {
    private webSocket: WebSocket;

    constructor(bootstrapServerUrl: string) {
        this.webSocket = new WebSocket(bootstrapServerUrl);
    }

    async sendMessage(payload: any) {

    }

    interestedIn() {
        return new Set<string>();
    }
}