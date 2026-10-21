// Capa de datos.
//
// Las pantallas LEEN siempre desde una copia en memoria (all, get, where), de forma inmediata.
// Las pantallas ESCRIBEN siempre con funciones asíncronas (add, update, remove), y luego se redibujan.
//
// Funciona de dos modos, según js/config.js:
// - Local (GS.FIREBASE en null): la copia se guarda en este navegador (localStorage).
// - Firestore (GS.FIREBASE con datos): la copia se carga desde la base compartida con onSnapshot
//   y cada escritura se envía a Firestore. Las pantallas no cambian.
window.GS = window.GS || {};

(function (GS) {
  const KEY = 'greyskills:datos';
  const COLECCIONES = ['unidades', 'cargos', 'personas', 'cursos', 'rutas', 'inscripciones', 'propuestas', 'solicitudes', 'presencialCatalogo', 'convocatorias'];
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  let db = null;
  let fs = null;
  let disponible = true;
  const oyentes = [];

  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function col(nombre) {
    if (!db[nombre]) throw new Error('Colección desconocida: ' + nombre);
    return db[nombre];
  }

  // ---------- Modo local ----------
  function leer() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { disponible = false; return null; }
  }
  function guardarLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) {
      disponible = false;
      GS.toast('Este navegador no permite guardar. Los cambios se perderán al cerrar la página.', 'error');
    }
  }
  function valido(d) { return d && d.version === GS.SEED_VERSION && COLECCIONES.every((c) => Array.isArray(d[c])); }

  function iniciarLocal() {
    const d = leer();
    db = valido(d) ? d : GS.seed();
    if (!valido(d)) guardarLocal();
    // Si otra pestaña cambia los datos, se recargan aquí.
    try {
      window.addEventListener('storage', (e) => {
        if (e.key !== KEY) return;
        const nuevo = leer();
        if (valido(nuevo)) { db = nuevo; oyentes.forEach((fn) => fn()); }
      });
    } catch (e) { /* sin sincronización entre pestañas */ }
  }

  // ---------- Modo Firestore ----------
  function cargarScript(src) {
    return new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => mal(new Error('No se pudo cargar Firebase. Revisa tu conexión a internet.'));
      document.head.appendChild(s);
    });
  }
  function sinId(o) { const d = copia(o); delete d.id; return d; }
  // Firestore no acepta listas dentro de listas: se avisa antes de escribir para no perder el dato.
  function revisar(o) {
    (function rec(v) {
      if (Array.isArray(v)) v.forEach((x) => { if (Array.isArray(x)) throw new Error('Dato no compatible con la base compartida (lista dentro de lista).'); rec(x); });
      else if (v && typeof v === 'object') Object.values(v).forEach(rec);
    })(o);
    return o;
  }
  // Las escrituras se aplican al tiro en pantalla y Firestore las sube en segundo plano
  // (si se corta internet, quedan guardadas en el navegador y se envían al volver la conexión).
  // Si el servidor las rechaza, Firestore deshace el cambio y se avisa.
  function enviar(promesa) {
    promesa.catch((e) => {
      console.error(e);
      GS.toast('No se pudo guardar en la base compartida: ' + (e && e.code === 'permission-denied' ? 'no tienes permiso para este cambio.' : 'inténtalo de nuevo.'), 'error');
    });
  }

  async function iniciarFirestore(cfg) {
    await cargarScript(SDK + 'firebase-app-compat.js');
    await cargarScript(SDK + 'firebase-firestore-compat.js');
    fs = firebase.initializeApp(cfg).firestore();
    try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* sin copia offline en este navegador */ }
    db = {};
    await Promise.all(COLECCIONES.map((c) => new Promise((ok, mal) => {
      let primera = true;
      fs.collection(c).onSnapshot((snap) => {
        db[c] = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        if (primera) { primera = false; ok(); return; }
        // Los cambios propios ya están en pantalla; solo se redibuja con cambios de otras personas.
        if (!snap.metadata.hasPendingWrites) oyentes.forEach((fn) => fn());
      }, (e) => {
        console.error(e);
        if (primera) { primera = false; mal(e); }
        else GS.toast('Se perdió la conexión con la base compartida. Recarga la página.', 'error');
      });
    })));
    // Base recién creada: carga los datos de ejemplo una sola vez, si está permitido.
    if (GS.DATOS_DE_PRUEBA && COLECCIONES.every((c) => db[c].length === 0)) {
      const s = GS.seed();
      for (const c of COLECCIONES) await GS.store.addMany(c, s[c]);
    }
  }

  GS.store = {
    async init() {
      if (GS.FIREBASE) await iniciarFirestore(GS.FIREBASE);
      else iniciarLocal();
    },
    alCambiar(fn) { oyentes.push(fn); },
    persistente() { return disponible; },
    modo() { return fs ? 'firestore' : 'local'; },

    // Lecturas (inmediatas)
    all(nombre) { return col(nombre); },
    get(nombre, id) { return col(nombre).find((x) => x.id === id) || null; },
    where(nombre, fn) { return col(nombre).filter(fn); },

    // Escrituras (asíncronas)
    async add(nombre, obj) {
      const nuevo = copia(Object.assign({ id: GS.uid() }, obj));
      if (fs) revisar(nuevo);
      col(nombre).push(nuevo);
      if (fs) enviar(fs.collection(nombre).doc(nuevo.id).set(sinId(nuevo)));
      else guardarLocal();
      return nuevo;
    },
    async addMany(nombre, objs) {
      const nuevos = objs.map((o) => copia(Object.assign({ id: GS.uid() }, o)));
      if (fs) nuevos.forEach(revisar);
      col(nombre).push(...nuevos);
      if (fs) {
        // Firestore acepta hasta 500 escrituras por lote.
        for (let i = 0; i < nuevos.length; i += 400) {
          const lote = fs.batch();
          nuevos.slice(i, i + 400).forEach((o) => lote.set(fs.collection(nombre).doc(o.id), sinId(o)));
          enviar(lote.commit());
        }
      } else guardarLocal();
      return nuevos;
    },
    async update(nombre, id, cambios) {
      const o = this.get(nombre, id);
      if (!o) throw new Error('No existe ' + nombre + '/' + id);
      const c = copia(cambios);
      delete c.id;
      if (fs) revisar(c);
      Object.assign(o, c);
      if (fs) { if (Object.keys(c).length) enviar(fs.collection(nombre).doc(id).update(c)); }
      else guardarLocal();
      return o;
    },
    async remove(nombre, id) {
      const lista = col(nombre);
      const i = lista.findIndex((x) => x.id === id);
      if (i < 0) return;
      lista.splice(i, 1);
      if (fs) enviar(fs.collection(nombre).doc(id).delete());
      else guardarLocal();
    },
    async reset() {
      // Protección: la base compartida nunca se borra desde la plataforma.
      if (fs) throw new Error('En la base compartida los datos no se pueden restablecer desde aquí.');
      db = GS.seed();
      guardarLocal();
    }
  };
})(window.GS);
