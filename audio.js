// Web Audio API Sound Synthesizer for Chess
// Zero external sound file dependencies; 100% offline and instant!

class ChessAudio {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('chess_sound_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(mute) {
        this.muted = mute;
        localStorage.setItem('chess_sound_muted', mute);
    }

    playMove() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        // Add soft noise pop for wood feel
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(t);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playCapture() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        // Dual thud for piece impact
        [0, 0.03].forEach((delay, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(idx === 0 ? 320 : 180, t + delay);
            osc.frequency.exponentialRampToValueAtTime(80, t + delay + 0.09);

            gain.gain.setValueAtTime(idx === 0 ? 0.45 : 0.35, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.11);
        });
    }

    playCheck() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        [523.25, 659.25].forEach((freq, i) => { // C5 and E5 chord
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.36);
        });
    }

    playCastle() {
        if (this.muted) return;
        this.playMove();
        setTimeout(() => this.playMove(), 90);
    }

    playGameEnd(isWin) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const freqs = isWin ? [440, 554.37, 659.25, 880] : [440, 415.3, 370, 329.63];

        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = isWin ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.12);

            gain.gain.setValueAtTime(0.2, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.36);
        });
    }
}

window.chessAudio = new ChessAudio();
