/* ============================================
   UN CACHO — sensors.js
   Detecta shake (agitación continua) y
   golpe de mesa (pico brusco de aceleración)
   via devicemotion API
   ============================================ */

const Sensors = (() => {
  // Umbrales
  const SHAKE_THRESHOLD   = 18;   // m/s² magnitud mínima para contar como shake
  const SHAKE_MIN_MS      = 2200; // ms mínimos de agitación continua
  const GOLPE_THRESHOLD   = 28;   // m/s² pico único = golpe de mesa
  const GOLPE_COOLDOWN_MS = 800;  // ms para ignorar rebotes post-golpe
  const IDLE_RESET_MS     = 400;  // ms sin movimiento → resetea timer de shake

  let enabled       = false;
  let shakeStart    = null;   // timestamp inicio de agitación continua
  let lastShakeTime = 0;
  let lastGolpeTime = 0;
  let shakeReady    = false;  // true cuando se cumple SHAKE_MIN_MS
  let listener      = null;

  // Callbacks registrados desde app.js
  const callbacks = {
    onShakeStart:    null,   // empieza a agitar
    onShakeProgress: null,   // (porcentaje 0-1) progreso del tiempo mínimo
    onShakeReady:    null,   // cumplió tiempo mínimo, listo para golpe
    onGolpe:         null,   // golpe de mesa detectado
  };

  function getMagnitud(acc) {
    const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
    return Math.sqrt(x*x + y*y + z*z);
  }

  function handleMotion(e) {
    if (!enabled) return;
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;
    const mag = getMagnitud(acc);
    const now = Date.now();

    // --- Detección de golpe (pico muy alto y corto) ---
    if (shakeReady && mag > GOLPE_THRESHOLD && (now - lastGolpeTime) > GOLPE_COOLDOWN_MS) {
      lastGolpeTime = now;
      if (callbacks.onGolpe) callbacks.onGolpe();
      return;
    }

    // --- Detección de shake continuo ---
    if (mag > SHAKE_THRESHOLD) {
      lastShakeTime = now;
      if (!shakeStart) {
        shakeStart = now;
        shakeReady = false;
        if (callbacks.onShakeStart) callbacks.onShakeStart();
      }
      const elapsed = now - shakeStart;
      const progress = Math.min(elapsed / SHAKE_MIN_MS, 1);
      if (callbacks.onShakeProgress) callbacks.onShakeProgress(progress);

      if (!shakeReady && elapsed >= SHAKE_MIN_MS) {
        shakeReady = true;
        if (callbacks.onShakeReady) callbacks.onShakeReady();
      }
    } else {
      // Sin movimiento suficiente
      if (shakeStart && (now - lastShakeTime) > IDLE_RESET_MS) {
        shakeStart  = null;
        shakeReady  = false;
        if (callbacks.onShakeProgress) callbacks.onShakeProgress(0);
      }
    }
  }

  // Pide permiso en iOS, luego registra el listener
  async function enable() {
    if (enabled) return;
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') {
          console.warn('Sensors: permiso de movimiento denegado');
          return;
        }
      } catch(err) {
        console.warn('Sensors: error al pedir permiso', err);
        return;
      }
    }
    listener = handleMotion.bind(this);
    window.addEventListener('devicemotion', listener, { passive: true });
    enabled = true;
    shakeStart = null;
    shakeReady = false;
  }

  function disable() {
    if (!enabled) return;
    if (listener) window.removeEventListener('devicemotion', listener);
    listener   = null;
    enabled    = false;
    shakeStart = null;
    shakeReady = false;
  }

  function reset() {
    shakeStart = null;
    shakeReady = false;
  }

  function on(event, cb) {
    if (callbacks.hasOwnProperty(event)) callbacks[event] = cb;
  }

  return { enable, disable, reset, on };
})();
