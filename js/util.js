// Utilidades generales: plantillas HTML seguras, fechas, RUT, avisos y exportación.
window.GS = window.GS || {};

(function (GS) {
  // ---------- Plantillas HTML ----------
  // html`...` escapa todo lo que se interpola, salvo lo marcado con raw() u otro html`...`.
  class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(v) {
    if (v == null || v === false) return '';
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(fmt).join('');
    return esc(String(v));
  }

  GS.raw = (s) => new Raw(String(s));
  GS.esc = esc;
  GS.html = (strings, ...vals) => new Raw(strings.reduce((acc, s, i) => acc + s + (i < vals.length ? fmt(vals[i]) : ''), ''));
  GS.attr = (cond, name) => (cond ? GS.raw(' ' + name) : '');

  // ---------- Idioma (español por defecto, inglés a un clic) ----------
  // Los textos se escriben en español dentro de GS.t('...') y la traducción está en js/i18n-en.js.
  // Variables: GS.t('Hola, {nombre}', { nombre }). Si una variable es html`...`, el resultado también lo es.
  // El contenido que escriben las personas (cursos, nombres, unidades) no se traduce.
  const KEY_IDIOMA = 'greyskills:idioma';
  GS.idioma = (() => {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'es') { localStorage.setItem(KEY_IDIOMA, q); return q; }
      return localStorage.getItem(KEY_IDIOMA) === 'en' ? 'en' : 'es';
    } catch (e) { return 'es'; }
  })();
  document.documentElement.lang = GS.idioma;
  GS.cambiarIdioma = (l) => {
    try { localStorage.setItem(KEY_IDIOMA, l); } catch (e) { /* solo esta visita */ }
    const u = new URL(location.href);
    u.searchParams.set('lang', l);
    location.replace(u.toString());
  };
  GS.faltanTraducir = new Set();
  GS.t = (es, vars) => {
    let s = es;
    if (GS.idioma === 'en') {
      const en = (GS.EN || {})[es];
      if (en != null) s = en; else GS.faltanTraducir.add(es);
    }
    if (!vars) return s;
    const conHtml = Object.values(vars).some((v) => v instanceof Raw);
    const r = (conHtml ? esc(s) : s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (conHtml ? fmt(vars[k]) : String(vars[k] == null ? '' : vars[k])) : m));
    return conHtml ? new Raw(r) : r;
  };

  // ---------- Identificadores ----------
  GS.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- Fechas (formato ISO 'AAAA-MM-DD') ----------
  const MESES = GS.idioma === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function toISO(d) {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function parseISO(s) {
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  GS.hoy = () => toISO(new Date());
  GS.ahora = () => new Date().toISOString();
  GS.sumarDias = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  GS.diasEntre = (desde, hasta) => Math.round((parseISO(hasta) - parseISO(desde)) / 86400000);
  GS.fecha = (iso, conAnio) => {
    if (!iso) return '';
    const d = parseISO(iso);
    if (GS.idioma === 'en') return MESES[d.getMonth()] + ' ' + d.getDate() + (conAnio ? ', ' + d.getFullYear() : '');
    return d.getDate() + ' de ' + MESES[d.getMonth()] + (conAnio ? ' de ' + d.getFullYear() : '');
  };
  GS.fechaCorta = (iso) => {
    if (!iso) return '';
    const d = parseISO(iso);
    return GS.idioma === 'en' ? MESES[d.getMonth()].slice(0, 3) + ' ' + d.getDate() : d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3);
  };

  // ---------- RUT chileno ----------
  GS.limpiarRut = (rut) => String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
  GS.rutValido = (rut) => {
    const r = GS.limpiarRut(rut);
    if (r.length < 2) return false;
    const cuerpo = r.slice(0, -1), dv = r.slice(-1);
    let suma = 0, mul = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) { suma += Number(cuerpo[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
    const res = 11 - (suma % 11);
    const esperado = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dv === esperado;
  };
  GS.formatearRut = (rut) => {
    const r = GS.limpiarRut(rut);
    if (r.length < 2) return rut;
    const cuerpo = r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return cuerpo + '-' + r.slice(-1);
  };

  // ---------- Texto ----------
  GS.iniciales = (nombre) => String(nombre || '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  GS.primerNombre = (nombre) => String(nombre || '').split(/\s+/)[0];
  GS.capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  GS.normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // uno y varios se escriben en español; se traducen aquí.
  GS.plural = (n, uno, varios) => n + ' ' + GS.t(n === 1 ? uno : varios);

  // ---------- Avisos ----------
  let toastTimer = null;
  GS.toast = (msg, tipo) => {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'toast toast-on' + (tipo === 'error' ? ' toast-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
  };

  // ---------- Exportar a Excel (CSV con separador ; para Excel en español) ----------
  GS.descargarCSV = (nombre, filas) => {
    const celda = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const txt = '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ---------- Links de video y documentos ----------
  // Devuelve una URL apta para <iframe> si el link es de YouTube, Vimeo o Google Drive; si no, null.
  GS.urlEmbebible = (url) => {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1];
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1];
    m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
    return null;
  };
  GS.urlSegura = (url) => (/^https?:\/\//i.test(String(url || '').trim()) ? String(url).trim() : '');
})(window.GS);
