export class TTSManager {
  constructor() {
    this._enabled = true;
    this._rate = 0.85;
    this._voice = null;
    this._voicesLoaded = false;
    this._current = null; // current Audio element or SpeechSynthesisUtterance
    this._textLookup = null; // text → audio file path
    this._audioCache = {}; // file path → Audio element

    // Load pre-generated audio manifest
    this._loadManifest();

    // Load browser voices as fallback
    if (window.speechSynthesis) {
      this._loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => this._loadVoices());
    }
  }

  async _loadManifest() {
    try {
      const resp = await fetch('audio/text-lookup.json');
      if (resp.ok) {
        this._textLookup = await resp.json();
      }
    } catch (e) {
      // No pre-generated audio available — will use browser TTS
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
    if (!this._enabled) return;

    // Cancel any current speech
    this.stop();

    // Try pre-generated audio first
    if (this._textLookup && this._textLookup[text]) {
      const filePath = 'audio/' + this._textLookup[text];
      this._playAudioFile(filePath);
      return;
    }

    // Fallback to browser SpeechSynthesis
    if (!window.speechSynthesis) return;

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

  _playAudioFile(filePath) {
    let audio = this._audioCache[filePath];
    if (!audio) {
      audio = new Audio(filePath);
      this._audioCache[filePath] = audio;
    }

    audio.currentTime = 0;
    audio.volume = 0.9;
    this._current = audio;
    audio.onended = () => { this._current = null; };
    audio.onerror = () => { this._current = null; };
    audio.play().catch(() => { this._current = null; });
  }

  stop() {
    if (this._current instanceof Audio) {
      this._current.pause();
      this._current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this._current = null;
  }

  get speaking() {
    if (this._current instanceof Audio) {
      return !this._current.paused;
    }
    return window.speechSynthesis?.speaking || false;
  }
}
