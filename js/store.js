// Capa de datos.
//
// Las pantallas LEEN siempre desde una copia en memoria (all, get, where), de forma inmediata.
// Las pantallas ESCRIBEN siempre con funciones asíncronas (add, update, remove), y luego se redibujan.
//
// Hoy la copia se guarda en este navegador (localStorage). Para pasar a Firestore basta con
// reemplazar este archivo por uno que cargue las colecciones con onSnapshot y escriba con
// addDoc/updateDoc/deleteDoc, manteniendo los mismos nombres de funciones. Las pantallas no cambian.
window.GS = window.GS || {};

(function (GS) {
  const KEY = 'greyskills:datos';
  const COLECCIONES = ['unidades', 'cargos', 'personas', 'cursos', 'rutas', 'inscripciones', 'propuestas', 'solicitudes', 'presencialCatalogo', 'convocatorias'];
  let db = null;
  let disponible = true;
  const oyentes = [];

  function leer() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { disponible = false; return null; }
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) {
      disponible = false;
      GS.toast('Este navegador no permite guardar. Los cambios se perderán al cerrar la página.', 'error');
    }
  }
  function valido(d) { return d && d.version === GS.SEED_VERSION && COLECCIONES.every((c) => Array.isArray(d[c])); }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function col(nombre) {
    if (!db[nombre]) throw new Error('Colección desconocida: ' + nombre);
    return db[nombre];
  }

  GS.store = {
    async init() {
      const d = leer();
      db = valido(d) ? d : GS.seed();
      if (!valido(d)) guardar();
      // Si otra pestaña cambia los datos, se recargan aquí (simula la sincronización de Firestore).
      try {
        window.addEventListener('storage', (e) => {
          if (e.key !== KEY) return;
          const nuevo = leer();
          if (valido(nuevo)) { db = nuevo; oyentes.forEach((fn) => fn()); }
        });
      } catch (e) { /* sin sincronización entre pestañas */ }
    },
    alCambiar(fn) { oyentes.push(fn); },
    persistente() { return disponible; },

    // Lecturas (inmediatas)
    all(nombre) { return col(nombre); },
    get(nombre, id) { return col(nombre).find((x) => x.id === id) || null; },
    where(nombre, fn) { return col(nombre).filter(fn); },

    // Escrituras (asíncronas, como en Firestore)
    async add(nombre, obj) {
      const nuevo = copia(Object.assign({ id: GS.uid() }, obj));
      col(nombre).push(nuevo);
      guardar();
      return nuevo;
    },
    async addMany(nombre, objs) {
      const nuevos = objs.map((o) => copia(Object.assign({ id: GS.uid() }, o)));
      col(nombre).push(...nuevos);
      guardar();
      return nuevos;
    },
    async update(nombre, id, cambios) {
      const o = this.get(nombre, id);
      if (!o) throw new Error('No existe ' + nombre + '/' + id);
      Object.assign(o, copia(cambios));
      guardar();
      return o;
    },
    async remove(nombre, id) {
      const lista = col(nombre);
      const i = lista.findIndex((x) => x.id === id);
      if (i >= 0) { lista.splice(i, 1); guardar(); }
    },
    async reset() {
      db = GS.seed();
      guardar();
    }
  };
})(window.GS);
