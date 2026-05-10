/* ============================================
   UN CACHO — cacho.js
   Controla el SVG del cacho, los dados,
   y todas sus animaciones visuales.
   Sin lógica de estado de la app aquí.
   ============================================ */

const Cacho = (() => {

  // ---------- Referencias DOM ----------
  const wrapper   = document.getElementById('cacho-wrapper');
  const dadosCont = document.getElementById('dados-container');
  const dadoEls   = [1,2,3,4,5].map(i => document.getElementById(`dado-${i}`));

  // Mapa de valores a unicode de dados
  const PUNTOS = { 1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅' };

  // ---------- Estado interno ----------
  let _valores      = [];
  let _cantDados    = 5;
  let _bocaAbajo    = false;
  let _abierto      = false;
  let _abrirTimeout = null;

  // ---------- Dados ----------
  function _actualizarDadosDOM() {
    dadoEls.forEach((el, i) => {
      if (i < _cantDados) {
        el.style.display = 'flex';
        el.setAttribute('data-puntos', PUNTOS[_valores[i]] || '');
      } else {
        el.style.display = 'none';
        el.setAttribute('data-puntos', '');
      }
    });
  }

  function tirar() {
    _valores = [];
    for (let i = 0; i < _cantDados; i++) {
      _valores.push(Math.floor(Math.random() * 6) + 1);
    }
    _actualizarDadosDOM();
    return [..._valores];
  }

  function setCantidad(n) {
    _cantDados = Math.max(1, Math.min(5, n));
  }

  function getCantidad() { return _cantDados; }
  function getValores()  { return [..._valores]; }

  // ---------- Animaciones del cacho ----------

  function _limpiarClases() {
    wrapper.classList.remove('shakeing', 'golpeando', 'boca-abajo', 'abierto', 'cerrando');
  }

  function iniciarShake() {
    _limpiarClases();
    wrapper.classList.add('shakeing');
  }

  function detenerShake() {
    wrapper.classList.remove('shakeing');
  }

  function animarGolpe(onComplete) {
    detenerShake();
    wrapper.classList.add('golpeando');
    setTimeout(() => {
      wrapper.classList.remove('golpeando');
      wrapper.classList.add('boca-abajo');
      _bocaAbajo = true;
      if (onComplete) onComplete();
    }, 320);
  }

  function abrir() {
    if (!_bocaAbajo || _abierto) return;
    _abierto = true;

    dadosCont.classList.remove('hidden');
    dadosCont.style.display = 'flex';

    // Anima apertura — el CSS mueve el SVG hacia arriba via selector
    // #cacho-wrapper.abierto #cacho-svg { translateY(-120px) }
    wrapper.classList.remove('cerrando', 'boca-abajo');
    wrapper.classList.add('abierto');

    dadoEls.forEach((el, i) => {
      if (i < _cantDados) {
        el.classList.remove('apareciendo');
        setTimeout(() => el.classList.add('apareciendo'), 600 + i * 80);
      }
    });

    setTimeout(() => {
      dadosCont.classList.add('visible');
    }, 800);
  }

  function cerrar(onComplete) {
    if (!_abierto) return;
    _abierto = false;

    dadosCont.classList.remove('visible');
    dadoEls.forEach(el => el.classList.remove('apareciendo'));

    // Anima cierre — el CSS baja el SVG via selector
    // #cacho-wrapper.cerrando #cacho-svg { translateY(0px) }
    wrapper.classList.remove('abierto');
    wrapper.classList.add('cerrando');

    setTimeout(() => {
      wrapper.classList.remove('cerrando');
      wrapper.classList.add('boca-abajo');
      dadosCont.classList.add('hidden');
      dadosCont.style.display = 'none';
      if (onComplete) onComplete();
    }, 1000);
  }

  function resetear() {
    if (_abrirTimeout) { clearTimeout(_abrirTimeout); _abrirTimeout = null; }
    _limpiarClases();
    _bocaAbajo = false;
    _abierto   = false;
    dadosCont.classList.remove('visible');
    dadosCont.classList.add('hidden');
    dadosCont.style.display = 'none';
    dadoEls.forEach(el => {
      el.classList.remove('apareciendo');
      el.setAttribute('data-puntos', '');
    });
  }

  function setShakeProgress(p) {
    const svgEl = document.getElementById('cacho-svg');
    svgEl.style.filter = `drop-shadow(0 8px 20px rgba(0,0,0,0.7)) drop-shadow(0 0 ${Math.round(p * 18)}px rgba(200,146,42,${(p * 0.6).toFixed(2)}))`;
  }

  return {
    tirar,
    setCantidad,
    getCantidad,
    getValores,
    iniciarShake,
    detenerShake,
    animarGolpe,
    abrir,
    cerrar,
    resetear,
    setShakeProgress,
  };

})();
