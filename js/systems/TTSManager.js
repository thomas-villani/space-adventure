export class TTSManager {
  constructor() {
    this._enabled = true;
    this._rate = 0.85;
    this._voice = null;
    this._voicesLoaded = false;
    this._current = null;

    // Load voices (async on some browsers)
    if (window.speechSynthesis) {
      this._loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => this._loadVoices());
    }
  }

  _loadVoices() {
    const voices = window.speechSynthesis?.getVoices() || [];
    if (voices.length === 0) return;
    this._voicesLoaded = true;

    // Prefer friendly-sounding English voices
    const english = voices.filter(v => v.lang.startsWith('en'));
    const preferred = english.find(v =>
      /female|samantha|zira|karen|victoria|fiona/i.test(v.name)
    );
    this._voice = preferred || english[0] || voices[0];
  }

  get enabled() { return this._enabled; }

  toggle() {
    this._enabled = !this._enabled;
    if (!this._enabled) this.stop();
    return this._enabled;
  }

  setEnabled(val) {
    this._enabled = val;
    if (!val) this.stop();
  }

  speak(text) {
    if (!this._enabled || !window.speechSynthesis) return;

    // Cancel any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this._rate;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
    if (this._voice) utterance.voice = this._voice;

    this._current = utterance;
    utterance.onend = () => { this._current = null; };
    utterance.onerror = () => { this._current = null; };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this._current = null;
  }

  get speaking() {
    return window.speechSynthesis?.speaking || false;
  }
}
