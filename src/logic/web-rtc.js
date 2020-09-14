export default class WebRtc {
  peer = null;

  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [],
    });
  }

  async generateOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    console.log('generate Offer', this.peer.localDescription);
    return this.peer.localDescription;
  }

  async handleOffer(sdp) {
    const session = new RTCSessionDescription(sdp);
    await this.peer.setRemoteDescription(session);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    console.log('handle Offer, generate Answer', this.peer.localDescription);

    return this.peer.localDescription;
  }

  async handleAnswer(sdp) {
    const session = new RTCSessionDescription(sdp);
    await this.peer.setRemoteDescription(session);

    console.log('handle answer', session);
  }
}
