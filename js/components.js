// Piezas reutilizables de interfaz.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp = {};

  C.chipEstado = (k) => html`<span class="chip ${GS.SEM[k].c}">${GS.SEM[k].l}</span>`;
  C.chipCurso = (estado) => html`<span class="chip ${GS.ESTADOS_CURSO[estado].c}">${GS.ESTADOS_CURSO[estado].l}</span>`;
  C.chipTipo = (tipo) => html`<span class="chip ${GS.TIPOS_MODULO[tipo].c}">${GS.TIPOS_MODULO[tipo].l}</span>`;

  C.barra = (pct, extra) => html`<div class="bar-row"><div class="bar ${extra || ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Avance"><span style="width:${pct}%"></span></div><span class="bar-pct">${pct}%</span></div>`;

  C.icono = (color) => html`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"></path><path d="M4 21a2 2 0 0 1 2-2h13v2H6"></path><path d="M9 7h6"></path></svg>`;

  C.metaCurso = (k) => GS.plural(k.modulos.length, 'módulo', 'módulos') + (k.config && k.config.duracion ? ' · ' + k.config.duracion : '');

  // Tarjeta de "Mis cursos".
  C.tarjetaMiCurso = (ins) => {
    const k = GS.curso(ins.cursoId);
    const pct = GS.avance(ins);
    const est = GS.estado(ins);
    return html`<article class="card course">
      <div class="course-thumb" style="background:${k.portada}">${C.icono(GS.tintaPortada(k.portada))}</div>
      <div class="course-body">
        ${C.chipEstado(est)}
        <h3 class="h3"><a href="#/curso/${k.id}">${k.titulo}</a></h3>
        <p class="muted small" style="margin:0">${C.metaCurso(k)}${ins.origen === 'asignado' && ins.plazo ? ' · ' + GS.plazoTxt(ins) : ''}</p>
        <div class="mt-auto">${C.barra(pct)}</div>
        <a class="btn self-start" href="#/curso/${k.id}">${pct > 0 ? 'Continuar' : 'Comenzar'}</a>
      </div>
    </article>`;
  };

  C.vacio = (txt, accion) => html`<div class="card card-empty"><p style="margin:0 0 ${accion ? '14px' : '0'}">${txt}</p>${accion || ''}</div>`;

  // Opciones de <select> con la opción elegida marcada.
  C.opciones = (lista, sel) => lista.map((o) => {
    const v = Array.isArray(o) ? o[0] : o.id;
    const l = Array.isArray(o) ? o[1] : (o.l || o.nombre || o.titulo);
    return html`<option value="${v}"${GS.attr(String(v) === String(sel), 'selected')}>${l}</option>`;
  });

  // Botones de filtro tipo "pastilla".
  C.segmentos = (lista, sel, accion, extraAttrs) => html`<div class="row">${lista.map(([v, l]) =>
    html`<button type="button" class="seg" aria-pressed="${String(v === sel)}" data-action="${accion}" data-v="${v}"${GS.raw(extraAttrs || '')}>${l}</button>`)}</div>`;

  // Pestañas internas (subsecciones con enlace).
  C.subtabs = (lista, sel, base, etiqueta) => html`<nav class="subtabs" aria-label="${etiqueta}">${lista.map(([k, l, badge]) =>
    html`<a href="${base}/${k}" aria-current="${k === sel ? 'page' : 'false'}">${l}${badge ? html`<span class="badge">${badge}</span>` : ''}</a>`)}</nav>`;

  // ---------- Selector de público (edificios y cargos) ----------
  // Guarda su estado en GS.ui[path] = { edificios: 'todos' | [ids], cargos: 'todos' | [grupos] }
  C.alcanceEstado = (path, inicial) => {
    let a = GS.getPath(GS.ui, path);
    if (!a) { a = JSON.parse(JSON.stringify(inicial || { edificios: 'todos', cargos: 'todos' })); GS.setPath(GS.ui, path, a); }
    return a;
  };
  C.alcance = (path, etiqueta) => {
    const a = C.alcanceEstado(path);
    const lugares = GS.lugares();
    const edSel = a.edificios === 'todos' ? [] : a.edificios;
    const cgSel = a.cargos === 'todos' ? [] : a.cargos;
    return html`<div class="grid-2">
      <fieldset class="fieldset-box">
        <legend class="label">¿Para qué edificios?</legend>
        <label class="check check-strong"><input type="checkbox" data-action="alc-todos" data-path="${path}" data-campo="edificios"${GS.attr(a.edificios === 'todos', 'checked')}>Todos los edificios y oficina central</label>
        ${a.edificios !== 'todos' ? html`<div class="two-col">${lugares.map((u) => html`<label class="check"><input type="checkbox" data-action="alc-item" data-path="${path}" data-campo="edificios" data-v="${u.id}"${GS.attr(edSel.includes(u.id), 'checked')}>${u.nombre}</label>`)}</div>` : ''}
      </fieldset>
      <fieldset class="fieldset-box">
        <legend class="label">¿Para qué cargos?</legend>
        <label class="check check-strong"><input type="checkbox" data-action="alc-todos" data-path="${path}" data-campo="cargos"${GS.attr(a.cargos === 'todos', 'checked')}>Todos los cargos</label>
        ${a.cargos !== 'todos' ? html`<div class="stack-sm" style="gap:0">${GS.GRUPOS_CARGO.map((g) => html`<label class="check"><input type="checkbox" data-action="alc-item" data-path="${path}" data-campo="cargos" data-v="${g}"${GS.attr(cgSel.includes(g), 'checked')}>${g}</label>`)}</div>` : ''}
      </fieldset>
    </div>
    <div class="notice">${etiqueta || 'Lo verán en el explorador'}: <strong>${GS.alcanceTexto(a)}</strong></div>`;
  };
  C.alcanceCompleto = (a) => (a.edificios === 'todos' || a.edificios.length) && (a.cargos === 'todos' || a.cargos.length);
  GS.accion('alc-todos', (el) => {
    const a = GS.getPath(GS.ui, el.dataset.path);
    a[el.dataset.campo] = el.checked ? 'todos' : [];
  });
  GS.accion('alc-item', (el) => {
    const a = GS.getPath(GS.ui, el.dataset.path);
    const lista = a[el.dataset.campo] === 'todos' ? [] : a[el.dataset.campo].slice();
    const i = lista.indexOf(el.dataset.v);
    if (el.checked && i < 0) lista.push(el.dataset.v);
    if (!el.checked && i >= 0) lista.splice(i, 1);
    a[el.dataset.campo] = lista;
  });

  // ---------- Avance por persona (fila expandible) ----------
  // Usado en "Mi equipo", "Seguimiento" y "Reportes". clave distingue el estado abierto/cerrado por pantalla.
  C.tablaAvance = (resumenes, clave) => {
    GS.ui.abiertos = GS.ui.abiertos || {};
    if (!resumenes.length) return C.vacio('No hay personas con cursos en esta vista.');
    return html`<div class="card table-wrap"><div class="rep">
      <div class="rep-head"><span>Persona</span><span>Unidad y cargo</span><span>Cursos</span><span>Avance general</span><span>Vencidos</span><span></span></div>
      ${resumenes.map((r) => {
        const id = clave + ':' + r.persona.id;
        const ab = !!GS.ui.abiertos[id];
        return html`<div class="rep-item${ab ? ' open' : ''}">
          <button type="button" class="rep-row" data-action="toggle-fila" data-id="${id}" aria-expanded="${String(ab)}">
            <span class="strong">${r.persona.nombre}</span>
            <span class="stack-sm" style="gap:0"><span>${GS.unidadDe(r.persona)}</span><span class="muted xs">${GS.cargoDe(r.persona)}</span></span>
            <span>${r.total}</span>
            ${C.barra(r.avg, 'bar-md')}
            <span><span class="chip ${r.vencidos ? 'c-late' : 'c-suave'}">${r.vencidos}</span></span>
            <span class="rep-arrow" aria-hidden="true">${ab ? '−' : '+'}</span>
          </button>
          ${ab ? html`<div class="rep-detail"><div class="rep-sub">
            <div class="rep-sub-head"><span>Curso</span><span>Origen</span><span>Plazo</span><span>Avance</span><span>Estado</span></div>
            ${r.cursos.length ? r.cursos.map((c) => html`<div class="rep-sub-row">
              <span class="strong" style="font-family:var(--serif)">${c.curso.titulo}</span>
              <span class="muted">${c.ins.origen === 'asignado' ? 'Asignado' : 'Inscrito'}</span>
              <span class="muted">${GS.plazoTxt(c.ins, true)}</span>
              ${C.barra(c.pct)}
              <span>${C.chipEstado(c.k)}</span>
            </div>`) : html`<div class="rep-sub-row"><span class="muted">Sin cursos todavía.</span></div>`}
          </div></div>` : ''}
        </div>`;
      })}
    </div></div>`;
  };
  GS.accion('toggle-fila', (el) => { GS.ui.abiertos[el.dataset.id] = !GS.ui.abiertos[el.dataset.id]; });

  // Ordena resúmenes: menor avance primero.
  // Filas para exportar a Excel el avance por persona y curso. equipo: agrega la columna "Equipo".
  C.filasAvance = (resumenes, equipo) => {
    const cab = ['Persona', 'RUT', 'Unidad', 'Cargo', 'Curso', 'Origen', 'Plazo', 'Avance %', 'Estado', 'Terminado el'];
    const filas = [equipo ? ['Equipo'].concat(cab) : cab];
    resumenes.forEach((r) => {
      const base = [r.persona.nombre, r.persona.rut, GS.unidadDe(r.persona), GS.cargoDe(r.persona)];
      const cursos = r.cursos.length ? r.cursos.map((c) => base.concat([c.curso.titulo, c.ins.origen === 'asignado' ? 'Asignado' : 'Inscrito', c.ins.plazo || '', c.pct, GS.SEM[c.k].l, c.ins.completadoEn || '']))
        : [base.concat(['Sin cursos', '', '', '', '', ''])];
      cursos.forEach((f) => filas.push(equipo ? [r.equipo].concat(f) : f));
    });
    return filas;
  };
  C.ordenarResumenes = (lista, orden) => {
    const r = lista.slice();
    if (orden === 'vencidos') r.sort((a, b) => b.vencidos - a.vencidos || a.avg - b.avg);
    else if (orden === 'nombre') r.sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre, 'es'));
    else r.sort((a, b) => a.avg - b.avg || a.persona.nombre.localeCompare(b.persona.nombre, 'es'));
    return r;
  };

  // ---------- Formulario de persona con rutas de capacitación ----------
  // Estado en GS.ui[path]: { nombre, rut, cargoId, unidadId, rol, jefeId, rutaCargo, quitados[], otra, otraQuitados[], plazo, sigue[] }
  C.estadoPersona = (path, inicial) => {
    let s = GS.getPath(GS.ui, path);
    if (!s) {
      s = Object.assign({ nombre: '', rut: '', cargoId: 'c-gs', unidadId: '', rol: 'trabajador', jefeId: '', rutaCargo: true, quitados: [], otra: '', otraQuitados: [], plazo: '', sigue: [] }, inicial || {});
      GS.setPath(GS.ui, path, s);
    }
    return s;
  };
  C.cursosDeRutas = (s) => {
    const rc = GS.rutaDeCargo(s.cargoId);
    const deCargo = rc && s.rutaCargo ? rc.cursos.filter((k) => !s.quitados.includes(k)) : [];
    const ro = s.otra ? GS.store.get('rutas', s.otra) : null;
    const deOtra = ro ? ro.cursos.filter((k) => !(rc && s.rutaCargo && rc.cursos.includes(k)) && !s.otraQuitados.includes(k)) : [];
    return { rc, ro, ids: deCargo.concat(deOtra), rutas: [rc && s.rutaCargo ? rc.id : null, ro ? ro.id : null].filter(Boolean) };
  };
  C.rutasPersona = (path) => {
    const s = GS.getPath(GS.ui, path);
    const rc = GS.rutaDeCargo(s.cargoId);
    const ro = s.otra ? GS.store.get('rutas', s.otra) : null;
    const lista = (ruta, quitados, excluir, campo) => {
      const ids = ruta.cursos.filter((k) => !excluir.includes(k));
      const on = ids.filter((k) => !quitados.includes(k)).length;
      return html`<div class="subbox">
        <div class="row" style="justify-content:space-between;margin-bottom:4px">
          <span class="muted xs strong">${ruta.nombre} · ${on} de ${ids.length} cursos elegidos${campo === 'otraQuitados' && excluir.length ? ' (no repite los de su cargo)' : ''}</span>
          <button type="button" class="link" data-action="ruta-todos" data-path="${path}" data-campo="${campo}" data-ids="${ids.join(',')}">${on === ids.length ? 'Quitar todos' : 'Elegir todos'}</button>
        </div>
        ${ids.map((k) => { const c = GS.curso(k); return html`<label class="check"><input type="checkbox" data-action="ruta-curso" data-path="${path}" data-campo="${campo}" data-v="${k}"${GS.attr(!quitados.includes(k), 'checked')}>${c.titulo}<span class="muted xs">· ${c.config.duracion}</span></label>`; })}
      </div>`;
    };
    const total = C.cursosDeRutas(s).ids.length;
    return html`<div class="stack full" style="border-top:1px solid var(--borde);padding-top:18px">
      <h3 class="h3">Rutas de capacitación</h3>
      ${rc ? html`<label class="check check-strong"><input type="checkbox" data-bind="${path}.rutaCargo" data-rerender${GS.attr(s.rutaCargo, 'checked')}>Asignar la ruta de su cargo: ${rc.nombre}</label>
        ${s.rutaCargo ? lista(rc, s.quitados, [], 'quitados') : ''}` : html`<p class="muted small" style="margin:0">Este cargo no tiene una ruta definida.</p>`}
      <div style="max-width:420px"><label class="label" for="${path}-otra">Agregar otra ruta (opcional)</label>
        <select id="${path}-otra" class="input" data-bind="${path}.otra" data-rerender>
          <option value="">Ninguna</option>
          ${C.opciones(GS.store.all('rutas').filter((r) => !rc || r.id !== rc.id).map((r) => [r.id, r.nombre]), s.otra)}
        </select></div>
      ${ro ? lista(ro, s.otraQuitados, rc && s.rutaCargo ? rc.cursos : [], 'otraQuitados') : ''}
      <div style="max-width:260px"><label class="label" for="${path}-plazo">Fecha límite (opcional)</label><input id="${path}-plazo" class="input" type="date" data-bind="${path}.plazo" value="${s.plazo}"></div>
      <div class="notice">Se le asignarán <strong>${GS.plural(total, 'curso', 'cursos')}</strong> y los verá en "Mis cursos" desde su primer ingreso.</div>
    </div>`;
  };
  GS.accion('ruta-curso', (el) => {
    const s = GS.getPath(GS.ui, el.dataset.path);
    const l = s[el.dataset.campo];
    const i = l.indexOf(el.dataset.v);
    if (el.checked && i >= 0) l.splice(i, 1);
    if (!el.checked && i < 0) l.push(el.dataset.v);
  });
  GS.accion('ruta-todos', (el) => {
    const s = GS.getPath(GS.ui, el.dataset.path);
    const ids = el.dataset.ids.split(',').filter(Boolean);
    const todos = ids.every((k) => !s[el.dataset.campo].includes(k));
    s[el.dataset.campo] = todos ? ids : [];
  });

  // Valida y crea una persona con sus cursos de ruta. Devuelve la persona creada.
  // ---------- Accesos (RUT y clave) ----------
  // Puede crear o restablecer el acceso: la administración, o la jefatura directa de la persona.
  // Con ingreso por RUT nadie restablece su propia clave (la cambia en "Mi perfil").
  C.puedeDarAcceso = (p, yo) => GS.auth.disponible() && p.activo && (p.id !== yo.id || !GS.auth.activo()) && (yo.rol === 'admin' || p.jefeId === yo.id);
  C.celdaAcceso = (p) => (p.cuenta
    ? html`<span class="chip c-ok">Con acceso</span>`
    : html`<span class="chip c-gris">Sin acceso</span>`);
  C.botonAcceso = (p, yo) => (C.puedeDarAcceso(p, yo)
    ? html`<button type="button" class="btn2 btn-sm" data-action="crear-acceso" data-id="${p.id}">${p.cuenta ? 'Restablecer clave' : 'Crear acceso'}</button>`
    : '');
  // Crea accesos uno por uno y guarda las claves para mostrarlas. Se detiene si Firebase pide esperar.
  C.darAccesos = async (personas, por) => {
    const nuevas = [];
    let error = null;
    for (const p of personas) {
      try { nuevas.push({ nombre: p.nombre, rut: p.rut, clave: await GS.auth.crearAcceso(p, por) }); }
      catch (e) { error = e; break; }
    }
    GS.ui.claves = (GS.ui.claves || []).concat(nuevas);
    return { creados: nuevas.length, error };
  };
  // Las claves provisorias solo se muestran aquí, una vez. No quedan guardadas en ninguna parte.
  C.panelClaves = () => {
    const claves = GS.ui.claves || [];
    if (!claves.length) return '';
    return html`<div class="card card-pad stack card-focus" role="status">
      <h2 class="h2">${claves.length === 1 ? 'Clave provisoria creada' : 'Claves provisorias creadas'}</h2>
      <div class="notice">Anótalas o descárgalas ahora: por seguridad no se vuelven a mostrar. Cada persona entra con su RUT y esta clave, y en su primer ingreso debe cambiarla por una propia.</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Persona</th><th>RUT</th><th>Clave provisoria</th></tr></thead>
        <tbody>${claves.map((c) => html`<tr><td class="strong">${c.nombre}</td><td>${c.rut}</td><td><code style="font-size:16px;letter-spacing:1px">${c.clave}</code></td></tr>`)}</tbody>
      </table></div>
      <div class="row">
        <button type="button" class="btn2" data-action="claves-descargar">Descargar en Excel</button>
        <button type="button" class="btn" data-action="claves-cerrar">Listo, ya las anoté</button>
      </div>
    </div>`;
  };
  GS.accion('crear-acceso', async (el) => {
    const p = GS.persona(el.dataset.id);
    const yo = GS.yo();
    if (!p || !C.puedeDarAcceso(p, yo)) throw new Error('No puedes cambiar el acceso de esta persona.');
    if (p.cuenta && !confirm('Se creará una clave provisoria nueva para ' + p.nombre + ' y la actual dejará de funcionar. Su avance no se pierde. ¿Seguir?')) return false;
    const r = await C.darAccesos([p], yo.id);
    if (r.error) throw r.error;
  }, { escribe: true });
  GS.accion('claves-descargar', () => {
    GS.descargarCSV('claves-provisorias-' + GS.hoy() + '.csv', [['Nombre', 'RUT', 'Clave provisoria']].concat((GS.ui.claves || []).map((c) => [c.nombre, c.rut, c.clave])));
    return false;
  });
  GS.accion('claves-cerrar', () => {
    if ((GS.ui.claves || []).length && !confirm('Después de cerrar no podrás volver a ver estas claves. ¿Ya las anotaste o descargaste?')) return false;
    delete GS.ui.claves;
  });

  C.crearPersona = async (s, por) => {
    const nombre = String(s.nombre || '').trim();
    if (nombre.length < 3) throw new Error('Escribe el nombre completo.');
    if (!GS.rutValido(s.rut)) throw new Error('El RUT no es válido. Revisa el dígito verificador.');
    const rut = GS.formatearRut(s.rut);
    if (GS.store.all('personas').some((p) => GS.limpiarRut(p.rut) === GS.limpiarRut(rut))) throw new Error('Ya existe una persona con ese RUT.');
    if (!s.unidadId) throw new Error('Elige la unidad.');
    const rutas = C.cursosDeRutas(s);
    const p = await GS.store.add('personas', {
      nombre, rut, rol: s.rol || 'trabajador', unidadId: s.unidadId, cargoId: s.cargoId, jefeId: s.jefeId || null,
      activo: true, rutas: rutas.rutas, sigue: s.rol === 'visualizador' ? (s.sigue || []) : [], creadoEn: GS.ahora()
    });
    if (rutas.ids.length) await GS.ops.asignar({ personaIds: [p.id], cursoIds: rutas.ids, plazo: s.plazo || null, por });
    return p;
  };
})(window.GS);
