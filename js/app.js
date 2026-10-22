// Núcleo: sesión provisional, rutas, encabezado según rol, acciones y dibujo de pantallas.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  GS.vistas = {};
  GS.ui = {};

  // ---------- Sesión provisional (por pestaña: se puede probar un rol distinto en cada pestaña) ----------
  const SKEY = 'greyskills:sesion';
  let sesionMem = {};
  function leerSesion() { try { return JSON.parse(sessionStorage.getItem(SKEY)) || {}; } catch (e) { return sesionMem; } }
  function guardarSesion(s) { sesionMem = s; try { sessionStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* solo en memoria */ } }
  // La clave común de acceso (GS.CLAVE_HASH en js/config.js) se pide una vez por pestaña.
  GS.sesion = {
    get: leerSesion,
    desbloquear() { const s = leerSesion(); s.acceso = true; guardarSesion(s); },
    entrar(personaId) { guardarSesion({ personaId, acceso: leerSesion().acceso }); },
    salir() { guardarSesion({ acceso: leerSesion().acceso }); GS.ui = {}; },
    verComo(personaId) { const s = leerSesion(); s.viewAs = personaId; guardarSesion(s); GS.ui = {}; },
    dejarVerComo() { const s = leerSesion(); delete s.viewAs; guardarSesion(s); GS.ui = {}; }
  };
  // Con ingreso por RUT, la persona sale de la cuenta con sesión abierta; si no, de la vista elegida.
  GS.real = () => {
    const s = leerSesion();
    let id = s.personaId;
    if (GS.auth.activo()) id = GS.auth.personaId();
    else if (GS.CLAVE_HASH && !s.acceso) return null;
    const p = id && GS.persona(id);
    return p && p.activo ? p : null;
  };
  GS.claveOk = async (texto) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(texto || '').trim()));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('') === GS.CLAVE_HASH;
  };
  GS.yo = () => { const s = leerSesion(); const r = GS.real(); if (!r) return null; if (s.viewAs && r.rol === 'admin') { return GS.persona(s.viewAs) || r; } return r; };
  GS.soloLectura = () => { const s = leerSesion(); const r = GS.real(); return !!(s.viewAs && r && r.rol === 'admin' && GS.persona(s.viewAs)); };

  // ---------- Rutas (#/seccion/param) ----------
  GS.ruta = () => {
    const partes = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    return { nombre: partes[0] || 'cursos', params: partes.slice(1) };
  };
  GS.ir = (hash) => { if (location.hash === hash) GS.render(); else location.hash = hash; };

  // Pestañas visibles según rol.
  GS.pestanas = (p) => {
    const t = [['cursos', 'Mis cursos'], ['explorar', 'Explorador de cursos']];
    if (p.rol !== 'admin') t.push(['proponer', 'Proponer cursos']);
    if (p.rol === 'jefatura' || p.rol === 'gerente') t.push(['equipo', 'Mi equipo']);
    if (p.rol === 'visualizador') t.push(['equipo', 'Seguimiento']);
    if (p.rol === 'admin') t.push(['admin', 'Administración']);
    t.push(['perfil', 'Mi perfil']);
    return t;
  };
  const RUTAS_LIBRES = ['curso', 'certificado', 'editor'];
  function permitida(nombre, p) {
    if (RUTAS_LIBRES.includes(nombre)) return true;
    return GS.pestanas(p).some((t) => t[0] === nombre);
  }

  // ---------- Acciones ----------
  // GS.accion('nombre', fn, { escribe: true }) registra un manejador.
  // En el HTML: data-action="nombre" (clic), data-submit="nombre" (formulario), data-change="nombre" (cambio).
  // Las acciones que escriben se bloquean en el modo "ver como".
  const acciones = {};
  GS.accion = (nombre, fn, opts) => { acciones[nombre] = { fn, escribe: !!(opts && opts.escribe) }; };

  async function ejecutar(nombre, el, ev, extra) {
    const a = acciones[nombre];
    if (!a) { console.warn('Acción no encontrada:', nombre); return; }
    if (a.escribe && GS.soloLectura()) { GS.toast('Modo solo lectura: en "ver como" no se guardan cambios.'); return; }
    try {
      const r = await a.fn(el, ev, extra);
      if (r !== false) GS.render();
    } catch (e) {
      console.error(e);
      GS.toast(e && e.message ? e.message : 'Algo salió mal. Inténtalo de nuevo.', 'error');
    }
  }

  // Rutas en GS.ui para enlazar campos de formulario: data-bind="editor.titulo"
  GS.getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  GS.setPath = (obj, path, val) => {
    const ks = path.split('.');
    let o = obj;
    ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
    o[ks[ks.length - 1]] = val;
  };
  function valorDe(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'number') return el.value === '' ? '' : Number(el.value);
    return el.value;
  }

  function conectarEventos() {
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      if (el.tagName === 'A' || el.tagName === 'BUTTON') ev.preventDefault();
      ejecutar(el.dataset.action, el, ev);
    });
    document.addEventListener('submit', (ev) => {
      const f = ev.target.closest('form[data-submit]');
      if (!f) return;
      ev.preventDefault();
      ejecutar(f.dataset.submit, f, ev, new FormData(f));
    });
    const alCambiar = (ev) => {
      const el = ev.target;
      if (el.dataset && el.dataset.bind) {
        GS.setPath(GS.ui, el.dataset.bind, valorDe(el));
        if (el.hasAttribute('data-rerender') && ev.type === 'change') GS.render();
      }
      if (el.dataset && el.dataset.input && ev.type === 'input') ejecutar(el.dataset.input, el, ev);
      if (el.dataset && el.dataset.change && ev.type === 'change') ejecutar(el.dataset.change, el, ev);
    };
    document.addEventListener('input', alCambiar);
    document.addEventListener('change', alCambiar);
  }

  // ---------- Acciones generales ----------
  GS.accion('ir', (el) => { GS.ir(el.getAttribute('href') || el.dataset.href); return false; });
  GS.accion('cambiar-persona', async () => {
    if (GS.auth.activo()) {
      await GS.auth.salir();
      GS.sesion.salir();
      location.replace(location.pathname + '#/ingreso');
      location.reload();
      return false;
    }
    GS.sesion.salir(); GS.ir('#/ingreso'); return false;
  });
  GS.accion('restablecer', async () => {
    if (!confirm('Esto borra todo lo que has probado en este navegador y vuelve a cargar los datos de ejemplo. ¿Seguir?')) return false;
    await GS.store.reset();
    GS.ui = {};
    GS.toast('Datos de prueba restablecidos.');
  });
  GS.accion('salir-ver-como', () => { GS.sesion.dejarVerComo(); GS.ir('#/admin/personas'); return false; });

  // ---------- Diseño común ----------
  function barraProvisional(real) {
    if (GS.auth.activo()) return '';
    return html`<div class="devbar no-print"><div class="wrap">
      <span><strong>Acceso provisional</strong> · datos de prueba${real ? html` · ingresaste como ${real.nombre} (${GS.ROLES[real.rol]})` : ''}</span>
      ${real ? html`<button type="button" data-action="cambiar-persona">Cambiar de persona</button>` : ''}
      <button type="button" data-action="restablecer">Restablecer datos de prueba</button>
    </div></div>`;
  }
  function avisoVerComo(yo) {
    if (!GS.soloLectura()) return '';
    return html`<div class="viewas no-print" role="status"><div class="wrap">
      <span>Estás viendo Grey Skills como ${yo.nombre} (${GS.ROLES[yo.rol].toLowerCase()}). Modo solo lectura: nada de lo que hagas se guarda.</span>
      <button type="button" class="btn btn-sm" data-action="salir-ver-como">Volver a mi vista</button>
    </div></div>`;
  }
  GS.marca = () => html`<a class="brand" href="#/cursos"><span class="brand-name">Grey Skills</span><span class="brand-tag">Greystar Chile</span></a>`;

  function encabezado(yo, actual) {
    const pend = yo.rol === 'admin' && GS.bandejaPendientes ? GS.bandejaPendientes() : 0;
    return html`<header class="header no-print"><div class="wrap">
      ${GS.marca()}
      <nav class="nav" aria-label="Secciones">
        ${GS.pestanas(yo).map(([k, l]) => html`<a href="#/${k}" aria-current="${k === actual ? 'page' : 'false'}">${l}${k === 'admin' && pend ? html`<span class="badge" aria-label="${pend} pendientes">${pend}</span>` : ''}</a>`)}
      </nav>
      <a class="me" href="#/perfil">
        <span class="avatar" aria-hidden="true">${GS.iniciales(yo.nombre)}</span>
        <span class="me-txt"><span class="me-name">${yo.nombre}</span><span class="me-role">${GS.cargoDe(yo)} · ${GS.unidadDe(yo)}</span></span>
      </a>
    </div></header>`;
  }

  // ---------- Dibujo ----------
  GS.render = () => {
    const app = document.getElementById('app');
    const r = GS.ruta();
    const real = GS.real();

    // Con sesión abierta por RUT, la pantalla de ingreso no aplica: se va a "Mis cursos".
    if (real && r.nombre === 'ingreso' && GS.auth.activo()) { history.replaceState(null, '', '#/cursos'); r.nombre = 'cursos'; }
    if (!real || r.nombre === 'ingreso') {
      pintar(app, html`${barraProvisional(null)}${GS.vistas.ingreso.render()}`, 'Ingreso');
      return;
    }
    // Primer ingreso (o clave restablecida): debe cambiar la clave provisoria antes de seguir.
    if (GS.auth.provisoria()) {
      pintar(app, GS.vistas.claveNueva.render({ yo: real }), 'Crea tu clave');
      return;
    }
    const yo = GS.yo();
    let nombre = r.nombre;
    if (!GS.vistas[nombre] || !permitida(nombre, yo)) { nombre = 'cursos'; if (location.hash !== '#/cursos') { history.replaceState(null, '', '#/cursos'); } }
    const vista = GS.vistas[nombre];
    const ctx = { yo, real, params: r.params, soloLectura: GS.soloLectura() };
    const cuerpo = vista.render(ctx);
    let pagina;
    if (vista.layout === 'propio') pagina = html`${barraProvisional(real)}${avisoVerComo(yo)}${cuerpo}`;
    else pagina = html`${barraProvisional(real)}${encabezado(yo, nombre)}${avisoVerComo(yo)}<main class="main" id="contenido">${cuerpo}</main>`;
    pintar(app, pagina, typeof vista.titulo === 'function' ? vista.titulo(ctx) : vista.titulo);
  };

  let ultimaRuta = null;
  function pintar(app, contenido, titulo) {
    // Conserva el foco y la posición del cursor al redibujar (por ejemplo, al escribir en un buscador).
    const act = document.activeElement;
    const id = act && act.id;
    let sel = null;
    try { if (act && typeof act.selectionStart === 'number') sel = [act.selectionStart, act.selectionEnd]; } catch (e) { /* tipo de campo sin cursor */ }
    app.innerHTML = String(contenido);
    document.title = (titulo ? titulo + ' · ' : '') + 'Grey Skills';
    if (id) {
      const el = document.getElementById(id);
      if (el) { el.focus({ preventScroll: true }); if (sel) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* sin cursor */ } } }
    }
    const rutaActual = location.hash;
    if (rutaActual !== ultimaRuta) { ultimaRuta = rutaActual; window.scrollTo(0, 0); }
  }

  // ---------- Inicio ----------
  GS.iniciar = async () => {
    try {
      await GS.auth.init();
      // Con ingreso por RUT, los datos se cargan solo después de ingresar.
      if (!GS.auth.activo() || GS.auth.personaId()) await GS.store.init();
      if (!GS.auth.activo()) await GS.asegurarVistas();
      else if (GS.auth.personaId() && !GS.real()) {
        await GS.auth.salir();
        GS.ui.ingreso = { msg: 'Tu acceso está desactivado. Si crees que es un error, habla con tu jefatura.' };
      }
    }
    catch (e) {
      console.error(e);
      document.getElementById('app').innerHTML = String(html`<p style="padding:24px;font-family:Arial,sans-serif">No se pudo conectar con la base de datos de Grey Skills. Revisa tu conexión y recarga la página.</p>`);
      return;
    }
    GS.store.alCambiar(() => GS.render());
    conectarEventos();
    window.addEventListener('hashchange', GS.render);
    GS.render();
    if (!GS.store.persistente()) GS.toast('Este navegador no permite guardar datos. Prueba con Chrome o Edge.', 'error');
  };
})(window.GS);
