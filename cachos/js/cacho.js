/* ============================================
   UN CACHO — cacho.js
   Controla el SVG del cacho, los dados,
   y todas sus animaciones visuales.
   Sin lógica de estado de la app aquí.
   ============================================ */

const Cacho = (() => {

  // ---------- Referencias DOM ----------
  const wrapper   = document.getElementById('cacho-wrapper');
  const svgEl     = document.getElementById('cacho-svg');
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
    wrapper.classList.remove('shakeing', 'golpeando', 'boca-abajo');
    // Limpia clases del SVG también
    svgEl.classList.remove('svg-abierto', 'svg-cerrando');
  }

  // Empieza shake en loop
  function iniciarShake() {
    _limpiarClases();
    wrapper.classList.add('shakeing');
  }

  // Detiene shake
  function detenerShake() {
    wrapper.classList.remove('shakeing');
  }

  // Golpe → cacho rebota, queda boca abajo
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

  // FIX 1: abrir mueve SOLO el SVG hacia arriba
  // Los dados quedan fijos en la base del wrapper
  function abrir() {
    if (!_bocaAbajo || _abierto) return;
    _abierto = true;

    // Muestra dados (estaban hidden)
    dadosCont.classList.remove('hidden');
    dadosCont.style.display = 'flex';

    // Sube SOLO el SVG — los dados quedan abajo
    svgEl.classList.remove('svg-cerrando');
    svgEl.classList.add('svg-abierto');

    // Anima aparición de dados con delay escalonado
    dadoEls.forEach((el, i) => {
      if (i < _cantDados) {
        el.classList.remove('apareciendo');
        setTimeout(() => el.classList.add('apareciendo'), 400 + i * 80);
      }
    });

    // Fade in del contenedor
    setTimeout(() => {
      dadosCont.classList.add('visible');
    }, 500);
  }

  // FIX 1: cerrar baja SOLO el SVG de vuelta
  function cerrar(onComplete) {
    if (!_abierto) return;
    _abierto = false;

    // Oculta dados
    dadosCont.classList.remove('visible');
    dadoEls.forEach(el => el.classList.remove('apareciendo'));

    // Baja el SVG de vuelta
    svgEl.classList.remove('svg-abierto');
    svgEl.classList.add('svg-cerrando');

    setTimeout(() => {
      svgEl.classList.remove('svg-cerrando');
      dadosCont.classList.add('hidden');
      dadosCont.style.display = 'none';
      if (onComplete) onComplete();
    }, 1000);
  }

  // Resetea a estado inicial
  function resetear() {
    if (_abrirTimeout) {
      clearTimeout(_abrirTimeout);
      _abrirTimeout = null;
    }
    _limpiarClases();
    _bocaAbajo = false;
    _abierto   = false;
    svgEl.classList.remove('svg-abierto', 'svg-cerrando');
    svgEl.style.transform = '';
    dadosCont.classList.remove('visible');
    dadosCont.classList.add('hidden');
    dadosCont.style.display = 'none';
    dadoEls.forEach(el => {
      el.classList.remove('apareciendo');
      el.setAttribute('data-puntos', '');
    });
  }

  // Feedback visual de progreso de shake
  function setShakeProgress(p) {
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
