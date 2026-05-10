/* ============================================
   UN CACHO — audio.js
   Web Audio API. Sin archivos externos.
   Reemplazable en v2 con archivos .mp3
   ============================================ */

const Audio = (() => {
  let ctx = null;
  let shakingNode = null;
  let shakingGain = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // ---------- Dado rodando (loop mientras se agita) ----------
  function startShaking() {
    stopShaking();
    const c = getCtx();
    shakingGain = c.createGain();
    shakingGain.gain.setValueAtTime(0.18, c.currentTime);
    shakingGain.connect(c.destination);

    function tick() {
      if (!shakingGain) return;
      // Ruido blanco corto → simula dado golpeando pared del cacho
      const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = c.createBufferSource();
      src.buffer = buf;
      // Filtro bandpass para darle cuerpo
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 800;
      filter.Q.value = 0.8;
      src.connect(filter);
      filter.connect(shakingGain);
      src.start();
      // Intervalo variable para que suene orgánico
      shakingNode = setTimeout(tick, 80 + Math.random() * 120);
    }
    tick();
  }

  function stopShaking() {
    if (shakingNode) { clearTimeout(shakingNode); shakingNode = null; }
    if (shakingGain) {
      try { shakingGain.gain.setTargetAtTime(0, getCtx().currentTime, 0.05); } catch(e){}
      shakingGain = null;
    }
  }

  // ---------- Golpe de mesa (fijar tiro) ----------
  function playGolpe() {
    stopShaking();
    const c = getCtx();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    gain.connect(c.destination);

    // Impacto sordo tipo golpe sobre madera
    const buf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.exp(-i / (c.sampleRate * 0.06));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    src.connect(filter);
    filter.connect(gain);
    src.start();

    // Click inicial seco encima
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.frequency.value = 120;
    oscGain.gain.setValueAtTime(0.3, c.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.connect(oscGain);
    oscGain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.08);
  }

  // ---------- Eliminado ----------
  function playEliminado() {
    const c = getCtx();
    // Tres notas descendentes
    [330, 247, 185].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const t = c.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // ---------- Init (desbloquear contexto en iOS) ----------
  function init() {
    getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  return { init, startShaking, stopShaking, playGolpe, playEliminado };
})();
