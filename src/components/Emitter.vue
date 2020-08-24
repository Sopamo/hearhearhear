<template>
<div>
  <q-btn @click="emit">Play teh tunes</q-btn>
  <q-slider @input="handleVolumeChange" v-model="volume" :min="0.05" :step="0.05" :max="1"/>
  <q-slider v-model="frequency" :min="0" :max="20000"/>
  <canvas width="400" height="200" id="oscilloscope" />
</div>
</template>

<script>
export default {
  data() {
    return {
      audioCtx: null,
      gainNode: null,
      oscillator: null,
      analyser: null,
      isStarted: false,
      volume: 0.01,
      frequency: 440,
    };
  },
  mounted() {
    this.setup();
    this.setupAnalyzer();
  },
  watch: {
    frequency() {
      this.setFrequency(this.frequency);
    },
  },
  methods: {
    setup() {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      this.gainNode = this.audioCtx.createGain();
      this.setVolume(0);

      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = 'square';
      this.setFrequency(this.frequency);
      this.oscillator.connect(this.gainNode);
    },
    emit() {
      if (!this.isStarted) {
        this.isStarted = true;
        this.oscillator.start();
        this.setFrequencies();
      }
      this.setVolume(this.volume);
    },
    handleVolumeChange() {
      if (this.volume) {
        this.setVolume(this.volume);
      }
    },
    setVolume(volume) {
      this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    },
    setFrequency(frequency) {
      this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    },
    setFrequencies() {
      const bits = [0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1];
      // The amount of bits per second
      const density = 10;
      const now = this.audioCtx.currentTime + 1;
      const low = 440;
      const high = 523;
      this.oscillator.frequency.setValueAtTime(200, this.audioCtx.currentTime);
      bits.forEach((bit, idx) => {
        let frequency = low;
        if (bit) {
          frequency = high;
        }
        this.oscillator.frequency.setValueAtTime(frequency, now + (idx * (1 / density)));
      });
      this.oscillator.frequency.setValueAtTime(200, now + (bits.length * (1 / density)));
    },
    setupAnalyzer() {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.connect(this.audioCtx.destination);
      this.gainNode.connect(this.analyser);
      this.analyser.fftSize = 2048;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);

      const canvas = document.getElementById('oscilloscope');
      const canvasCtx = canvas.getContext('2d');

      const that = this;
      const draw = () => {
        requestAnimationFrame(() => { draw.call(that); });

        this.analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * (1.0 / bufferLength);
        let x = 0;

        for (let i = 0; i < bufferLength; i += 1) {
          const v = dataArray[i] / 128.0;
          const y = v * (canvas.height / 2);

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };

      draw();
    },
  },
};
</script>
