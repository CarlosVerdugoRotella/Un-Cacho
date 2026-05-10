/* ============================================
   UN CACHO — app.js
   Máquina de estados principal.
   Orquesta Audio, Sensors, Cacho y el DOM.

   Estados:
     inicio → agitando → bloqueado → 
     viendo_dados → entre_rondas → 
     agitando (loop) | eliminado
   ============================================ */

const App = (() => {

  // ---------- Estado ----------
  const STATE = {
    INICIO:        'inicio',
    AGITANDO:      'agitando',
    BLOQUEADO:     'bloqueado',
    VIENDO_DADOS:  'viendo_dados',
    ENTRE_RONDAS:  'entre_rondas',
    ELIMINADO:     'eliminado',
  };

  let estado         = STATE.INICIO;
  let dadosActuales  = 5;
  let pendientePerdi = false;   // toggle "PERDÍ UNO" activo
  let pendienteCalze = false;   // toggle "CALZÉ BIEN" activo

  // ---------- Referencias DOM ----------
  const screens = {
    inicio:    document.getElementById('screen-inicio'),
    juego:     document.getElementById('screen-juego'),
    eliminado: document.getElementById('screen-eliminado'),
  };

  const els = {
    // Inicio
    dadosInicio:      document.getElementById('display-dados-inicio'),
    btnMenosInicio:   document.getElementById('btn-menos-inicio'),
    btnMasInicio:     document.getElementById('btn-mas-inicio'),
    btnEmpezar:       document.getElementById('btn-empezar'),

    // Juego - header
    dadosIconos:      document.getElementById('dados-iconos'),
    dadosCount:       document.getElementById('dados-count'),
    btnVolverTirar:   document.getElementById('btn-volver-tirar'),

    // Juego - cacho area
    instruccion:      document.getElementById('instruccion'),
    cachoWrapper:     document.getElementById('cacho-wrapper'),

    // Panel entre rondas
    panelRondas:      document.getElementById('panel-entre-rondas'),
    togglePerdi:      document.getElementById('toggle-perdi'),
    toggleCalze:      document.getElementById('toggle-calze'),
    btnTirar:         document.getElementById('btn-tirar'),

    // Mini inicio
    btnMiniInicio:    document.getElementById('btn-mini-inicio'),
    tooltipAdvert:    document.getElementById('tooltip-advertencia'),
    btnConfirmarIni:  document.getElementById('btn-confirmar-inicio'),
    btnCancelarIni:   document.getElementById('btn-cancelar-inicio'),

    // Eliminado
    btnEliminadoIni:  document.getElementById('btn-eliminado-inicio'),
  };

  // ---------- Helpers de pantalla ----------
  function mostrarScreen(nombre) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === nombre);
    });
  }

  function actualizarHeaderDados() {
    const iconos = Array(dadosActuales).fill('⚀').join(' ');
    els.dadosIconos.textContent = iconos;
    els.dadosCount.textContent  = `× ${dadosActuales}`;
  }

  function setInstruccion(texto) {
    els.instruccion.textContent = texto;
  }

  // ---------- Transiciones de estado ----------
  function irA(nuevoEstado) {
    estado = nuevoEstado;

    // Oculta botón "Volver a tirar" por defecto
    els.btnVolverTirar.style.display = 'none';
    // Oculta panel rondas por defecto
    els.panelRondas.classList.add('hidden');
    // Oculta tooltip
    ocultarTooltip();

    switch (estado) {

      case STATE.INICIO:
        Sensors.disable();
        Cacho.resetear();
        mostrarScreen('inicio');
        actualizarInicio();
        break;

      case STATE.AGITANDO:
        mostrarScreen('juego');
        actualizarHeaderDados();
        Cacho.resetear();
        Cacho.setCantidad(dadosActuales);
        setInstruccion('Agita el cacho');
        Audio.init();
        Sensors.reset();
        Sensors.enable();
        break;

      case STATE.BLOQUEADO:
        Sensors.disable();
        Audio.stopShaking();
        Cacho.setShakeProgress(0);
        setInstruccion('Toca para ver tus dados');
        els.btnVolverTirar.style.display = 'block';
        break;

      case STATE.VIENDO_DADOS:
        setInstruccion('Suelta para cerrar');
        els.btnVolverTirar.style.display = 'none';
        break;

      case STATE.ENTRE_RONDAS:
        Cacho.resetear();
        actualizarHeaderDados();
        setInstruccion('');
        // Resetea toggles visuales (el estado lógico se mantiene)
        sincronizarToggles();
        els.panelRondas.classList.remove('hidden');
        break;

      case STATE.ELIMINADO:
        Sensors.disable();
        Audio.stopShaking();
        Audio.playEliminado();
        mostrarScreen('eliminado');
        break;
    }
  }

  // ---------- Pantalla inicio ----------
  function actualizarInicio() {
    els.dadosInicio.textContent   = dadosActuales;
    els.btnMenosInicio.disabled   = dadosActuales <= 1;
    els.btnMasInicio.disabled     = dadosActuales >= 5;
  }

  els.btnMenosInicio.addEventListener('click', () => {
    if (dadosActuales > 1) { dadosActuales--; actualizarInicio(); }
  });

  els.btnMasInicio.addEventListener('click', () => {
    if (dadosActuales < 5) { dadosActuales++; actualizarInicio(); }
  });

  els.btnEmpezar.addEventListener('click', () => {
    pendientePerdi = false;
    pendienteCalze = false;
    irA(STATE.AGITANDO);
  });

  // ---------- Sensores → callbacks ----------
  Sensors.on('onShakeStart', () => {
    if (estado !== STATE.AGITANDO) return;
    Cacho.iniciarShake();
    Audio.startShaking();
    setInstruccion('Agita más...');
  });

  Sensors.on('onShakeProgress', (p) => {
    if (estado !== STATE.AGITANDO) return;
    Cacho.setShakeProgress(p);
    if (p >= 1) setInstruccion('¡Golpea la mesa!');
  });

  Sensors.on('onShakeReady', () => {
    if (estado !== STATE.AGITANDO) return;
    setInstruccion('¡Golpea la mesa!');
  });

  Sensors.on('onGolpe', () => {
    if (estado !== STATE.AGITANDO) return;
    // Genera la tirada
    Cacho.tirar();
    Cacho.detenerShake();
    Audio.playGolpe();
    // Anima golpe y volteo
    Cacho.animarGolpe(() => {
      irA(STATE.BLOQUEADO);
    });
  });

  // ---------- Interacción con el cacho (ver dados) ----------
  els.cachoWrapper.addEventListener('touchstart', (e) => {
    if (estado !== STATE.BLOQUEADO) return;
    e.preventDefault();
    irA(STATE.VIENDO_DADOS);
    Cacho.abrir();
  }, { passive: false });

  els.cachoWrapper.addEventListener('touchend', (e) => {
    if (estado !== STATE.VIENDO_DADOS) return;
    e.preventDefault();
    Cacho.cerrar(() => {
      irA(STATE.BLOQUEADO);
    });
  }, { passive: false });

  // También soporta mouse (desktop/testing)
  els.cachoWrapper.addEventListener('mousedown', () => {
    if (estado !== STATE.BLOQUEADO) return;
    irA(STATE.VIENDO_DADOS);
    Cacho.abrir();
  });

  els.cachoWrapper.addEventListener('mouseup', () => {
    if (estado !== STATE.VIENDO_DADOS) return;
    Cacho.cerrar(() => {
      irA(STATE.BLOQUEADO);
    });
  });

  // ---------- Botón "Volver a tirar" ----------
  els.btnVolverTirar.addEventListener('click', () => {
    if (estado !== STATE.BLOQUEADO) return;
    irA(STATE.ENTRE_RONDAS);
  });

  // ---------- Panel entre rondas ----------

  // Toggles mutuamente excluyentes
  els.togglePerdi.addEventListener('click', () => {
    pendientePerdi = !pendientePerdi;
    if (pendientePerdi) pendienteCalze = false;
    sincronizarToggles();
  });

  els.toggleCalze.addEventListener('click', () => {
    pendienteCalze = !pendienteCalze;
    if (pendienteCalze) pendientePerdi = false;
    sincronizarToggles();
  });

  function sincronizarToggles() {
    els.togglePerdi.classList.toggle('active', pendientePerdi);
    els.toggleCalze.classList.toggle('active', pendienteCalze);
  }

  // Botón TIRAR
  els.btnTirar.addEventListener('click', () => {
    if (estado !== STATE.ENTRE_RONDAS) return;

    // Aplica cambio de dados según toggle activo
    if (pendientePerdi) {
      dadosActuales = Math.max(0, dadosActuales - 1);
      pendientePerdi = false;
    } else if (pendienteCalze) {
      dadosActuales = Math.min(5, dadosActuales + 1);
      pendienteCalze = false;
    }

    if (dadosActuales === 0) {
      irA(STATE.ELIMINADO);
      return;
    }

    irA(STATE.AGITANDO);
  });

  // ---------- Mini botón volver al inicio ----------
  els.btnMiniInicio.addEventListener('click', () => {
    if (els.tooltipAdvert.classList.contains('hidden')) {
      mostrarTooltip();
    } else {
      ocultarTooltip();
    }
  });

  els.btnConfirmarIni.addEventListener('click', () => {
    ocultarTooltip();
    dadosActuales  = 5;
    pendientePerdi = false;
    pendienteCalze = false;
    irA(STATE.INICIO);
  });

  els.btnCancelarIni.addEventListener('click', ocultarTooltip);

  function mostrarTooltip() {
    els.tooltipAdvert.classList.remove('hidden');
  }

  function ocultarTooltip() {
    els.tooltipAdvert.classList.add('hidden');
  }

  // ---------- Pantalla eliminado ----------
  els.btnEliminadoIni.addEventListener('click', () => {
    dadosActuales  = 5;
    pendientePerdi = false;
    pendienteCalze = false;
    irA(STATE.INICIO);
  });

  // ---------- Init ----------
  function init() {
    mostrarScreen('inicio');
    actualizarInicio();
  }

  return { init };
})();

// Arranca la app
document.addEventListener('DOMContentLoaded', () => App.init());
