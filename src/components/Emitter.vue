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
      frequency: 0,
      bits: [],
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
      this.oscillator.type = 'sine';
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
      const text = '127.0.0.1';
      this.bits = [];
      for (let i = 0; i < text.length; i += 1) {
        text[i].charCodeAt(0).toString(2).split('').forEach((bit) => {
          this.bits.push(parseInt(bit, 10));
        });
      }
      // The amount of bits per second
      const density = 10;
      const now = this.audioCtx.currentTime + 1;
      const low = 500;
      const high = 1500;
      this.oscillator.frequency.setValueAtTime(0, this.audioCtx.currentTime);
      this.bits.forEach((bit, idx) => {
        let frequency = low;
        if (bit) {
          frequency = high;
        }
        this.oscillator.frequency.setValueAtTime(frequency, now + (idx * (1 / density)));
      });
      this.oscillator.frequency.setValueAtTime(0, now + (this.bits.length * (1 / density)));
    },
    setupAnalyzer() {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.connect(this.audioCtx.destination);
      this.gainNode.connect(this.analyser);
      this.analyser.fftSize = 512;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      const canvas = document.getElementById('oscilloscope');
      const canvasCtx = canvas.getContext('2d');

      const that = this;
      const outBits = [];
      let currentPrimaryBin = null;
      let primaryBinCount = 0;
      const draw = () => {
        window.setTimeout(() => { draw.call(that); }, 10);

        this.analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        let maxValue = 0;
        let primaryBin = null;
        for (let i = 0; i < bufferLength; i += 1) {
          barHeight = dataArray[i];
          if (barHeight > maxValue) {
            maxValue = barHeight;
            primaryBin = i;
          }

          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

          x += barWidth + 1;
        }
        const distanceLow = Math.abs(6 - primaryBin);
        const distanceHigh = Math.abs(17 - primaryBin);
        if (distanceLow < 4 || distanceHigh < 4) {
          console.log(`Primary: ${primaryBin}`);
          if (primaryBin !== currentPrimaryBin) {
            if (primaryBinCount > 0) {
              console.log(`got ${primaryBinCount}`);
              for (let i = 0; i < Math.round(primaryBinCount / 10); i += 1) {
                if (distanceLow < distanceHigh) {
                  outBits.push(1);
                } else {
                  outBits.push(0);
                }
              }

              console.log(outBits);
              console.log(Object.values(this.bits));
            }
            primaryBinCount = 0;
          }
          currentPrimaryBin = primaryBin;
          primaryBinCount += 1;
        }
      };

      draw();
    },
  },
};
</script>
