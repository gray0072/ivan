// Speech synthesis for the Reading tasks: the device's own voices (Web Speech API), one picked per language.
// TV browsers often have no speech at all, or no voices — then Reading is switched off with an explanation.

const Speech = (() => {
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  let voices = [];
  const bad = new Set();   // voices that failed to speak in this session (an online voice while offline)
  const listeners = [];
  let current = null;      // the utterance being spoken (kept referenced: Chrome may drop it mid-way)

  function load() {
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
    listeners.forEach(cb => cb());
  }
  if (supported) {
    load();
    // Voices arrive asynchronously in Chrome and Edge.
    if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
    else synth.onvoiceschanged = load;
  }

  // Voices for a language code ('sv', 'en', 'ru'), the best first: natural / neural ones sound much better,
  // then Google's, then the ones that work offline.
  function ranked(lang) {
    const score = v => (/natural|neural/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
    return voices
      .filter(v => !bad.has(v.name) && String(v.lang).toLowerCase().replace('_', '-').split('-')[0] === lang)
      .sort((a, b) => score(b) - score(a));
  }

  const hasVoice = lang => supported && ranked(lang).length > 0;
  const anyVoice = () => supported && voices.length > 0;

  function stop() {
    current = null;
    if (supported) try { synth.cancel(); } catch (e) { /* ignore */ }
  }

  // Says the text in the language; if a voice fails, tries the next one. Returns false when it can't speak.
  function say(text, lang) {
    const list = supported ? ranked(lang) : [];
    if (!list.length) return false;
    stop();
    speakWith(text, list, 0);
    return true;
  }

  function speakWith(text, list, i) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = list[i];
      u.lang = list[i].lang;
      u.rate = READ_VOICE_RATE;
      u.onerror = e => {
        if (current !== u || e.error === 'interrupted' || e.error === 'canceled') return;
        bad.add(list[i].name);
        if (i + 1 < list.length) speakWith(text, list, i + 1);
      };
      current = u;
      if (synth.paused) synth.resume();
      synth.speak(u);
    } catch (e) { /* no speech */ }
  }

  return {
    supported, hasVoice, anyVoice, say, stop,
    onChange: cb => listeners.push(cb), // the voice list changed (loaded)
  };
})();
