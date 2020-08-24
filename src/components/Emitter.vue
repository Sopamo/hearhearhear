<template>
<div>
  <q-btn @click="emit">Play teh tunes</q-btn>
  <q-slider @input="handleVolumeChange" v-model="volume" :min="0.05" :step="0.05" :max="1"/>
  <q-slider v-model="frequency" :min="0" :max="2000"/>
</div>
</template>

<script>
export default {
  data() {
    return {
      audioCtx: null,
      gainNode: null,
      oscillator: null,
      isStarted: false,
      volume: 0.2,
      frequency: 440,
    };
  },
  created() {
    this.setup();
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
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = 'square';
      this.setFrequency(this.frequency);
      this.oscillator.connect(this.gainNode);
    },
    emit() {
      if (!this.isStarted) {
        this.isStarted = true;
        this.oscillator.start();
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
  },
};
</script>
