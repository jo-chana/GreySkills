// Módulos tipo juego: ¿Qué harías? (escenario), Ordenar pasos, Emparejar y Clasificar.
// Se juegan tocando (pensado para celular). El resultado se guarda como el de un quiz (inscripción.quiz[módulo])
// y el módulo se aprueba con la nota mínima del curso. Intentos ilimitados: cada intento vuelve a desordenar.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const S = () => GS.store;
  const LETRAS = 'ABCD';

  const lleno = (s) => !!String(s == null ? '' : s).trim();
  // Desordena 0..n-1 sin dejarlo en el orden original (si hay más de un elemento).
  function desordenar(n) {
    const a = Array.from({ length: n }, (x, i) => i);
    for (let vuelta = 0; vuelta < 10; vuelta++) {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (n < 2 || a.some((v, i) => v !== i)) break;
    }
    return a;
  }

  // Contenido del juego sin filas vacías (las deja fuera del juego, conservando su posición original).
  const situaciones = (m) => (m.situaciones || []).filter((s) => lleno(s.texto));
  const pasos = (m) => (m.pasos || []).filter(lleno);
  const pares = (m) => (m.pares || []).filter((p) => lleno(p.a) && lleno(p.b));
  const tarjetas = (m) => (m.tarjetas || []).filter((t) => lleno(t.t));

  GS.juegos = {
    es: (tipo) => ['escenario', 'ordenar', 'emparejar', 'clasificar'].includes(tipo),

    nuevo(tipo, base) {
      if (tipo === 'escenario') return Object.assign(base, { titulo: GS.t('¿Qué harías?'), indicaciones: '', situaciones: [situacionVacia()] });
      if (tipo === 'ordenar') return Object.assign(base, { titulo: GS.t('Ordena los pasos'), indicaciones: '', pasos: ['', '', ''] });
      if (tipo === 'emparejar') return Object.assign(base, { titulo: GS.t('Une cada par'), indicaciones: '', pares: [{ a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }] });
      return Object.assign(base, { titulo: GS.t('Clasifica'), indicaciones: '', categorias: ['', ''], tarjetas: [{ t: '', cat: 0 }, { t: '', cat: 0 }, { t: '', cat: 1 }, { t: '', cat: 1 }] });
    },

    // Problemas que impiden publicar (los usa el editor).
    problemas(m, n) {
      const p = [];
      if (m.tipo === 'escenario') {
        if (!situaciones(m).length) p.push(GS.t('{modulo}: agrega al menos una situación.', { modulo: n }));
        situaciones(m).forEach((s, j) => {
          if (s.alts.filter(lleno).length < 2) p.push(GS.t('{modulo}, situación {n}: necesita al menos 2 opciones.', { modulo: n, n: j + 1 }));
          if (!lleno(s.alts[s.ok])) p.push(GS.t('{modulo}, situación {n}: marca como correcta una opción que tenga texto.', { modulo: n, n: j + 1 }));
        });
      } else if (m.tipo === 'ordenar') {
        if (pasos(m).length < 3) p.push(GS.t('{modulo}: escribe al menos 3 pasos.', { modulo: n }));
      } else if (m.tipo === 'emparejar') {
        if (pares(m).length < 3) p.push(GS.t('{modulo}: completa al menos 3 pares.', { modulo: n }));
      } else if (m.tipo === 'clasificar') {
        if ((m.categorias || []).filter(lleno).length < 2) p.push(GS.t('{modulo}: escribe al menos 2 categorías.', { modulo: n }));
        if (tarjetas(m).length < 4) p.push(GS.t('{modulo}: escribe al menos 4 tarjetas.', { modulo: n }));
        if (tarjetas(m).some((t) => !lleno((m.categorias || [])[Number(t.cat)]))) p.push(GS.t('{modulo}: cada tarjeta debe ir en una categoría con nombre.', { modulo: n }));
      }
      return p;
    },

    // ---------- Jugar ----------
    // ctx: { k, ins, st, hecho }. Devuelve { cuerpo, aprobado }.
    render(m, ctx) {
      const { k, ins, st, hecho } = ctx;
      st.juego = st.juego || {};
      if (GS.juegos.problemas(m, '').length) {
        return { cuerpo: html`<div class="notice">${GS.t('Este juego todavía no está completo. Quien creó el curso debe terminar de armarlo en el editor.')}</div>`, aprobado: hecho };
      }
      const e = st.juego[m.id] = st.juego[m.id] || estadoNuevo(m);
      const guardado = ins && ins.quiz[m.id];
      const aprobado = hecho || !!(guardado && guardado.aprobado) || !!(e.resultado && e.resultado.aprobado);
      let juego;
      if (m.tipo === 'escenario') juego = jugarEscenario(m, e);
      else if (m.tipo === 'ordenar') juego = jugarOrdenar(m, e);
      else if (m.tipo === 'emparejar') juego = jugarEmparejar(m, e);
      else juego = jugarClasificar(m, e);

      const r = e.resultado;
      const resultado = r ? (r.aprobado
        ? html`<div class="notice notice-ok" role="status"><strong class="strong" style="font-size:18px">${GS.t('¡Lo lograste! {n} de {total} ({nota} %)', { n: r.correctas, total: r.total, nota: r.nota })}</strong><br>${GS.t('Ya puedes seguir con el curso.')}</div>`
        : html`<div class="notice notice-error" role="status"><strong class="strong" style="font-size:18px">${GS.t('Aún no · {n} de {total} ({nota} %)', { n: r.correctas, total: r.total, nota: r.nota })}</strong><br>${GS.t('Necesitas {nota} %.', { nota: k.config.notaMinima })} ${GS.t('Revisa las respuestas marcadas e inténtalo de nuevo: no hay límite de intentos.')}</div>`) : '';

      const cuerpo = html`<div class="stack" style="gap:18px">
        ${m.indicaciones ? html`<p style="margin:0;font-size:16px;line-height:1.55">${m.indicaciones}</p>` : ''}
        <p class="muted small" style="margin:0">${GS.t('Necesitas {nota} % de aciertos para aprobar.', { nota: k.config.notaMinima })}${guardado && !r ? ' ' + GS.t('Tu mejor resultado: {nota} %.', { nota: guardado.nota }) : ''}</p>
        ${juego}
        ${resultado}
        ${r ? html`<button type="button" class="btn2 self-start" data-action="jg-reiniciar" data-id="${m.id}">${r.aprobado ? GS.t('Jugar de nuevo') : GS.t('Intentar de nuevo')}</button>` : ''}
      </div>`;
      return { cuerpo, aprobado };
    },

    // ---------- Editor ----------
    campos(m, base) {
      const ind = html`<div><label class="label" for="ed-ind">${GS.t('Indicaciones (opcional)')}</label><textarea id="ed-ind" class="input" rows="2" data-bind="${base}.indicaciones">${m.indicaciones || ''}</textarea></div>`;
      const borrar = (accion, j, etiqueta) => html`<button type="button" class="icon-btn" aria-label="${etiqueta}" data-action="${accion}" data-j="${j}">×</button>`;
      if (m.tipo === 'escenario') {
        return html`${ind}
          <p class="help" style="margin:0">${GS.t('Describe situaciones reales del trabajo. Para cada opción escribe qué pasaría si la persona la elige: eso es lo que aprende al equivocarse.')}</p>
          ${m.situaciones.map((s, j) => html`<div class="q-box">
            <div class="row" style="justify-content:space-between"><label class="label" style="margin:0" for="jg-s-${j}">${GS.t('Situación {n}', { n: j + 1 })}</label>${borrar('jg-sit-del', j, GS.t('Eliminar situación {n}', { n: j + 1 }))}</div>
            <textarea id="jg-s-${j}" class="input" rows="2" placeholder="${GS.t('Ej: Un residente llega molesto porque su encomienda no aparece.')}" data-bind="${base}.situaciones.${j}.texto" maxlength="400">${s.texto}</textarea>
            <span class="muted xs">${GS.t('Opciones: marca la mejor respuesta y explica qué pasa con cada una')}</span>
            ${s.alts.map((a, x) => html`<div class="stack-sm" style="gap:6px">
              <div class="alt-row">
                <input type="radio" name="jg-ok-${m.id}-${j}" aria-label="${GS.t('Marcar opción {letra} como la mejor', { letra: LETRAS[x] })}" data-action="jg-ok" data-j="${j}" data-x="${x}"${GS.attr(s.ok === x, 'checked')}>
                <span class="alt-letter">${LETRAS[x]}</span>
                <input class="input" placeholder="${GS.t('Opción')}" aria-label="${GS.t('Opción {letra}', { letra: LETRAS[x] })}" data-bind="${base}.situaciones.${j}.alts.${x}" value="${a}" maxlength="200"></div>
              <input class="input" style="margin-left:58px;width:calc(100% - 58px)" placeholder="${GS.t('Qué pasa si elige esta opción')}" aria-label="${GS.t('Explicación de la opción {letra}', { letra: LETRAS[x] })}" data-bind="${base}.situaciones.${j}.fbs.${x}" value="${(s.fbs || [])[x] || ''}" maxlength="300">
            </div>`)}
          </div>`)}
          ${m.situaciones.length < 8 ? html`<button type="button" class="btn2 btn-sm self-start" data-action="jg-sit-add">${GS.t('+ Agregar situación')}</button>` : ''}`;
      }
      if (m.tipo === 'ordenar') {
        return html`${ind}
          <div class="stack-sm" style="gap:10px"><span class="label" style="margin:0">${GS.t('Pasos en el orden correcto')}</span>
            <p class="help" style="margin:0">${GS.t('Escríbelos en el orden correcto; al jugar, la plataforma los desordena.')}</p>
            ${m.pasos.map((v, j) => html`<div class="row" style="flex-wrap:nowrap;gap:8px">
              <span class="alt-letter">${j + 1}</span>
              <label class="sr-only" for="jg-p-${j}">${GS.t('Paso {n}', { n: j + 1 })}</label>
              <input id="jg-p-${j}" class="input" data-bind="${base}.pasos.${j}" value="${v}" maxlength="160">
              ${borrar('jg-paso-del', j, GS.t('Eliminar paso {n}', { n: j + 1 }))}</div>`)}
            ${m.pasos.length < 10 ? html`<button type="button" class="btn2 btn-sm self-start" data-action="jg-paso-add">${GS.t('+ Agregar paso')}</button>` : ''}</div>`;
      }
      if (m.tipo === 'emparejar') {
        return html`${ind}
          <div class="stack-sm" style="gap:10px"><span class="label" style="margin:0">${GS.t('Pares (cada elemento con su pareja correcta)')}</span>
            <p class="help" style="margin:0">${GS.t('Al jugar, la columna derecha aparece desordenada.')}</p>
            ${m.pares.map((p, j) => html`<div class="row" style="flex-wrap:nowrap;gap:8px">
              <input class="input" placeholder="${GS.t('Elemento')}" aria-label="${GS.t('Elemento {n}', { n: j + 1 })}" data-bind="${base}.pares.${j}.a" value="${p.a}" maxlength="120">
              <span aria-hidden="true">↔</span>
              <input class="input" placeholder="${GS.t('Su pareja')}" aria-label="${GS.t('Pareja del elemento {n}', { n: j + 1 })}" data-bind="${base}.pares.${j}.b" value="${p.b}" maxlength="120">
              ${borrar('jg-par-del', j, GS.t('Eliminar par {n}', { n: j + 1 }))}</div>`)}
            ${m.pares.length < 8 ? html`<button type="button" class="btn2 btn-sm self-start" data-action="jg-par-add">${GS.t('+ Agregar par')}</button>` : ''}</div>`;
      }
      const cats = m.categorias;
      return html`${ind}
        <div class="stack-sm" style="gap:10px"><span class="label" style="margin:0">${GS.t('Categorías')}</span>
          ${cats.map((c, j) => html`<div class="row" style="flex-wrap:nowrap;gap:8px">
            <input class="input" placeholder="${GS.t('Ej: Urgente')}" aria-label="${GS.t('Categoría {n}', { n: j + 1 })}" data-bind="${base}.categorias.${j}" value="${c}" maxlength="60" data-rerender>
            ${cats.length > 2 ? borrar('jg-cat-del', j, GS.t('Eliminar categoría {n}', { n: j + 1 })) : ''}</div>`)}
          ${cats.length < 4 ? html`<button type="button" class="btn2 btn-sm self-start" data-action="jg-cat-add">${GS.t('+ Agregar categoría')}</button>` : ''}</div>
        <div class="stack-sm" style="gap:10px"><span class="label" style="margin:0">${GS.t('Tarjetas y su categoría correcta')}</span>
          ${m.tarjetas.map((t, j) => html`<div class="row" style="flex-wrap:nowrap;gap:8px">
            <input class="input" placeholder="${GS.t('Ej: Corte de agua en todo el edificio')}" aria-label="${GS.t('Tarjeta {n}', { n: j + 1 })}" data-bind="${base}.tarjetas.${j}.t" value="${t.t}" maxlength="140">
            <select class="input" style="max-width:200px" aria-label="${GS.t('Categoría de la tarjeta {n}', { n: j + 1 })}" data-bind="${base}.tarjetas.${j}.cat">
              ${cats.map((c, x) => html`<option value="${x}"${GS.attr(Number(t.cat) === x, 'selected')}>${lleno(c) ? c : GS.t('Categoría {n}', { n: x + 1 })}</option>`)}</select>
            ${borrar('jg-tarj-del', j, GS.t('Eliminar tarjeta {n}', { n: j + 1 }))}</div>`)}
          ${m.tarjetas.length < 12 ? html`<button type="button" class="btn2 btn-sm self-start" data-action="jg-tarj-add">${GS.t('+ Agregar tarjeta')}</button>` : ''}</div>`;
    }
  };

  const situacionVacia = () => ({ texto: '', alts: ['', '', ''], fbs: ['', '', ''], ok: 0 });

  function estadoNuevo(m) {
    if (m.tipo === 'escenario') return { paso: 0, intentos: {}, resultado: null };
    if (m.tipo === 'ordenar') return { pool: desordenar(pasos(m).length), elegidos: [], resultado: null };
    if (m.tipo === 'emparejar') return { der: desordenar(pares(m).length), sel: null, asign: {}, resultado: null };
    return { orden: desordenar(tarjetas(m).length), asign: {}, resultado: null };
  }

  // ---------- ¿Qué harías? ----------
  function jugarEscenario(m, e) {
    const lista = situaciones(m);
    if (e.resultado) {
      return html`<ol class="juego-repaso">${lista.map((s, i) => {
        const primera = (e.intentos[i] || [])[0];
        const bien = primera === s.ok;
        return html`<li><span class="${bien ? 't-ok' : 't-late'}">${bien ? '✓' : '✗'}</span> ${s.texto}<div class="muted small">${GS.t('Mejor respuesta: {opcion}', { opcion: s.alts[s.ok] })}</div></li>`;
      })}</ol>`;
    }
    const i = e.paso;
    const s = lista[i];
    const probadas = e.intentos[i] || [];
    const resuelta = probadas.includes(s.ok);
    const ultima = probadas[probadas.length - 1];
    const fb = ultima != null ? ((s.fbs || [])[ultima] || (ultima === s.ok ? GS.t('¡Bien! Es la mejor opción.') : GS.t('No es la mejor opción. Prueba otra.'))) : '';
    return html`<div class="stack" style="gap:14px">
      <span class="muted xs strong">${GS.t('Situación {n} de {total}', { n: i + 1, total: lista.length })}</span>
      <div class="juego-escena">${s.texto}</div>
      <span class="strong" style="font-family:var(--sans)">${GS.t('¿Qué harías?')}</span>
      <div class="stack-sm" style="gap:10px">
        ${s.alts.map((a, j) => {
          if (!lleno(a)) return '';
          const elegida = probadas.includes(j);
          const cls = elegida ? (j === s.ok ? ' bien' : ' mal') : '';
          return html`<button type="button" class="juego-opt${cls}" data-action="jg-esc" data-id="${m.id}" data-j="${j}"${GS.attr(resuelta || elegida, 'disabled')}><span class="alt-letter">${LETRAS[j]}</span><span>${a}</span></button>`;
        })}
      </div>
      ${fb ? html`<div class="notice ${ultima === s.ok ? 'notice-info' : 'notice-warn'}" role="status">${fb}</div>` : ''}
      ${resuelta ? html`<button type="button" class="btn self-start" data-action="jg-esc-sig" data-id="${m.id}">${i < lista.length - 1 ? GS.t('Siguiente situación') : GS.t('Ver resultado')}</button>` : ''}
    </div>`;
  }

  // ---------- Ordenar pasos ----------
  function jugarOrdenar(m, e) {
    const lista = pasos(m);
    const r = e.resultado;
    const libres = e.pool.filter((p) => !e.elegidos.includes(p));
    return html`<div class="stack" style="gap:16px">
      <div class="stack-sm" style="gap:8px">
        <span class="label" style="margin:0">${GS.t('Tu orden')}</span>
        ${e.elegidos.length ? html`<ol class="juego-orden">${e.elegidos.map((p, pos) => {
          const marca = r ? (p === pos ? ' bien' : ' mal') : '';
          return html`<li><button type="button" class="juego-opt${marca}" data-action="jg-ord-quitar" data-id="${m.id}" data-j="${pos}"${GS.attr(!!r, 'disabled')}>
            <span class="alt-letter">${pos + 1}</span><span>${lista[p]}</span>
            ${r && p !== pos ? html`<span class="tag">${GS.t('Va en el lugar {n}', { n: p + 1 })}</span>` : ''}</button></li>`;
        })}</ol>` : html`<p class="muted small" style="margin:0">${GS.t('Toca los pasos de abajo en el orden en que se hacen.')}</p>`}
      </div>
      ${!r && libres.length ? html`<div class="stack-sm" style="gap:8px">
        <span class="label" style="margin:0">${GS.t('Pasos por ordenar')}</span>
        <div class="juego-fichas">${libres.map((p) => html`<button type="button" class="juego-ficha" data-action="jg-ord-poner" data-id="${m.id}" data-p="${p}">${lista[p]}</button>`)}</div>
      </div>` : ''}
      ${!r && e.elegidos.length ? html`<p class="muted xs" style="margin:0">${GS.t('¿Te equivocaste? Toca un paso de tu orden para devolverlo.')}</p>` : ''}
      ${!r && !libres.length ? html`<button type="button" class="btn self-start" data-action="jg-revisar" data-id="${m.id}">${GS.t('Revisar')}</button>` : ''}
    </div>`;
  }

  // ---------- Emparejar ----------
  function jugarEmparejar(m, e) {
    const lista = pares(m);
    const r = e.resultado;
    const completo = lista.every((p, i) => e.asign[i] != null);
    const duenoDe = (d) => Object.keys(e.asign).find((i) => e.asign[i] === d);
    return html`<div class="stack" style="gap:14px">
      ${!r ? html`<p class="muted small" style="margin:0">${e.sel == null ? GS.t('Toca un elemento de la izquierda y luego su pareja a la derecha.') : GS.t('Ahora toca su pareja en la columna derecha.')}</p>` : ''}
      <div class="juego-pares">
        <div class="stack-sm" style="gap:8px">${lista.map((p, i) => {
          const marca = r ? (e.asign[i] === i ? ' bien' : ' mal') : e.sel === i ? ' sel' : '';
          return html`<button type="button" class="juego-opt${marca}" data-action="jg-emp-izq" data-id="${m.id}" data-j="${i}" aria-pressed="${String(e.sel === i)}"${GS.attr(!!r, 'disabled')}>
            <span class="alt-letter">${i + 1}</span><span>${p.a}</span>
            ${r && e.asign[i] !== i ? html`<span class="tag">${GS.t('Era: {pareja}', { pareja: p.b })}</span>` : ''}</button>`;
        })}</div>
        <div class="stack-sm" style="gap:8px">${e.der.map((d) => {
          const dueno = duenoDe(d);
          return html`<button type="button" class="juego-opt${dueno != null ? ' sel' : ''}" data-action="jg-emp-der" data-id="${m.id}" data-j="${d}"${GS.attr(!!r || e.sel == null, 'disabled')}>
            <span class="alt-letter">${dueno != null ? Number(dueno) + 1 : '·'}</span><span>${lista[d].b}</span></button>`;
        })}</div>
      </div>
      ${!r && completo ? html`<button type="button" class="btn self-start" data-action="jg-revisar" data-id="${m.id}">${GS.t('Revisar')}</button>` : ''}
    </div>`;
  }

  // ---------- Clasificar ----------
  function jugarClasificar(m, e) {
    const lista = tarjetas(m);
    const cats = (m.categorias || []).map((c, x) => ({ c, x })).filter((o) => lleno(o.c));
    const r = e.resultado;
    const pendientes = e.orden.filter((t) => e.asign[t] == null);
    const actual = pendientes[0];
    return html`<div class="stack" style="gap:16px">
      ${!r && actual != null ? html`<div class="stack-sm" style="gap:10px">
        <span class="muted xs strong">${GS.t('Tarjeta {n} de {total}', { n: lista.length - pendientes.length + 1, total: lista.length })}</span>
        <div class="juego-tarjeta">${lista[actual].t}</div>
        <span class="strong" style="font-family:var(--sans)">${GS.t('¿En qué categoría va?')}</span>
        <div class="juego-fichas">${cats.map((o) => html`<button type="button" class="btn2" data-action="jg-cla" data-id="${m.id}" data-t="${actual}" data-c="${o.x}">${o.c}</button>`)}</div>
      </div>` : ''}
      <div class="juego-bins">${cats.map((o) => {
        const dentro = e.orden.filter((t) => e.asign[t] === o.x);
        return html`<div class="juego-bin"><span class="strong" style="font-family:var(--sans)">${o.c}</span>
          ${dentro.length ? dentro.map((t) => {
            const marca = r ? (Number(lista[t].cat) === o.x ? ' bien' : ' mal') : '';
            return html`<button type="button" class="juego-ficha${marca}" data-action="jg-cla-quitar" data-id="${m.id}" data-t="${t}"${GS.attr(!!r, 'disabled')}>${lista[t].t}${r && Number(lista[t].cat) !== o.x ? html` <span class="tag">${GS.t('Va en: {categoria}', { categoria: (m.categorias || [])[Number(lista[t].cat)] })}</span>` : ''}</button>`;
          }) : html`<span class="muted xs">${GS.t('Vacía')}</span>`}</div>`;
      })}</div>
      ${!r && Object.keys(e.asign).length ? html`<p class="muted xs" style="margin:0">${GS.t('¿Te equivocaste? Toca una tarjeta para devolverla.')}</p>` : ''}
      ${!r && actual == null ? html`<button type="button" class="btn self-start" data-action="jg-revisar" data-id="${m.id}">${GS.t('Revisar')}</button>` : ''}
    </div>`;
  }

  // ---------- Resultado ----------
  function evaluar(m, e) {
    let correctas = 0, total = 0;
    if (m.tipo === 'escenario') { const l = situaciones(m); total = l.length; correctas = l.filter((s, i) => (e.intentos[i] || [])[0] === s.ok).length; }
    else if (m.tipo === 'ordenar') { total = pasos(m).length; correctas = e.elegidos.filter((p, pos) => p === pos).length; }
    else if (m.tipo === 'emparejar') { total = pares(m).length; correctas = Object.keys(e.asign).filter((i) => e.asign[i] === Number(i)).length; }
    else { const l = tarjetas(m); total = l.length; correctas = l.filter((t, i) => e.asign[i] === Number(t.cat)).length; }
    return { correctas, total, nota: total ? Math.round(correctas / total * 100) : 0 };
  }

  function contexto(id) {
    const yo = GS.yo();
    const k = GS.curso(GS.ruta().params[0]);
    const ins = k ? GS.ins(yo.id, k.id) : null;
    const m = k.modulos.find((x) => x.id === id);
    return { k, ins, m, e: GS.ui.curso.juego[id] };
  }

  async function cerrar(id) {
    const { k, ins, m, e } = contexto(id);
    const r = evaluar(m, e);
    r.aprobado = r.nota >= k.config.notaMinima;
    e.resultado = r;
    if (!ins || GS.soloLectura()) return;
    const prev = ins.quiz[m.id] || { intentos: 0 };
    const quiz = Object.assign({}, ins.quiz, { [m.id]: { intentos: prev.intentos + 1, aprobado: !!prev.aprobado || r.aprobado, nota: Math.max(prev.nota || 0, r.nota) } });
    await S().update('inscripciones', ins.id, { quiz });
  }

  GS.accion('jg-revisar', async (el) => { await cerrar(el.dataset.id); });
  GS.accion('jg-reiniciar', (el) => { const { m } = contexto(el.dataset.id); GS.ui.curso.juego[m.id] = estadoNuevo(m); });

  GS.accion('jg-esc', (el) => { const { e } = contexto(el.dataset.id); const i = e.paso; (e.intentos[i] = e.intentos[i] || []).push(Number(el.dataset.j)); });
  GS.accion('jg-esc-sig', async (el) => {
    const { m, e } = contexto(el.dataset.id);
    if (e.paso < situaciones(m).length - 1) { e.paso++; return; }
    await cerrar(el.dataset.id);
  });

  GS.accion('jg-ord-poner', (el) => { const { e } = contexto(el.dataset.id); e.elegidos.push(Number(el.dataset.p)); });
  GS.accion('jg-ord-quitar', (el) => { const { e } = contexto(el.dataset.id); e.elegidos.splice(Number(el.dataset.j), 1); });

  GS.accion('jg-emp-izq', (el) => { const { e } = contexto(el.dataset.id); const i = Number(el.dataset.j); e.sel = e.sel === i ? null : i; });
  GS.accion('jg-emp-der', (el) => {
    const { e } = contexto(el.dataset.id);
    if (e.sel == null) return;
    const d = Number(el.dataset.j);
    Object.keys(e.asign).forEach((i) => { if (e.asign[i] === d) delete e.asign[i]; });
    e.asign[e.sel] = d;
    e.sel = null;
  });

  GS.accion('jg-cla', (el) => { const { e } = contexto(el.dataset.id); e.asign[Number(el.dataset.t)] = Number(el.dataset.c); });
  GS.accion('jg-cla-quitar', (el) => { const { e } = contexto(el.dataset.id); delete e.asign[Number(el.dataset.t)]; });

  // ---------- Acciones del editor ----------
  const modSel = () => GS.ui.editor.draft.modulos.find((x) => x.id === GS.ui.editor.sel);
  GS.accion('jg-ok', (el) => { modSel().situaciones[Number(el.dataset.j)].ok = Number(el.dataset.x); });
  GS.accion('jg-sit-add', () => { modSel().situaciones.push(situacionVacia()); });
  GS.accion('jg-sit-del', (el) => { const m = modSel(); m.situaciones.splice(Number(el.dataset.j), 1); if (!m.situaciones.length) m.situaciones.push(situacionVacia()); });
  GS.accion('jg-paso-add', () => { modSel().pasos.push(''); });
  GS.accion('jg-paso-del', (el) => { modSel().pasos.splice(Number(el.dataset.j), 1); });
  GS.accion('jg-par-add', () => { modSel().pares.push({ a: '', b: '' }); });
  GS.accion('jg-par-del', (el) => { modSel().pares.splice(Number(el.dataset.j), 1); });
  GS.accion('jg-cat-add', () => { modSel().categorias.push(''); });
  GS.accion('jg-cat-del', (el) => {
    const m = modSel();
    const j = Number(el.dataset.j);
    m.categorias.splice(j, 1);
    // Las tarjetas de la categoría eliminada pasan a la primera; las siguientes corren su número.
    m.tarjetas.forEach((t) => { const c = Number(t.cat); t.cat = c === j ? 0 : c > j ? c - 1 : c; });
  });
  GS.accion('jg-tarj-add', () => { modSel().tarjetas.push({ t: '', cat: 0 }); });
  GS.accion('jg-tarj-del', (el) => { modSel().tarjetas.splice(Number(el.dataset.j), 1); });
})(window.GS);
