// Administración: bandeja, cursos, rutas, personas, estructura y reportes.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;

  // ---------- Bandeja: todo lo que espera respuesta de RRHH ----------
  function itemsBandeja() {
    const items = [];
    S().where('cursos', (k) => k.estado === 'revision').forEach((k) => items.push({
      id: 'curso:' + k.id, tipo: 'Curso en revisión', chip: 'c-sky', t: k.titulo, de: GS.nombreDe(k.autorId) + ' · ' + GS.unidadDe(GS.persona(k.autorId)),
      fecha: k.actualizadoEn.slice(0, 10), acciones: [['aprobar-curso', 'Aprobar y publicar', false], ['devolver-curso', 'Devolver con comentario', true]],
      extra: html`<span class="muted small">${GS.plural(k.modulos.length, 'módulo', 'módulos')} · para ${GS.alcanceTexto(k.alcance)}</span><a class="xs strong" href="#/curso/${k.id}">Ver el curso</a>`, ref: k.id
    }));
    S().where('solicitudes', (s) => s.estado === 'pendiente').forEach((s) => {
      const d = s.datos;
      const p = GS.persona(s.personaId);
      if (s.tipo === 'ayuda') {
        items.push({
          id: 'sol:' + s.id, tipo: 'Solicitud de ayuda', chip: 'c-none', t: d.tema, de: GS.nombreDe(s.personaId) + ' · ' + GS.unidadDe(p), fecha: s.fecha,
          acciones: [['tomar-sol', 'Tomar solicitud', false], ['info-sol', 'Pedir más información', true]], ref: s.id,
          extra: html`<span class="small">${d.objetivo}</span><span class="muted small">Para ${GS.alcanceTexto(d.alcance)}${d.paraCuando ? ' · la necesita para el ' + GS.fecha(d.paraCuando) : ''}</span>${GS.urlSegura(d.material) ? html`<a class="xs strong" href="${GS.urlSegura(d.material)}" target="_blank" rel="noopener">Ver material</a>` : ''}`
        });
      } else {
        items.push({
          id: 'sol:' + s.id, tipo: 'Propuesta presencial', chip: 'c-gris', t: d.tema, de: GS.nombreDe(s.personaId) + ' · ' + GS.unidadDe(p) + ' · ' + (d.para === 'equipo' ? 'para su equipo' : 'para ' + GS.alcanceTexto(d.alcance)), fecha: s.fecha,
          acciones: [['aprobar-pres', 'Aprobar y agregar al catálogo', false], ['devolver-sol', 'Devolver con comentario', true]], ref: s.id,
          extra: html`<span class="small">${d.porque}</span>${d.relator || d.fechaTentativa || d.costo ? html`<span class="muted small">${[d.relator && 'Relator: ' + d.relator, d.fechaTentativa && 'Fecha tentativa: ' + d.fechaTentativa, d.costo && 'Costo: ' + d.costo].filter(Boolean).join(' · ')}</span>` : ''}`
        });
      }
    });
    S().where('propuestas', (x) => x.estado === 'revision').forEach((x) => items.push({
      id: 'prop:' + x.id, tipo: 'Propuesta de curso', chip: 'c-suave', t: x.tema, de: GS.nombreDe(x.personaId) + ' · ' + GS.cargoDe(GS.persona(x.personaId)), fecha: x.fecha,
      acciones: [['aceptar-prop', 'Aceptar', true], ['rechazar-prop', 'No aprobar', true]], ref: x.id,
      extra: html`<span class="small">${x.porque}</span><span class="muted small">${x.para}${x.quien ? ' · Podría enseñarlo: ' + x.quien : ''}</span>`
    }));
    return items.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  GS.bandejaPendientes = () => itemsBandeja().length;

  function vistaBandeja() {
    const items = itemsBandeja();
    const resp = GS.ui.resp;
    return html`<div class="stack">
      <p class="strong" style="margin:0;font-size:16px">${items.length ? GS.plural(items.length, 'pendiente', 'pendientes') + ' de tu respuesta' : 'No tienes nada pendiente.'}</p>
      ${items.map((b) => html`<div class="card inbox-item">
        <div class="inbox-main">
          <span class="chip ${b.chip}">${b.tipo}</span>
          <b>${b.t}</b>
          <span class="muted small">${b.de} · Recibido el ${GS.fecha(b.fecha)}</span>
          ${b.extra || ''}
          ${resp && resp.item === b.id ? html`<form class="stack-sm" data-submit="responder" style="margin-top:8px">
            <label class="label" for="resp-txt">${resp.etiqueta}</label>
            <textarea id="resp-txt" name="nota" class="input" rows="2" maxlength="500"${GS.attr(resp.obligatorio, 'required')}></textarea>
            <div class="row"><button class="btn btn-sm" type="submit">${resp.boton}</button><button type="button" class="btn2 btn-sm" data-action="resp-cancelar">Cancelar</button></div>
          </form>` : ''}
        </div>
        ${!(resp && resp.item === b.id) ? html`<div class="row">${b.acciones.map(([a, l, comenta], i) =>
          html`<button type="button" class="${i === 0 ? 'btn' : 'btn2'}" data-action="${comenta ? 'resp-abrir' : a}" data-accion="${a}" data-item="${b.id}" data-ref="${b.ref}">${l}</button>`)}</div>` : ''}
      </div>`)}
    </div>`;
  }
  const RESP = {
    'devolver-curso': ['Comentario para quien creó el curso', 'Devolver', true],
    'info-sol': ['¿Qué información necesitas?', 'Enviar pregunta', true],
    'devolver-sol': ['Comentario para quien la propuso', 'Devolver', true],
    'aceptar-prop': ['Mensaje para la persona (opcional)', 'Aceptar propuesta', false],
    'rechazar-prop': ['¿Por qué no se aprueba?', 'No aprobar', true]
  };
  GS.accion('resp-abrir', (el) => { const r = RESP[el.dataset.accion]; GS.ui.resp = { item: el.dataset.item, accion: el.dataset.accion, ref: el.dataset.ref, etiqueta: r[0], boton: r[1], obligatorio: r[2] }; });
  GS.accion('resp-cancelar', () => { GS.ui.resp = null; });
  GS.accion('responder', async (form, ev, fd) => {
    const r = GS.ui.resp;
    const nota = String(fd.get('nota') || '').trim();
    if (r.obligatorio && !nota) throw new Error('Escribe un comentario.');
    const id = r.ref;
    if (r.accion === 'devolver-curso') await S().update('cursos', id, { estado: 'devuelto', nota, actualizadoEn: GS.ahora() });
    if (r.accion === 'info-sol') await S().update('solicitudes', id, { estado: 'info', nota });
    if (r.accion === 'devolver-sol') await S().update('solicitudes', id, { estado: 'devuelta', nota });
    if (r.accion === 'aceptar-prop') await S().update('propuestas', id, { estado: 'aceptada', nota: nota || 'Aceptada. RRHH la está preparando.' });
    if (r.accion === 'rechazar-prop') await S().update('propuestas', id, { estado: 'rechazada', nota });
    GS.ui.resp = null;
    GS.toast('Respuesta enviada.');
  }, { escribe: true });
  GS.accion('aprobar-curso', async (el) => {
    const k = GS.curso(el.dataset.ref);
    await S().update('cursos', k.id, { estado: 'publicado', nota: '', publicadoEn: GS.ahora(), actualizadoEn: GS.ahora() });
    GS.toast('"' + k.titulo + '" quedó publicado.');
  }, { escribe: true });
  GS.accion('tomar-sol', async (el) => { await S().update('solicitudes', el.dataset.ref, { estado: 'preparacion', nota: 'RRHH tomó la solicitud y te contactará.' }); GS.toast('Solicitud tomada.'); }, { escribe: true });
  GS.accion('aprobar-pres', async (el) => {
    const s = S().get('solicitudes', el.dataset.ref);
    const d = s.datos;
    await S().add('presencialCatalogo', { titulo: d.tema, relator: d.relator || 'Por definir', duracion: 'Por definir', para: d.para === 'equipo' ? GS.unidadDe(GS.persona(s.personaId)) : GS.capitalizar(GS.alcanceTexto(d.alcance)) });
    await S().update('solicitudes', s.id, { estado: 'aprobada', nota: 'Agregada al catálogo de capacitaciones presenciales.' });
    GS.toast('Agregada al catálogo presencial.');
  }, { escribe: true });

  // ---------- Cursos ----------
  function vistaCursos() {
    const st = GS.ui.aCursos = GS.ui.aCursos || { q: '', estado: 'todos' };
    const q = GS.normalizar(st.q);
    const lista = S().all('cursos')
      .filter((k) => st.estado === 'todos' || k.estado === st.estado)
      .filter((k) => !q || GS.normalizar(k.titulo + ' ' + GS.nombreDe(k.autorId)).includes(q))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    const filtros = [['todos', 'Todos']].concat(Object.keys(GS.ESTADOS_CURSO).map((e) => [e, GS.ESTADOS_CURSO[e].l]));
    return html`<div class="stack" style="gap:16px">
      <div class="row">
        <div class="searchbar"><label class="sr-only" for="ac-q">Buscar curso</label><input id="ac-q" class="input" type="search" placeholder="Buscar curso o autor" value="${st.q}" data-bind="aCursos.q" data-input="refrescar"></div>
        <button type="button" class="btn" data-action="nuevo-curso">Crear curso</button>
      </div>
      ${C.segmentos(filtros, st.estado, 'ac-estado')}
      <p class="muted small" style="margin:0">Los cursos que creas tú se publican directo, sin revisión. Para cambiar un curso publicado, usa "Editar" y publica la nueva versión.</p>
      ${lista.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>Curso</th><th>Creado por</th><th>Edificios</th><th>Cargos</th><th>Estado</th><th>Inscritos</th><th>Valoración</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${lista.map((k) => {
          const v = GS.valoracion(k.id);
          const n = GS.inscritos(k.id);
          return html`<tr>
            <td class="strong">${k.titulo || 'Sin título'}${k.borradorEdicion ? html`<div class="muted xs">Tiene cambios sin publicar</div>` : ''}</td>
            <td>${GS.nombreDe(k.autorId)}</td><td>${GS.alcanceEdificiosCorto(k.alcance)}</td><td>${GS.alcanceCargosCorto(k.alcance)}</td>
            <td>${C.chipCurso(k.estado)}</td>
            <td>${n ? GS.plural(n, 'persona', 'personas') : '—'}</td>
            <td style="white-space:nowrap">${v ? v.prom + ' / 5 · ' + GS.plural(v.n, 'respuesta', 'respuestas') : 'Sin respuestas aún'}</td>
            <td class="actions">
              <a class="btn2 btn-sm" href="#/curso/${k.id}">Ver</a>
              ${k.estado !== 'archivado' ? html`<a class="btn2 btn-sm" href="#/editor/${k.id}">Editar</a>` : ''}
              ${k.estado === 'publicado' ? html`<button type="button" class="btn2 btn-sm" data-action="archivar" data-id="${k.id}">Archivar</button>` : ''}
              ${k.estado === 'archivado' ? html`<button type="button" class="btn2 btn-sm" data-action="reactivar-curso" data-id="${k.id}">Reactivar</button>` : ''}
              ${['borrador'].includes(k.estado) && !n ? html`<button type="button" class="btn2 btn-sm btn-danger" data-action="eliminar-curso" data-id="${k.id}">Eliminar</button>` : ''}
            </td></tr>`;
        })}</tbody></table></div>` : C.vacio('No hay cursos con ese filtro.')}
    </div>`;
  }
  GS.accion('ac-estado', (el) => { GS.ui.aCursos.estado = el.dataset.v; });
  GS.accion('archivar', async (el) => {
    const k = GS.curso(el.dataset.id);
    if (!confirm('¿Archivar "' + k.titulo + '"? Deja de aparecer en el explorador. Quienes lo terminaron conservan su certificado.')) return false;
    await S().update('cursos', k.id, { estado: 'archivado', actualizadoEn: GS.ahora() });
  }, { escribe: true });
  GS.accion('reactivar-curso', async (el) => { await S().update('cursos', el.dataset.id, { estado: 'publicado', actualizadoEn: GS.ahora() }); }, { escribe: true });
  GS.accion('eliminar-curso', async (el) => {
    const k = GS.curso(el.dataset.id);
    if (!confirm('¿Eliminar el borrador "' + (k.titulo || 'Sin título') + '"? No se puede deshacer.')) return false;
    await S().remove('cursos', k.id);
  }, { escribe: true });

  // ---------- Rutas ----------
  function vistaRutas() {
    const rutas = S().all('rutas');
    const st = GS.ui.aRutas = GS.ui.aRutas || { sel: rutas[0] ? rutas[0].id : null };
    const r = S().get('rutas', st.sel) || rutas[0];
    const personasCon = (id) => GS.personasActivas().filter((p) => (p.rutas || []).includes(id)).length;
    let detalle = C.vacio('Crea una ruta para empezar.');
    if (r) {
      const disponibles = GS.cursosPublicados().filter((k) => !r.cursos.includes(k.id)).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      const cargosLibres = S().all('cargos').filter((c) => !S().all('rutas').some((x) => x.cargoId === c.id && x.id !== r.id));
      const n = personasCon(r.id);
      detalle = html`<div class="card card-pad stack grow" style="gap:14px">
        <form class="grid-form" data-submit="guardar-ruta">
          <div><label class="label" for="rt-n">Nombre de la ruta</label><input id="rt-n" name="nombre" class="input" value="${r.nombre}" required maxlength="80"></div>
          <div><label class="label" for="rt-c">Tipo</label><select id="rt-c" name="cargoId" class="input">
            <option value="">Ruta complementaria</option>
            ${C.opciones(cargosLibres.map((c) => [c.id, 'Ruta de cargo: ' + c.nombre]), r.cargoId || '')}</select></div>
          <div class="row"><button class="btn2" type="submit">Guardar nombre y tipo</button></div>
        </form>
        <span class="label" style="margin:0">Cursos de la ruta, en el orden sugerido</span>
        ${r.cursos.length ? r.cursos.map((kid, i) => { const k = GS.curso(kid); return html`<div class="route-course">
          <span class="n">${i + 1}</span><span style="flex:1;font-size:15px">${k ? k.titulo : 'Curso eliminado'}${k && k.estado !== 'publicado' ? html` <span class="chip ${GS.ESTADOS_CURSO[k.estado].c}">${GS.ESTADOS_CURSO[k.estado].l}</span>` : ''}</span>
          <span class="muted xs">${k ? k.config.duracion : ''}</span>
          <button type="button" class="icon-btn" aria-label="Subir" data-action="ruta-mover" data-i="${i}" data-d="-1"${GS.attr(i === 0, 'disabled')}>↑</button>
          <button type="button" class="icon-btn" aria-label="Bajar" data-action="ruta-mover" data-i="${i}" data-d="1"${GS.attr(i === r.cursos.length - 1, 'disabled')}>↓</button>
          <button type="button" class="btn2 btn-xs" data-action="ruta-quitar" data-i="${i}">Quitar</button></div>`; }) : html`<p class="muted" style="margin:0">Esta ruta todavía no tiene cursos.</p>`}
        ${disponibles.length ? html`<form class="row" data-submit="ruta-agregar" style="align-items:flex-end">
          <div style="flex:1 1 260px"><label class="label" for="rt-add">Agregar curso</label><select id="rt-add" name="cursoId" class="input">${C.opciones(disponibles.map((k) => [k.id, k.titulo]), '')}</select></div>
          <button class="btn2" type="submit">Agregar</button></form>` : ''}
        <div class="notice">${r.cargoId ? 'Esta ruta se ofrece automáticamente al crear a alguien con el cargo ' + GS.cargo(r.cargoId).nombre + ' o al cambiarlo a ese cargo. ' : 'Esta ruta se ofrece como opción adicional al crear o editar a una persona. '}${n ? 'Hoy la tienen ' + GS.plural(n, 'persona', 'personas') + '; si agregas un curso, te preguntaremos si también se lo asignamos.' : 'Todavía nadie la tiene.'}</div>
        <div><button type="button" class="btn2 btn-sm btn-danger" data-action="ruta-eliminar">Eliminar ruta</button></div>
      </div>`;
    }
    return html`<div class="stack" style="gap:16px">
      <p class="muted" style="margin:0;font-size:15px">Las rutas de cargo se ofrecen automáticamente al crear a alguien con ese cargo o al cambiarlo de cargo. Las complementarias se agregan a mano.</p>
      <div class="split">
        <div class="side stack-sm" style="gap:10px">
          <button type="button" class="btn self-start" data-action="ruta-nueva">Nueva ruta</button>
          ${rutas.map((x) => html`<button type="button" class="route-btn" aria-pressed="${String(r && x.id === r.id)}" data-action="ruta-sel" data-id="${x.id}">
            <span class="chip ${x.cargoId ? 'c-sky' : 'c-none'}">${x.cargoId ? 'Ruta de cargo' : 'Ruta complementaria'}</span>
            <b>${x.nombre}</b><span class="muted xs">${GS.plural(x.cursos.length, 'curso', 'cursos')} · ${GS.plural(personasCon(x.id), 'persona la tiene', 'personas la tienen')}</span></button>`)}
        </div>
        ${detalle}
      </div>
    </div>`;
  }
  const rutaSel = () => S().get('rutas', GS.ui.aRutas.sel) || S().all('rutas')[0];
  GS.accion('ruta-sel', (el) => { GS.ui.aRutas.sel = el.dataset.id; });
  GS.accion('ruta-nueva', async () => { const r = await S().add('rutas', { nombre: 'Nueva ruta', cargoId: null, cursos: [] }); GS.ui.aRutas.sel = r.id; }, { escribe: true });
  GS.accion('guardar-ruta', async (form, ev, fd) => {
    const nombre = String(fd.get('nombre') || '').trim();
    if (!nombre) throw new Error('Escribe el nombre de la ruta.');
    await S().update('rutas', rutaSel().id, { nombre, cargoId: fd.get('cargoId') || null });
    GS.toast('Ruta guardada.');
  }, { escribe: true });
  GS.accion('ruta-mover', async (el) => {
    const r = rutaSel(); const a = r.cursos.slice(); const i = Number(el.dataset.i), t = i + Number(el.dataset.d);
    [a[i], a[t]] = [a[t], a[i]];
    await S().update('rutas', r.id, { cursos: a });
  }, { escribe: true });
  GS.accion('ruta-quitar', async (el) => {
    const r = rutaSel(); const a = r.cursos.slice(); a.splice(Number(el.dataset.i), 1);
    await S().update('rutas', r.id, { cursos: a });
    GS.toast('Curso quitado de la ruta. Quienes ya lo tenían asignado lo conservan.');
  }, { escribe: true });
  GS.accion('ruta-agregar', async (form, ev, fd) => {
    const r = rutaSel(); const kid = fd.get('cursoId');
    await S().update('rutas', r.id, { cursos: r.cursos.concat([kid]) });
    const conRuta = GS.personasActivas().filter((p) => (p.rutas || []).includes(r.id));
    if (conRuta.length && confirm('¿Asignar también "' + GS.curso(kid).titulo + '" a las ' + conRuta.length + ' personas que ya tienen esta ruta?')) {
      const res = await GS.ops.asignar({ personaIds: conRuta.map((p) => p.id), cursoIds: [kid], plazo: null, por: GS.yo().id });
      GS.toast('Curso agregado y asignado a ' + GS.plural(res.nuevos + res.actualizados, 'persona', 'personas') + '.');
    } else GS.toast('Curso agregado a la ruta.');
  }, { escribe: true });
  GS.accion('ruta-eliminar', async () => {
    const r = rutaSel();
    if (!confirm('¿Eliminar "' + r.nombre + '"? Las personas conservan los cursos que ya tienen asignados.')) return false;
    for (const p of S().where('personas', (x) => (x.rutas || []).includes(r.id))) await S().update('personas', p.id, { rutas: p.rutas.filter((x) => x !== r.id) });
    await S().remove('rutas', r.id);
    GS.ui.aRutas.sel = null;
  }, { escribe: true });

  // ---------- Personas ----------
  const opcionesUnidades = () => S().all('unidades').slice().sort((a, b) => (a.tipo === b.tipo ? a.nombre.localeCompare(b.nombre, 'es') : a.tipo === 'gerencia' ? -1 : 1)).map((u) => [u.id, u.nombre]);
  const opcionesJefes = (excluir) => GS.personasActivas().filter((p) => p.id !== excluir && p.rol !== 'trabajador').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((p) => [p.id, p.nombre + ' · ' + GS.cargoDe(p)]);
  const opcionesRoles = () => Object.keys(GS.ROLES).map((r) => [r, GS.ROLES[r]]);
  const edificiosOpciones = () => S().where('unidades', (u) => u.tipo === 'edificio');

  function formPersona(path, titulo, submit, boton, esNueva, persona) {
    const s = GS.getPath(GS.ui, path);
    const sigueBox = s.rol === 'visualizador' ? html`<fieldset class="fieldset-box full"><legend class="label">Unidades que puede seguir</legend>
      <div class="two-col">${S().all('unidades').map((u) => html`<label class="check"><input type="checkbox" data-action="sigue" data-path="${path}" data-v="${u.id}"${GS.attr((s.sigue || []).includes(u.id), 'checked')}>${u.nombre}</label>`)}</div></fieldset>` : '';
    let cambioCargo = '';
    if (!esNueva && persona) {
      const cambiaUnidad = s.unidadId !== persona.unidadId;
      const cambiaCargo = s.cargoId !== persona.cargoId;
      const rn = GS.rutaDeCargo(s.cargoId);
      if (cambiaUnidad) cambioCargo = html`<div class="notice full">Cambio de unidad: conserva todos sus cursos, avances y certificados. Su nueva jefatura podrá ver su avance.</div>`;
      if (cambiaCargo) {
        const actuales = GS.insDe(persona.id);
        cambioCargo = html`${cambioCargo}<div class="subbox full" style="gap:8px">
          <strong class="strong">Cambio de cargo: conserva sus ${actuales.length} cursos${rn ? ' y se le asigna la ' + rn.nombre : ''}</strong>
          ${rn ? rn.cursos.map((kid) => {
            const k = GS.curso(kid); const i = GS.ins(persona.id, kid);
            const [txt, cls] = i ? (i.completadoEn ? ['Ya lo hizo · no se repite', 'c-done'] : ['Ya lo tiene · sigue su avance', 'c-sky']) : ['Se le asigna', 'c-ok'];
            return html`<div class="row" style="justify-content:space-between;padding:6px 0;border-top:1px solid var(--borde-suave)"><span>${k ? k.titulo : kid}</span><span class="chip ${cls}">${txt}</span></div>`;
          }) : html`<span class="muted small">El cargo nuevo no tiene ruta definida.</span>`}
          ${rn ? html`<div style="max-width:260px;margin-top:6px"><label class="label" for="${path}-plazo">Fecha límite para los nuevos (opcional)</label><input id="${path}-plazo" class="input" type="date" data-bind="${path}.plazo" value="${s.plazo || ''}"></div>` : ''}
        </div>`;
      }
      if (!cambiaUnidad && !cambiaCargo) cambioCargo = html`<p class="muted small full" style="margin:0">Si cambias la unidad o el cargo verás aquí qué pasa con sus cursos.</p>`;
    }
    return html`<form class="card card-pad grid-form card-focus" data-submit="${submit}">
      <h2 class="h2 full">${titulo}</h2>
      ${esNueva ? html`<div><label class="label" for="${path}-n">Nombre completo</label><input id="${path}-n" class="input" data-bind="${path}.nombre" value="${s.nombre}" required maxlength="100"></div>
        <div><label class="label" for="${path}-rut">RUT</label><input id="${path}-rut" class="input" placeholder="12.345.678-9" data-bind="${path}.rut" value="${s.rut}" required maxlength="12"></div>` : ''}
      <div><label class="label" for="${path}-u">Unidad</label><select id="${path}-u" class="input" data-bind="${path}.unidadId" data-rerender>${esNueva && !s.unidadId ? html`<option value="">Elegir…</option>` : ''}${C.opciones(opcionesUnidades(), s.unidadId)}</select></div>
      <div><label class="label" for="${path}-c">Cargo</label><select id="${path}-c" class="input" data-bind="${path}.cargoId" data-change="reset-quitados" data-path="${path}">${C.opciones(S().all('cargos').map((c) => [c.id, c.nombre]), s.cargoId)}</select></div>
      <div><label class="label" for="${path}-r">Rol en la plataforma</label><select id="${path}-r" class="input" data-bind="${path}.rol" data-rerender>${C.opciones(opcionesRoles(), s.rol)}</select></div>
      <div><label class="label" for="${path}-j">Jefatura directa</label><select id="${path}-j" class="input" data-bind="${path}.jefeId"><option value="">Sin jefatura en la plataforma</option>${C.opciones(opcionesJefes(persona && persona.id), s.jefeId)}</select></div>
      ${sigueBox}
      ${esNueva ? C.rutasPersona(path) : cambioCargo}
      <div class="row full"><button class="btn" type="submit">${boton}</button><button type="button" class="btn2" data-action="persona-cerrar">Cancelar</button></div>
    </form>`;
  }
  GS.accion('sigue', (el) => {
    const s = GS.getPath(GS.ui, el.dataset.path);
    s.sigue = s.sigue || [];
    const i = s.sigue.indexOf(el.dataset.v);
    if (el.checked && i < 0) s.sigue.push(el.dataset.v);
    if (!el.checked && i >= 0) s.sigue.splice(i, 1);
  });

  function vistaPersonas(real) {
    const st = GS.ui.aPersonas = GS.ui.aPersonas || { q: '', modo: null, editId: null, mostrarInactivos: false };
    const q = GS.normalizar(st.q);
    const lista = S().all('personas')
      .filter((p) => st.mostrarInactivos || p.activo)
      .filter((p) => !q || GS.normalizar(p.nombre + ' ' + p.rut + ' ' + GS.limpiarRut(p.rut) + ' ' + GS.unidadDe(p) + ' ' + GS.cargoDe(p)).includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    let panel = '';
    if (st.modo === 'nueva') {
      C.estadoPersona('nuevaPersona', { unidadId: '' });
      panel = formPersona('nuevaPersona', 'Nueva persona', 'crear-persona', 'Crear persona', true);
    } else if (st.modo === 'editar') {
      const p = GS.persona(st.editId);
      if (!GS.ui.editPersona || GS.ui.editPersona.id !== p.id) GS.ui.editPersona = { id: p.id, unidadId: p.unidadId, cargoId: p.cargoId, rol: p.rol, jefeId: p.jefeId || '', sigue: (p.sigue || []).slice(), plazo: '' };
      panel = formPersona('editPersona', 'Editar · ' + p.nombre, 'guardar-persona', 'Guardar cambios', false, p);
    } else if (st.modo === 'carga') {
      panel = vistaCarga();
    }
    return html`<div class="stack" style="gap:16px">
      <div class="row">
        <div class="searchbar"><label class="sr-only" for="ap-q">Buscar persona</label><input id="ap-q" class="input" type="search" placeholder="Buscar por nombre, RUT, unidad o cargo" value="${st.q}" data-bind="aPersonas.q" data-input="refrescar"></div>
        <button type="button" class="btn" data-action="persona-modo" data-v="nueva">Agregar persona</button>
        <button type="button" class="btn2" data-action="persona-modo" data-v="carga">Carga masiva desde Excel</button>
      </div>
      ${panel}
      <label class="check small"><input type="checkbox" data-bind="aPersonas.mostrarInactivos" data-rerender${GS.attr(st.mostrarInactivos, 'checked')}>Mostrar personas desactivadas</label>
      <div class="card table-wrap"><table>
        <thead><tr><th>Persona</th><th>RUT</th><th>Unidad</th><th>Cargo</th><th>Rol</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${lista.map((p) => html`<tr class="${p.activo ? '' : 'inactivo'}">
          <td class="strong">${p.nombre}${p.activo ? '' : html`<div class="muted xs">Desactivada</div>`}</td><td>${p.rut}</td>
          <td>${p.rol === 'visualizador' && (p.sigue || []).length ? 'Sigue: ' + p.sigue.map((u) => (GS.unidad(u) || { nombre: u }).nombre.replace('Edificio ', '')).join(', ') : GS.unidadDe(p)}</td>
          <td>${GS.cargoDe(p)}</td><td><span class="chip c-suave">${GS.ROLES[p.rol]}</span></td>
          <td class="actions">
            ${p.id !== real.id && p.activo ? html`<button type="button" class="btn2 btn-sm" data-action="ver-como" data-id="${p.id}">Ver como</button>` : ''}
            <button type="button" class="btn2 btn-sm" data-action="persona-editar" data-id="${p.id}">Editar</button>
            ${p.id !== real.id ? html`<button type="button" class="btn2 btn-sm" data-action="toggle-activo" data-id="${p.id}">${p.activo ? 'Desactivar' : 'Reactivar'}</button>` : ''}
          </td></tr>`)}</tbody></table></div>
      <p class="muted small" style="margin:0">En "Editar" se cambia rol, unidad, cargo y jefatura. Para visualizadores se eligen las unidades que puede seguir. "Nueva contraseña" se agrega cuando activemos el ingreso con RUT.</p>
    </div>`;
  }
  GS.accion('persona-modo', (el) => { const st = GS.ui.aPersonas; st.modo = st.modo === el.dataset.v ? null : el.dataset.v; delete GS.ui.nuevaPersona; delete GS.ui.carga; });
  GS.accion('persona-editar', (el) => { const st = GS.ui.aPersonas; st.modo = 'editar'; st.editId = el.dataset.id; delete GS.ui.editPersona; });
  GS.accion('persona-cerrar', () => { GS.ui.aPersonas.modo = null; delete GS.ui.nuevaPersona; delete GS.ui.editPersona; });
  GS.accion('ver-como', (el) => { GS.sesion.verComo(el.dataset.id); GS.ir('#/cursos'); return false; });
  GS.accion('crear-persona', async () => {
    const p = await C.crearPersona(GS.ui.nuevaPersona, GS.yo().id);
    GS.toast(p.nombre + ' quedó creada.');
    delete GS.ui.nuevaPersona;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });
  GS.accion('guardar-persona', async () => {
    const s = GS.ui.editPersona;
    const p = GS.persona(s.id);
    if (s.jefeId === p.id) throw new Error('Una persona no puede ser su propia jefatura.');
    const cambios = { unidadId: s.unidadId, cargoId: s.cargoId, rol: s.rol, jefeId: s.jefeId || null, sigue: s.rol === 'visualizador' ? s.sigue : [] };
    let msg = 'Cambios guardados.';
    if (s.cargoId !== p.cargoId) {
      const vieja = GS.rutaDeCargo(p.cargoId);
      const nueva = GS.rutaDeCargo(s.cargoId);
      cambios.rutas = (p.rutas || []).filter((r) => !vieja || r !== vieja.id).concat(nueva ? [nueva.id] : []);
      if (nueva) {
        const faltan = nueva.cursos.filter((kid) => !GS.ins(p.id, kid));
        if (faltan.length) { await GS.ops.asignar({ personaIds: [p.id], cursoIds: faltan, plazo: s.plazo || null, por: GS.yo().id }); msg = 'Cambios guardados. Se le asignaron ' + GS.plural(faltan.length, 'curso nuevo', 'cursos nuevos') + '.'; }
      }
    }
    await S().update('personas', p.id, cambios);
    GS.toast(msg);
    delete GS.ui.editPersona;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });

  // Carga masiva: se pega una tabla copiada desde Excel.
  function vistaCarga() {
    const st = GS.ui.carga = GS.ui.carga || { texto: '', filas: null };
    return html`<div class="card card-pad stack card-focus">
      <h2 class="h2">Carga masiva desde Excel</h2>
      <p style="margin:0">En Excel, arma columnas en este orden: <strong>Nombre</strong>, <strong>RUT</strong>, <strong>Unidad</strong>, <strong>Cargo</strong>, <strong>Rol</strong> (opcional, por defecto Trabajador) y <strong>RUT de su jefatura</strong> (opcional). Selecciona las filas, cópialas y pégalas aquí. A cada persona se le asigna la ruta de su cargo.</p>
      <div><label class="label" for="carga-t">Filas copiadas desde Excel</label><textarea id="carga-t" class="input" rows="6" placeholder="Camila Rojas	12.345.678-5	Edificio Nativo	Guest Service" data-bind="carga.texto">${st.texto}</textarea></div>
      <div class="row"><button type="button" class="btn2" data-action="carga-revisar">Revisar filas</button></div>
      ${st.filas ? html`<div class="table-wrap"><table>
        <thead><tr><th>Fila</th><th>Nombre</th><th>RUT</th><th>Unidad</th><th>Cargo</th><th>Rol</th><th>Resultado</th></tr></thead>
        <tbody>${st.filas.map((f, i) => html`<tr><td>${i + 1}</td><td>${f.nombre}</td><td>${f.rut}</td><td>${f.unidad ? f.unidad.nombre : f.unidadTxt}</td><td>${f.cargo ? f.cargo.nombre : f.cargoTxt}</td><td>${GS.ROLES[f.rol] || f.rol}</td>
          <td>${f.error ? html`<span class="chip c-late">${f.error}</span>` : html`<span class="chip c-ok">Lista</span>`}</td></tr>`)}</tbody></table></div>
        <button type="button" class="btn self-start" data-action="carga-crear"${GS.attr(!st.filas.some((f) => !f.error), 'disabled')}>Crear ${GS.plural(st.filas.filter((f) => !f.error).length, 'persona', 'personas')}</button>` : ''}
    </div>`;
  }
  GS.accion('carga-revisar', () => {
    const st = GS.ui.carga;
    const rolDe = (t) => { const n = GS.normalizar(t); if (!n) return 'trabajador'; return Object.keys(GS.ROLES).find((r) => GS.normalizar(GS.ROLES[r]).startsWith(n.slice(0, 5)) || r === n) || ''; };
    const vistos = new Set();
    st.filas = String(st.texto).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const c = l.split(/\t|;/).map((x) => x.trim());
      const f = { nombre: c[0] || '', rut: c[1] || '', unidadTxt: c[2] || '', cargoTxt: c[3] || '', rol: rolDe(c[4] || ''), jefeRut: c[5] || '' };
      f.unidad = S().all('unidades').find((u) => GS.normalizar(u.nombre) === GS.normalizar(f.unidadTxt) || GS.normalizar(u.nombre) === 'edificio ' + GS.normalizar(f.unidadTxt));
      f.cargo = S().all('cargos').find((x) => GS.normalizar(x.nombre) === GS.normalizar(f.cargoTxt));
      const jefe = f.jefeRut ? S().all('personas').find((p) => GS.limpiarRut(p.rut) === GS.limpiarRut(f.jefeRut)) : null;
      f.jefeId = jefe ? jefe.id : (f.unidad && f.unidad.jefeId) || null;
      const limpio = GS.limpiarRut(f.rut);
      if (f.nombre.length < 3) f.error = 'Falta el nombre';
      else if (!GS.rutValido(f.rut)) f.error = 'RUT no válido';
      else if (vistos.has(limpio) || S().all('personas').some((p) => GS.limpiarRut(p.rut) === limpio)) f.error = 'RUT repetido';
      else if (!f.unidad) f.error = 'Unidad no encontrada';
      else if (!f.cargo) f.error = 'Cargo no encontrado';
      else if (!f.rol) f.error = 'Rol no reconocido';
      else if (f.jefeRut && !jefe) f.error = 'Jefatura no encontrada';
      vistos.add(limpio);
      return f;
    });
    if (!st.filas.length) throw new Error('Pega al menos una fila.');
  });
  GS.accion('carga-crear', async () => {
    const st = GS.ui.carga;
    const ok = st.filas.filter((f) => !f.error);
    for (const f of ok) {
      await C.crearPersona({ nombre: f.nombre, rut: f.rut, rol: f.rol, unidadId: f.unidad.id, cargoId: f.cargo.id, jefeId: f.jefeId, rutaCargo: true, quitados: [], otra: '', otraQuitados: [], plazo: '', sigue: [] }, GS.yo().id);
    }
    GS.toast(GS.plural(ok.length, 'persona creada', 'personas creadas') + '.');
    delete GS.ui.carga;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });

  // ---------- Estructura ----------
  function vistaEstructura() {
    const st = GS.ui.aEst = GS.ui.aEst || { nueva: false, editId: null };
    const raices = S().where('unidades', (u) => !u.padreId).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const hijos = (id) => S().where('unidades', (u) => u.padreId === id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const jefe = (u) => (u.jefeId ? GS.nombreDe(u.jefeId) : 'Sin jefatura asignada');
    const nPers = (u) => S().where('personas', (p) => p.unidadId === u.id && p.activo).length;
    const formUnidad = (u) => html`<form class="card card-pad grid-form card-focus" data-submit="guardar-unidad">
      <h2 class="h2 full">${u ? 'Editar · ' + u.nombre : 'Nueva unidad'}</h2>
      <input type="hidden" name="id" value="${u ? u.id : ''}">
      <div><label class="label" for="un-n">Nombre</label><input id="un-n" name="nombre" class="input" value="${u ? u.nombre : ''}" required maxlength="80" placeholder="Ej: Edificio Nuevo"></div>
      <div><label class="label" for="un-t">Tipo</label><select id="un-t" name="tipo" class="input">${C.opciones([['edificio', 'Edificio'], ['gerencia', 'Gerencia'], ['equipo', 'Equipo o área']], u ? u.tipo : 'edificio')}</select></div>
      <div><label class="label" for="un-p">Depende de</label><select id="un-p" name="padreId" class="input"><option value="">Greystar Chile (nivel principal)</option>${C.opciones(S().where('unidades', (x) => x.tipo === 'gerencia' && (!u || x.id !== u.id)).map((x) => [x.id, x.nombre]), u ? u.padreId || '' : 'u-op')}</select></div>
      <div><label class="label" for="un-j">Jefatura</label><select id="un-j" name="jefeId" class="input"><option value="">Sin jefatura asignada</option>${C.opciones(opcionesJefes(), u ? u.jefeId || '' : '')}</select></div>
      <div class="row full"><button class="btn" type="submit">${u ? 'Guardar cambios' : 'Crear unidad'}</button><button type="button" class="btn2" data-action="unidad-cerrar">Cancelar</button></div>
    </form>`;
    const editU = st.editId ? GS.unidad(st.editId) : null;
    return html`<div class="stack" style="gap:16px">
      <div class="row"><button type="button" class="btn" data-action="unidad-nueva">Nueva unidad</button></div>
      ${st.nueva ? formUnidad(null) : ''}${editU ? formUnidad(editU) : ''}
      <div class="card card-pad stack-sm" style="gap:4px">
        <strong class="strong" style="font-size:18px">Greystar Chile</strong>
        ${raices.map((g) => html`<div class="tree-node">
          <div class="row"><strong class="strong">${g.nombre}</strong><span class="muted small">Jefatura: ${jefe(g)} · ${GS.plural(nPers(g), 'persona', 'personas')}</span>
            <button type="button" class="btn2 btn-xs" data-action="unidad-editar" data-id="${g.id}">Editar</button></div>
          ${hijos(g.id).length ? html`<div class="grid-cards" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">${hijos(g.id).map((h) => html`<div class="tree-leaf">
            <div><b>${h.nombre}</b><span class="muted xs">${jefe(h)} · ${GS.plural(nPers(h), 'persona', 'personas')}</span></div>
            <button type="button" class="link" data-action="unidad-editar" data-id="${h.id}" aria-label="Editar ${h.nombre}">Editar</button></div>`)}</div>` : ''}
        </div>`)}
      </div>
    </div>`;
  }
  GS.accion('unidad-nueva', () => { GS.ui.aEst.nueva = true; GS.ui.aEst.editId = null; });
  GS.accion('unidad-editar', (el) => { GS.ui.aEst.editId = el.dataset.id; GS.ui.aEst.nueva = false; });
  GS.accion('unidad-cerrar', () => { GS.ui.aEst.nueva = false; GS.ui.aEst.editId = null; });
  GS.accion('guardar-unidad', async (form, ev, fd) => {
    const datos = { nombre: String(fd.get('nombre') || '').trim(), tipo: fd.get('tipo'), padreId: fd.get('padreId') || null, jefeId: fd.get('jefeId') || null };
    if (!datos.nombre) throw new Error('Escribe el nombre de la unidad.');
    const id = fd.get('id');
    if (id) await S().update('unidades', id, datos); else await S().add('unidades', datos);
    GS.ui.aEst.nueva = false; GS.ui.aEst.editId = null;
    GS.toast(id ? 'Unidad actualizada.' : 'Unidad creada.');
  }, { escribe: true });

  // ---------- Reportes ----------
  function datosReporte() {
    const st = GS.ui.aRep = GS.ui.aRep || { unidad: '', cargo: '', curso: '', orden: 'avance', vista: 'persona' };
    const enUnidad = (p) => {
      if (!st.unidad) return true;
      if (p.unidadId === st.unidad) return true;
      const u = GS.unidad(p.unidadId);
      return u && u.padreId === st.unidad;
    };
    const personas = GS.personasActivas().filter(enUnidad).filter((p) => !st.cargo || GS.grupoDe(p) === st.cargo);
    let res = personas.map(GS.resumenPersona);
    if (st.curso) {
      res = res.map((r) => {
        const cursos = r.cursos.filter((c) => c.curso.id === st.curso);
        const avg = cursos.length ? Math.round(cursos.reduce((a, c) => a + c.pct, 0) / cursos.length) : 0;
        return Object.assign({}, r, { cursos, total: cursos.length, avg, vencidos: cursos.filter((c) => c.k === 'late').length });
      });
    }
    res = res.filter((r) => r.total > 0);
    return { st, res: C.ordenarResumenes(res, st.orden), personas };
  }
  function vistaReportes() {
    const { st, res, personas } = datosReporte();
    const cursosConIns = S().all('cursos').filter((k) => GS.inscritos(k.id)).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    let tabla;
    if (st.vista === 'unidad') {
      const filas = porUnidad(res, personas);
      tabla = filas.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>Unidad</th><th>Personas activas</th><th>Con cursos</th><th>Avance promedio</th><th>Cursos vencidos</th></tr></thead>
        <tbody>${filas.map((f) => html`<tr><td class="strong">${f.u}</td><td>${f.n}</td><td>${f.con}</td><td style="min-width:180px">${f.con ? C.barra(f.a) : '—'}</td><td>${f.v ? html`<span class="chip c-late">${f.v}</span>` : '0'}</td></tr>`)}</tbody></table></div>` : C.vacio('No hay datos con estos filtros.');
    } else if (st.vista === 'curso') {
      const filas = porCurso(res);
      tabla = filas.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>Curso</th><th>Personas</th><th>Completado</th><th>Avance promedio</th><th>Vencidos</th><th>Valoración</th></tr></thead>
        <tbody>${filas.map((f) => html`<tr><td class="strong">${f.t}</td><td>${f.n}</td><td>${f.comp}</td><td style="min-width:180px">${C.barra(f.a)}</td><td>${f.v ? html`<span class="chip c-late">${f.v}</span>` : '0'}</td><td style="white-space:nowrap">${f.val}</td></tr>`)}</tbody></table></div>` : C.vacio('No hay datos con estos filtros.');
    } else {
      tabla = html`${C.tablaAvance(res, 'rep')}<p class="muted small" style="margin:0">Avance general = promedio del avance de todos los cursos de la persona, asignados e inscritos.</p>`;
    }
    return html`<div class="stack" style="gap:18px">
      <div class="grid-form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        <div><label class="label" for="r-u">Unidad</label><select id="r-u" class="input" data-bind="aRep.unidad" data-rerender><option value="">Todas</option>${C.opciones(opcionesUnidades(), st.unidad)}</select></div>
        <div><label class="label" for="r-c">Cargo</label><select id="r-c" class="input" data-bind="aRep.cargo" data-rerender><option value="">Todos</option>${C.opciones(GS.GRUPOS_CARGO.map((g) => [g, g]), st.cargo)}</select></div>
        <div><label class="label" for="r-k">Curso</label><select id="r-k" class="input" data-bind="aRep.curso" data-rerender><option value="">Todos</option>${C.opciones(cursosConIns.map((k) => [k.id, k.titulo]), st.curso)}</select></div>
        <div><label class="label" for="r-o">Ordenar por</label><select id="r-o" class="input" data-bind="aRep.orden" data-rerender>${C.opciones([['avance', 'Menor avance primero'], ['vencidos', 'Más cursos vencidos'], ['nombre', 'Nombre']], st.orden)}</select></div>
        <button type="button" class="btn2" data-action="exportar">Exportar a Excel</button>
      </div>
      ${C.segmentos([['persona', 'Por persona'], ['unidad', 'Por unidad'], ['curso', 'Por curso']], st.vista, 'rep-vista')}
      ${tabla}
    </div>`;
  }
  function porUnidad(res, personas) {
    const grupos = {};
    personas.forEach((p) => { const k = GS.unidadDe(p); (grupos[k] = grupos[k] || { u: k, n: 0, con: 0, suma: 0, v: 0 }).n++; });
    res.forEach((r) => { const g = grupos[GS.unidadDe(r.persona)]; g.con++; g.suma += r.avg; g.v += r.vencidos; });
    return Object.values(grupos).map((g) => Object.assign(g, { a: g.con ? Math.round(g.suma / g.con) : 0 })).sort((a, b) => a.u.localeCompare(b.u, 'es'));
  }
  function porCurso(res) {
    const g = {};
    res.forEach((r) => r.cursos.forEach((c) => {
      const x = g[c.curso.id] = g[c.curso.id] || { t: c.curso.titulo, id: c.curso.id, n: 0, comp: 0, suma: 0, v: 0 };
      x.n++; x.suma += c.pct; if (c.k === 'done') x.comp++; if (c.k === 'late') x.v++;
    }));
    return Object.values(g).map((x) => { const v = GS.valoracion(x.id); return Object.assign(x, { a: Math.round(x.suma / x.n), val: v ? v.prom + ' / 5 (' + v.n + ')' : '—' }); }).sort((a, b) => a.t.localeCompare(b.t, 'es'));
  }
  GS.accion('rep-vista', (el) => { GS.ui.aRep.vista = el.dataset.v; });
  GS.accion('exportar', () => {
    const { st, res, personas } = datosReporte();
    let filas;
    if (st.vista === 'unidad') filas = [['Unidad', 'Personas activas', 'Con cursos', 'Avance promedio %', 'Cursos vencidos']].concat(porUnidad(res, personas).map((f) => [f.u, f.n, f.con, f.a, f.v]));
    else if (st.vista === 'curso') filas = [['Curso', 'Personas', 'Completado', 'Avance promedio %', 'Vencidos', 'Valoración']].concat(porCurso(res).map((f) => [f.t, f.n, f.comp, f.a, f.v, f.val]));
    else {
      filas = [['Persona', 'RUT', 'Unidad', 'Cargo', 'Curso', 'Origen', 'Plazo', 'Avance %', 'Estado', 'Terminado el']];
      res.forEach((r) => r.cursos.forEach((c) => filas.push([r.persona.nombre, r.persona.rut, GS.unidadDe(r.persona), GS.cargoDe(r.persona), c.curso.titulo, c.ins.origen === 'asignado' ? 'Asignado' : 'Inscrito', c.ins.plazo || '', c.pct, GS.SEM[c.k].l, c.ins.completadoEn || ''])));
    }
    GS.descargarCSV('grey-skills-reporte-' + st.vista + '-' + GS.hoy() + '.csv', filas);
    return false;
  });

  // ---------- Pantalla ----------
  const SUBS = [['bandeja', 'Bandeja'], ['cursos', 'Cursos'], ['rutas', 'Rutas'], ['personas', 'Personas'], ['estructura', 'Estructura'], ['reportes', 'Reportes']];
  GS.vistas.admin = {
    titulo: 'Administración',
    render({ real, params }) {
      const sub = SUBS.some((s) => s[0] === params[0]) ? params[0] : 'bandeja';
      const pend = GS.bandejaPendientes();
      let cuerpo;
      if (sub === 'cursos') cuerpo = vistaCursos();
      else if (sub === 'rutas') cuerpo = vistaRutas();
      else if (sub === 'personas') cuerpo = vistaPersonas(real);
      else if (sub === 'estructura') cuerpo = vistaEstructura();
      else if (sub === 'reportes') cuerpo = vistaReportes();
      else cuerpo = vistaBandeja();
      return html`<section class="stack-lg" style="gap:22px">
        <div><h1 class="h1">Administración</h1><p class="lead">Acceso total a cursos, personas y estructura de Greystar Chile.</p></div>
        ${C.subtabs(SUBS.map(([k, l]) => [k, l, k === 'bandeja' && pend ? pend : null]), sub, '#/admin', 'Herramientas de administración')}
        ${cuerpo}
      </section>`;
    }
  };
})(window.GS);
