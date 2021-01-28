
export interface FabricConnectionOptions {
    bootstrapServer: string;
    onStatusChange: (message: string) => void;
    onDataChannelMessage: (payload: any) => void;
}

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.1.google.com:19302" }
    ]
};

export default class FabricConnection {
    onStatusChange: (message: string) => void;
    onDataChannelMessage: (payload: any) => void;
    dataChannel?: RTCDataChannel;

    private _webSocket: WebSocket;
    private _peerConnection: RTCPeerConnection;

    constructor (options: FabricConnectionOptions) {
        this.onStatusChange = options.onStatusChange;
        this.onDataChannelMessage = options.onDataChannelMessage;

        this._webSocket = new WebSocket(options.bootstrapServer);
        this._webSocket.onmessage = ev => this._onWebSocketMessage(ev);
        this._webSocket.onopen = ev => this._onWebSocketOpen();

        this._peerConnection = new RTCPeerConnection(configuration);
        this._peerConnection.onicecandidate = ev => this._onIceCanidate(ev);
        this._peerConnection.ondatachannel = ev => this._onDataChannel(ev);
        const dataChannel = this._peerConnection.createDataChannel("messages");
        dataChannel.onopen = () => this._onDataChannelOpen(dataChannel);
    }

    private async _onDataChannel(event: RTCDataChannelEvent) {
        this.onStatusChange('Obtained Data Channel');
        let receiveChannel = event.channel;
        receiveChannel.onopen = () => this._onDataChannelOpen(receiveChannel);
    }

    private _onDataChannelOpen(dataChannel: RTCDataChannel) {
        this.onStatusChange("Data channel is open and ready to be used.");
        dataChannel.onmessage = ev => this._onDataChannelMessage(ev);
        this.dataChannel = dataChannel;
        this._webSocket.close();
    }

    private _onDataChannelMessage(event: MessageEvent<any>) {
        console.log('Got data channel message: ', event.data);
        const payload = JSON.parse(event.data);
        this.onDataChannelMessage(payload);
    }

    private async _onIceCanidate({candidate}: RTCPeerConnectionIceEvent) {
        console.log('got canidate: ', candidate);
        if (candidate) {
            this._webSocket.send(JSON.stringify(candidate));
        }
    }

    private async _onWebSocketOpen() {
        console.log('on status change', this.onStatusChange, this);
        this.onStatusChange('Connected to boostrap server');
        const offer = await this._peerConnection.createOffer();
        this._peerConnection.setLocalDescription(offer);

        this._webSocket.send(JSON.stringify(offer));
        this.onStatusChange('Offer sent');
    }

    private async _onOffer(offer: RTCSessionDescription) {
        this.onStatusChange('Received Offer');
        await this._peerConnection.setRemoteDescription(offer);
        const answer = await this._peerConnection.createAnswer();
        this._peerConnection.setLocalDescription(answer);
        this._webSocket.send(JSON.stringify(answer));
    }

    private async _onAnswer(answer: RTCSessionDescription) {
        this.onStatusChange(`Received Answer`);
        await this._peerConnection.setRemoteDescription(answer);
    }

    private _onWebSocketMessage(message: MessageEvent<any>) {
        const data = JSON.parse(message.data);
        console.log('got message ', data)
        switch (data.type) {
            case 'offer':
                this._onOffer(data as RTCSessionDescription);
                break;
            case 'answer':
                this._onAnswer(data as RTCSessionDescription);
                break;
            default:
                const candidate = data as RTCIceCandidate;
                this._peerConnection.addIceCandidate(candidate);
        }
    }
}