const MELODY_NOTES = [392, 440, 523.25, 440, 349.23, 392, 493.88, 392];
const BASS_NOTES = [98, 130.81, 116.54, 146.83];

export class BackgroundSound {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.filter = null;
    this.timer = null;
    this.enabled = true;
    this.step = 0;
    this.nextNoteTime = 0;
    this.secondsPerStep = 0.24;
  }

  async start() {
    if (!this.enabled) return;
    this.ensureContext();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setTargetAtTime(0.42, this.context.currentTime, 0.06);

    if (this.timer) return;
    this.nextNoteTime = this.context.currentTime + 0.04;
    this.timer = window.setInterval(() => this.scheduleAhead(), 70);
    this.scheduleAhead();
  }

  stop() {
    if (!this.context || !this.masterGain) return;

    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.05);

    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.start();
    else this.stop();
    return this.enabled;
  }

  accent() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    this.playTone(659.25, now, 0.09, 'square', 0.045);
    this.playTone(880, now + 0.06, 0.08, 'triangle', 0.035);
  }

  ensureContext() {
    if (this.context) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.0001;

    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1600;
    this.filter.Q.value = 0.4;

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  scheduleAhead() {
    const scheduleUntil = this.context.currentTime + 0.28;
    while (this.nextNoteTime < scheduleUntil) {
      this.scheduleStep(this.nextNoteTime, this.step);
      this.nextNoteTime += this.secondsPerStep;
      this.step = (this.step + 1) % 16;
    }
  }

  scheduleStep(time, step) {
    if (step % 2 === 0) {
      const note = MELODY_NOTES[(step / 2) % MELODY_NOTES.length];
      this.playTone(note, time, 0.12, 'triangle', 0.075);
    }

    if (step % 4 === 0) {
      const bass = BASS_NOTES[(step / 4) % BASS_NOTES.length];
      this.playTone(bass, time, 0.2, 'sine', 0.11);
    }

    if (step % 4 === 2) {
      this.playNoiseTap(time, 0.055);
    }
  }

  playTone(frequency, time, duration, type, volume) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(gain);
    gain.connect(this.filter);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.03);
  }

  playNoiseTap(time, volume) {
    const bufferSize = Math.floor(this.context.sampleRate * 0.04);
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.filter);
    source.start(time);
    source.stop(time + 0.05);
  }
}
