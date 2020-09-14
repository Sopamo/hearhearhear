<template>
  <div>
    <h3>WebRTC</h3>
    <div class="row">
      <div class="col">
        <video v-if="srcStream" :src-object.prop.camel="srcStream" autoplay="autoplay" />
      </div>
      <div class="col">
        <video v-if="partnerStream" :src-object.prop.camel="partnerStream" autoplay="autoplay" />
      </div>
    </div>

    <q-btn @click="onCreateOffer">Call</q-btn>
  </div>
</template>

<script>
import io from 'socket.io-client';
import WebRtc from 'src/logic/web-rtc';

export default {
  name: 'WebRtc',
  data() {
    return {
      socket: io('http://localhost:3333'),
      srcStream: null,
      partnerStream: null,
      webRtc: new WebRtc(),
    };
  },
  async mounted() {
    const userStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });

    this.srcStream = userStream;

    this.socket.emit('join');

    this.socket.on('offer', this.onHandleOffer);
    this.socket.on('answer', (payload) => this.webRtc.handleAnswer(payload.sdp));
    // this.offerPc.onnegotiationneeded = this.onNegotiationNeeded;
    this.webRtc.peer.ontrack = (event) => {
      console.log('onTrack', event);
      // eslint-disable-next-line prefer-destructuring
      this.partnerStream = event.streams[0];
    };
    userStream
      .getTracks()
      .forEach((track) => this.webRtc.peer.addTrack(track, userStream));
  },
  methods: {
    async onCreateOffer() {
      const sdp = await this.webRtc.generateOffer();
      this.socket.emit('offer', { sdp });
    },
    async onHandleOffer(payload) {
      const sdp = await this.webRtc.handleOffer(payload.sdp);
      this.socket.emit('answer', { sdp });
    },
  },
};
</script>
