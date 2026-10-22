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
      id: 'curso:' + k.id, tipo: GS.t('Curso en revisión'), chip: 'c-sky', t: k.titulo, de: GS.nombreDe(k.autorId) + ' · ' + GS.unidadDe(GS.persona(k.autorId)),
      fecha: k.actualizadoEn.slice(0, 10), acciones: [['aprobar-curso', GS.t('Aprobar y publicar'), false], ['devolver-curso', GS.t('Devolver con comentario'), true]],
      extra: html`<span class="muted small">${GS.t('{modulos} · para {alcance}', { modulos: GS.plural(k.modulos.length, 'módulo', 'módulos'), alcance: GS.alcanceTexto(k.alcance) })}</span><a class="xs strong" href="#/curso/${k.id}">${GS.t('Ver el curso')}</a>`, ref: k.id
    }));
    S().where('solicitudes', (s) => s.estado === 'pendiente').forEach((s) => {
      const d = s.datos;
      const p = GS.persona(s.personaId);
      if (s.tipo === 'ayuda') {
        items.push({
          id: 'sol:' + s.id, tipo: GS.t('Solicitud de ayuda'), chip: 'c-none', t: d.tema, de: GS.nombreDe(s.personaId) + ' · ' + GS.unidadDe(p), fecha: s.fecha,
          acciones: [['tomar-sol', GS.t('Tomar solicitud'), false], ['info-sol', GS.t('Pedir más información'), true]], ref: s.id,
          extra: html`<span class="small">${d.objetivo}</span><span class="muted small">${GS.t('Para {alcance}', { alcance: GS.alcanceTexto(d.alcance) })}${d.paraCuando ? ' · ' + GS.t('la necesita para el {fecha}', { fecha: GS.fecha(d.paraCuando) }) : ''}</span>${GS.urlSegura(d.material) ? html`<a class="xs strong" href="${GS.urlSegura(d.material)}" target="_blank" rel="noopener">${GS.t('Ver material')}</a>` : ''}`
        });
      } else {
        items.push({
          id: 'sol:' + s.id, tipo: GS.t('Propuesta presencial'), chip: 'c-gris', t: d.tema, de: GS.nombreDe(s.personaId) + ' · ' + GS.unidadDe(p) + ' · ' + (d.para === 'equipo' ? GS.t('para su equipo') : GS.t('para {alcance}', { alcance: GS.alcanceTexto(d.alcance) })), fecha: s.fecha,
          acciones: [['aprobar-pres', GS.t('Aprobar y agregar al catálogo'), false], ['devolver-sol', GS.t('Devolver con comentario'), true]], ref: s.id,
          extra: html`<span class="small">${d.porque}</span>${d.relator || d.fechaTentativa || d.costo ? html`<span class="muted small">${[d.relator && GS.t('Relator: {relator}', { relator: d.relator }), d.fechaTentativa && GS.t('Fecha tentativa: {fecha}', { fecha: d.fechaTentativa }), d.costo && GS.t('Costo: {costo}', { costo: d.costo })].filter(Boolean).join(' · ')}</span>` : ''}`
        });
      }
    });
    S().where('propuestas', (x) => x.estado === 'revision').forEach((x) => items.push({
      id: 'prop:' + x.id, tipo: GS.t('Propuesta de curso'), chip: 'c-suave', t: x.tema, de: GS.nombreDe(x.personaId) + ' · ' + GS.cargoDe(GS.persona(x.personaId)), fecha: x.fecha,
      acciones: [['aceptar-prop', GS.t('Aceptar'), true], ['rechazar-prop', GS.t('No aprobar'), true]], ref: x.id,
      extra: html`<span class="small">${x.porque}</span><span class="muted small">${x.para}${x.quien ? ' · ' + GS.t('Podría enseñarlo: {quien}', { quien: x.quien }) : ''}</span>`
    }));
    return items.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  GS.bandejaPendientes = () => itemsBandeja().length;

  function vistaBandeja() {
    const items = itemsBandeja();
    const resp = GS.ui.resp;
    return html`<div class="stack">
      <p class="strong" style="margin:0;font-size:16px">${items.length ? GS.t('{n} de tu respuesta', { n: GS.plural(items.length, 'pendiente', 'pendientes') }) : GS.t('No tienes nada pendiente.')}</p>
      ${items.map((b) => html`<div class="card inbox-item">
        <div class="inbox-main">
          <span class="chip ${b.chip}">${b.tipo}</span>
          <b>${b.t}</b>
          <span class="muted small">${b.de} · ${GS.t('Recibido el {fecha}', { fecha: GS.fecha(b.fecha) })}</span>
          ${b.extra || ''}
          ${resp && resp.item === b.id ? html`<form class="stack-sm" data-submit="responder" style="margin-top:8px">
            <label class="label" for="resp-txt">${resp.etiqueta}</label>
            <textarea id="resp-txt" name="nota" class="input" rows="2" maxlength="500"${GS.attr(resp.obligatorio, 'required')}></textarea>
            <div class="row"><button class="btn btn-sm" type="submit">${resp.boton}</button><button type="button" class="btn2 btn-sm" data-action="resp-cancelar">${GS.t('Cancelar')}</button></div>
          </form>` : ''}
        </div>
        ${!(resp && resp.item === b.id) ? html`<div class="row">${b.acciones.map(([a, l, comenta], i) =>
          html`<button type="button" class="${i === 0 ? 'btn' : 'btn2'}" data-action="${comenta ? 'resp-abrir' : a}" data-accion="${a}" data-item="${b.id}" data-ref="${b.ref}">${l}</button>`)}</div>` : ''}
      </div>`)}
    </div>`;
  }
  const RESP = {
    'devolver-curso': [GS.t('Comentario para quien creó el curso'), GS.t('Devolver'), true],
    'info-sol': [GS.t('¿Qué información necesitas?'), GS.t('Enviar pregunta'), true],
    'devolver-sol': [GS.t('Comentario para quien la propuso'), GS.t('Devolver'), true],
    'aceptar-prop': [GS.t('Mensaje para la persona (opcional)'), GS.t('Aceptar propuesta'), false],
    'rechazar-prop': [GS.t('¿Por qué no se aprueba?'), GS.t('No aprobar'), true]
  };
  GS.accion('resp-abrir', (el) => { const r = RESP[el.dataset.accion]; GS.ui.resp = { item: el.dataset.item, accion: el.dataset.accion, ref: el.dataset.ref, etiqueta: r[0], boton: r[1], obligatorio: r[2] }; });
  GS.accion('resp-cancelar', () => { GS.ui.resp = null; });
  GS.accion('responder', async (form, ev, fd) => {
    const r = GS.ui.resp;
    const nota = String(fd.get('nota') || '').trim();
    if (r.obligatorio && !nota) throw new Error(GS.t('Escribe un comentario.'));
    const id = r.ref;
    if (r.accion === 'devolver-curso') await S().update('cursos', id, { estado: 'devuelto', nota, actualizadoEn: GS.ahora() });
    if (r.accion === 'info-sol') await S().update('solicitudes', id, { estado: 'info', nota });
    if (r.accion === 'devolver-sol') await S().update('solicitudes', id, { estado: 'devuelta', nota });
    if (r.accion === 'aceptar-prop') await S().update('propuestas', id, { estado: 'aceptada', nota: nota || 'Aceptada. RRHH la está preparando.' });
    if (r.accion === 'rechazar-prop') await S().update('propuestas', id, { estado: 'rechazada', nota });
    GS.ui.resp = null;
    GS.toast(GS.t('Respuesta enviada.'));
  }, { escribe: true });
  GS.accion('aprobar-curso', async (el) => {
    const k = GS.curso(el.dataset.ref);
    await S().update('cursos', k.id, { estado: 'publicado', nota: '', publicadoEn: GS.ahora(), actualizadoEn: GS.ahora() });
    GS.toast(GS.t('"{titulo}" quedó publicado.', { titulo: k.titulo }));
  }, { escribe: true });
  GS.accion('tomar-sol', async (el) => { await S().update('solicitudes', el.dataset.ref, { estado: 'preparacion', nota: 'RRHH tomó la solicitud y te contactará.' }); GS.toast(GS.t('Solicitud tomada.')); }, { escribe: true });
  GS.accion('aprobar-pres', async (el) => {
    const s = S().get('solicitudes', el.dataset.ref);
    const d = s.datos;
    await S().add('presencialCatalogo', { titulo: d.tema, relator: d.relator || 'Por definir', duracion: 'Por definir', para: d.para === 'equipo' ? GS.unidadDe(GS.persona(s.personaId)) : GS.capitalizar(GS.alcanceTexto(d.alcance)) });
    await S().update('solicitudes', s.id, { estado: 'aprobada', nota: 'Agregada al catálogo de capacitaciones presenciales.' });
    GS.toast(GS.t('Agregada al catálogo presencial.'));
  }, { escribe: true });

  // ---------- Cursos ----------
  function vistaCursos() {
    const st = GS.ui.aCursos = GS.ui.aCursos || { q: '', estado: 'todos' };
    const q = GS.normalizar(st.q);
    const lista = S().all('cursos')
      .filter((k) => st.estado === 'todos' || k.estado === st.estado)
      .filter((k) => !q || GS.normalizar(k.titulo + ' ' + GS.nombreDe(k.autorId)).includes(q))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    const filtros = [['todos', GS.t('Todos')]].concat(Object.keys(GS.ESTADOS_CURSO).map((e) => [e, GS.ESTADOS_CURSO[e].l]));
    return html`<div class="stack" style="gap:16px">
      <div class="row">
        <div class="searchbar"><label class="sr-only" for="ac-q">${GS.t('Buscar curso')}</label><input id="ac-q" class="input" type="search" placeholder="${GS.t('Buscar curso o autor')}" value="${st.q}" data-bind="aCursos.q" data-input="refrescar"></div>
        <button type="button" class="btn" data-action="nuevo-curso">${GS.t('Crear curso')}</button>
      </div>
      ${C.segmentos(filtros, st.estado, 'ac-estado')}
      <p class="muted small" style="margin:0">${GS.t('Los cursos que creas tú se publican directo, sin revisión. Para cambiar un curso publicado, usa "Editar" y publica la nueva versión.')}</p>
      ${lista.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>${GS.t('Curso')}</th><th>${GS.t('Creado por')}</th><th>${GS.t('Edificios')}</th><th>${GS.t('Cargos')}</th><th>${GS.t('Estado')}</th><th>${GS.t('Inscritos')}</th><th>${GS.t('Valoración')}</th><th><span class="sr-only">${GS.t('Acciones')}</span></th></tr></thead>
        <tbody>${lista.map((k) => {
          const v = GS.valoracion(k.id);
          const n = GS.inscritos(k.id);
          return html`<tr>
            <td class="strong">${k.titulo || GS.t('Sin título')}${k.borradorEdicion ? html`<div class="muted xs">${GS.t('Tiene cambios sin publicar')}</div>` : ''}</td>
            <td>${GS.nombreDe(k.autorId)}</td><td>${GS.alcanceEdificiosCorto(k.alcance)}</td><td>${GS.alcanceCargosCorto(k.alcance)}</td>
            <td>${C.chipCurso(k.estado)}</td>
            <td>${n ? GS.plural(n, 'persona', 'personas') : '—'}</td>
            <td style="white-space:nowrap">${v ? v.prom + ' / 5 · ' + GS.plural(v.n, 'respuesta', 'respuestas') : GS.t('Sin respuestas aún')}</td>
            <td class="actions">
              <a class="btn2 btn-sm" href="#/curso/${k.id}">${GS.t('Ver')}</a>
              ${k.estado !== 'archivado' ? html`<a class="btn2 btn-sm" href="#/editor/${k.id}">${GS.t('Editar')}</a>` : ''}
              ${k.estado === 'publicado' ? html`<button type="button" class="btn2 btn-sm" data-action="archivar" data-id="${k.id}">${GS.t('Archivar')}</button>` : ''}
              ${k.estado === 'archivado' ? html`<button type="button" class="btn2 btn-sm" data-action="reactivar-curso" data-id="${k.id}">${GS.t('Reactivar')}</button>` : ''}
              ${['borrador'].includes(k.estado) && !n ? html`<button type="button" class="btn2 btn-sm btn-danger" data-action="eliminar-curso" data-id="${k.id}">${GS.t('Eliminar')}</button>` : ''}
            </td></tr>`;
        })}</tbody></table></div>` : C.vacio(GS.t('No hay cursos con ese filtro.'))}
    </div>`;
  }
  GS.accion('ac-estado', (el) => { GS.ui.aCursos.estado = el.dataset.v; });
  GS.accion('archivar', async (el) => {
    const k = GS.curso(el.dataset.id);
    if (!confirm(GS.t('¿Archivar "{titulo}"? Deja de aparecer en el explorador. Quienes lo terminaron conservan su certificado.', { titulo: k.titulo }))) return false;
    await S().update('cursos', k.id, { estado: 'archivado', actualizadoEn: GS.ahora() });
  }, { escribe: true });
  GS.accion('reactivar-curso', async (el) => { await S().update('cursos', el.dataset.id, { estado: 'publicado', actualizadoEn: GS.ahora() }); }, { escribe: true });
  GS.accion('eliminar-curso', async (el) => {
    const k = GS.curso(el.dataset.id);
    if (!confirm(GS.t('¿Eliminar el borrador "{titulo}"? No se puede deshacer.', { titulo: k.titulo || GS.t('Sin título') }))) return false;
    await S().remove('cursos', k.id);
  }, { escribe: true });

  // ---------- Rutas ----------
  function vistaRutas() {
    const rutas = S().all('rutas');
    const st = GS.ui.aRutas = GS.ui.aRutas || { sel: rutas[0] ? rutas[0].id : null };
    const r = S().get('rutas', st.sel) || rutas[0];
    const personasCon = (id) => GS.personasActivas().filter((p) => (p.rutas || []).includes(id)).length;
    let detalle = C.vacio(GS.t('Crea una ruta para empezar.'));
    if (r) {
      const disponibles = GS.cursosPublicados().filter((k) => !r.cursos.includes(k.id)).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      const cargosLibres = S().all('cargos').filter((c) => !S().all('rutas').some((x) => x.cargoId === c.id && x.id !== r.id));
      const n = personasCon(r.id);
      detalle = html`<div class="card card-pad stack grow" style="gap:14px">
        <form class="grid-form" data-submit="guardar-ruta">
          <div><label class="label" for="rt-n">${GS.t('Nombre de la ruta')}</label><input id="rt-n" name="nombre" class="input" value="${r.nombre}" required maxlength="80"></div>
          <div><label class="label" for="rt-c">${GS.t('Tipo')}</label><select id="rt-c" name="cargoId" class="input">
            <option value="">${GS.t('Ruta complementaria')}</option>
            ${C.opciones(cargosLibres.map((c) => [c.id, GS.t('Ruta de cargo: {cargo}', { cargo: c.nombre })]), r.cargoId || '')}</select></div>
          <div class="row"><button class="btn2" type="submit">${GS.t('Guardar nombre y tipo')}</button></div>
        </form>
        <span class="label" style="margin:0">${GS.t('Cursos de la ruta, en el orden sugerido')}</span>
        ${r.cursos.length ? r.cursos.map((kid, i) => { const k = GS.curso(kid); return html`<div class="route-course">
          <span class="n">${i + 1}</span><span style="flex:1;font-size:15px">${k ? k.titulo : GS.t('Curso eliminado')}${k && k.estado !== 'publicado' ? html` <span class="chip ${GS.ESTADOS_CURSO[k.estado].c}">${GS.ESTADOS_CURSO[k.estado].l}</span>` : ''}</span>
          <span class="muted xs">${k ? k.config.duracion : ''}</span>
          <button type="button" class="icon-btn" aria-label="${GS.t('Subir')}" data-action="ruta-mover" data-i="${i}" data-d="-1"${GS.attr(i === 0, 'disabled')}>↑</button>
          <button type="button" class="icon-btn" aria-label="${GS.t('Bajar')}" data-action="ruta-mover" data-i="${i}" data-d="1"${GS.attr(i === r.cursos.length - 1, 'disabled')}>↓</button>
          <button type="button" class="btn2 btn-xs" data-action="ruta-quitar" data-i="${i}">${GS.t('Quitar')}</button></div>`; }) : html`<p class="muted" style="margin:0">${GS.t('Esta ruta todavía no tiene cursos.')}</p>`}
        ${disponibles.length ? html`<form class="row" data-submit="ruta-agregar" style="align-items:flex-end">
          <div style="flex:1 1 260px"><label class="label" for="rt-add">${GS.t('Agregar curso')}</label><select id="rt-add" name="cursoId" class="input">${C.opciones(disponibles.map((k) => [k.id, k.titulo]), '')}</select></div>
          <button class="btn2" type="submit">${GS.t('Agregar')}</button></form>` : ''}
        <div class="notice">${r.cargoId ? GS.t('Esta ruta se ofrece automáticamente al crear a alguien con el cargo {cargo} o al cambiarlo a ese cargo.', { cargo: GS.cargo(r.cargoId).nombre }) + ' ' : GS.t('Esta ruta se ofrece como opción adicional al crear o editar a una persona.') + ' '}${n ? GS.t('Hoy la tienen {personas}; si agregas un curso, te preguntaremos si también se lo asignamos.', { personas: GS.plural(n, 'persona', 'personas') }) : GS.t('Todavía nadie la tiene.')}</div>
        <div><button type="button" class="btn2 btn-sm btn-danger" data-action="ruta-eliminar">${GS.t('Eliminar ruta')}</button></div>
      </div>`;
    }
    return html`<div class="stack" style="gap:16px">
      <p class="muted" style="margin:0;font-size:15px">${GS.t('Las rutas de cargo se ofrecen automáticamente al crear a alguien con ese cargo o al cambiarlo de cargo. Las complementarias se agregan a mano.')}</p>
      <div class="split">
        <div class="side stack-sm" style="gap:10px">
          <button type="button" class="btn self-start" data-action="ruta-nueva">${GS.t('Nueva ruta')}</button>
          ${rutas.map((x) => html`<button type="button" class="route-btn" aria-pressed="${String(r && x.id === r.id)}" data-action="ruta-sel" data-id="${x.id}">
            <span class="chip ${x.cargoId ? 'c-sky' : 'c-none'}">${x.cargoId ? GS.t('Ruta de cargo') : GS.t('Ruta complementaria')}</span>
            <b>${x.nombre}</b><span class="muted xs">${GS.plural(x.cursos.length, 'curso', 'cursos')} · ${GS.plural(personasCon(x.id), 'persona la tiene', 'personas la tienen')}</span></button>`)}
        </div>
        ${detalle}
      </div>
    </div>`;
  }
  const rutaSel = () => S().get('rutas', GS.ui.aRutas.sel) || S().all('rutas')[0];
  GS.accion('ruta-sel', (el) => { GS.ui.aRutas.sel = el.dataset.id; });
  GS.accion('ruta-nueva', async () => { const r = await S().add('rutas', { nombre: GS.t('Nueva ruta'), cargoId: null, cursos: [] }); GS.ui.aRutas.sel = r.id; }, { escribe: true });
  GS.accion('guardar-ruta', async (form, ev, fd) => {
    const nombre = String(fd.get('nombre') || '').trim();
    if (!nombre) throw new Error(GS.t('Escribe el nombre de la ruta.'));
    await S().update('rutas', rutaSel().id, { nombre, cargoId: fd.get('cargoId') || null });
    GS.toast(GS.t('Ruta guardada.'));
  }, { escribe: true });
  GS.accion('ruta-mover', async (el) => {
    const r = rutaSel(); const a = r.cursos.slice(); const i = Number(el.dataset.i), t = i + Number(el.dataset.d);
    [a[i], a[t]] = [a[t], a[i]];
    await S().update('rutas', r.id, { cursos: a });
  }, { escribe: true });
  GS.accion('ruta-quitar', async (el) => {
    const r = rutaSel(); const a = r.cursos.slice(); a.splice(Number(el.dataset.i), 1);
    await S().update('rutas', r.id, { cursos: a });
    GS.toast(GS.t('Curso quitado de la ruta. Quienes ya lo tenían asignado lo conservan.'));
  }, { escribe: true });
  GS.accion('ruta-agregar', async (form, ev, fd) => {
    const r = rutaSel(); const kid = fd.get('cursoId');
    await S().update('rutas', r.id, { cursos: r.cursos.concat([kid]) });
    const conRuta = GS.personasActivas().filter((p) => (p.rutas || []).includes(r.id));
    if (conRuta.length && confirm(GS.t('¿Asignar también "{titulo}" a las {n} personas que ya tienen esta ruta?', { titulo: GS.curso(kid).titulo, n: conRuta.length }))) {
      const res = await GS.ops.asignar({ personaIds: conRuta.map((p) => p.id), cursoIds: [kid], plazo: null, por: GS.yo().id });
      GS.toast(GS.t('Curso agregado y asignado a {personas}.', { personas: GS.plural(res.nuevos + res.actualizados, 'persona', 'personas') }));
    } else GS.toast(GS.t('Curso agregado a la ruta.'));
  }, { escribe: true });
  GS.accion('ruta-eliminar', async () => {
    const r = rutaSel();
    if (!confirm(GS.t('¿Eliminar "{nombre}"? Las personas conservan los cursos que ya tienen asignados.', { nombre: r.nombre }))) return false;
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
    const sigueBox = s.rol === 'visualizador' ? html`<fieldset class="fieldset-box full"><legend class="label">${GS.t('Unidades que puede seguir')}</legend>
      <div class="two-col">${S().all('unidades').map((u) => html`<label class="check"><input type="checkbox" data-action="sigue" data-path="${path}" data-v="${u.id}"${GS.attr((s.sigue || []).includes(u.id), 'checked')}>${u.nombre}</label>`)}</div></fieldset>` : '';
    let cambioCargo = '';
    if (!esNueva && persona) {
      const cambiaUnidad = s.unidadId !== persona.unidadId;
      const cambiaCargo = s.cargoId !== persona.cargoId;
      const rn = GS.rutaDeCargo(s.cargoId);
      if (cambiaUnidad) cambioCargo = html`<div class="notice full">${GS.t('Cambio de unidad: conserva todos sus cursos, avances y certificados. Su nueva jefatura podrá ver su avance.')}</div>`;
      if (cambiaCargo) {
        const actuales = GS.insDe(persona.id);
        cambioCargo = html`${cambioCargo}<div class="subbox full" style="gap:8px">
          <strong class="strong">${rn ? GS.t('Cambio de cargo: conserva sus {n} cursos y se le asigna la {ruta}', { n: actuales.length, ruta: rn.nombre }) : GS.t('Cambio de cargo: conserva sus {n} cursos', { n: actuales.length })}</strong>
          ${rn ? rn.cursos.map((kid) => {
            const k = GS.curso(kid); const i = GS.ins(persona.id, kid);
            const [txt, cls] = i ? (i.completadoEn ? [GS.t('Ya lo hizo · no se repite'), 'c-done'] : [GS.t('Ya lo tiene · sigue su avance'), 'c-sky']) : [GS.t('Se le asigna'), 'c-ok'];
            return html`<div class="row" style="justify-content:space-between;padding:6px 0;border-top:1px solid var(--borde-suave)"><span>${k ? k.titulo : kid}</span><span class="chip ${cls}">${txt}</span></div>`;
          }) : html`<span class="muted small">${GS.t('El cargo nuevo no tiene ruta definida.')}</span>`}
          ${rn ? html`<div style="max-width:260px;margin-top:6px"><label class="label" for="${path}-plazo">${GS.t('Fecha límite para los nuevos (opcional)')}</label><input id="${path}-plazo" class="input" type="date" data-bind="${path}.plazo" value="${s.plazo || ''}"></div>` : ''}
        </div>`;
      }
      if (!cambiaUnidad && !cambiaCargo) cambioCargo = html`<p class="muted small full" style="margin:0">${GS.t('Si cambias la unidad o el cargo verás aquí qué pasa con sus cursos.')}</p>`;
    }
    return html`<form class="card card-pad grid-form card-focus" data-submit="${submit}">
      <h2 class="h2 full">${titulo}</h2>
      ${esNueva ? html`<div><label class="label" for="${path}-n">${GS.t('Nombre completo')}</label><input id="${path}-n" class="input" data-bind="${path}.nombre" value="${s.nombre}" required maxlength="100"></div>
        <div><label class="label" for="${path}-rut">RUT</label><input id="${path}-rut" class="input" placeholder="12.345.678-9" data-bind="${path}.rut" value="${s.rut}" required maxlength="12"></div>` : ''}
      <div><label class="label" for="${path}-u">${GS.t('Unidad')}</label><select id="${path}-u" class="input" data-bind="${path}.unidadId" data-rerender>${esNueva && !s.unidadId ? html`<option value="">${GS.t('Elegir…')}</option>` : ''}${C.opciones(opcionesUnidades(), s.unidadId)}</select></div>
      <div><label class="label" for="${path}-c">${GS.t('Cargo')}</label><select id="${path}-c" class="input" data-bind="${path}.cargoId" data-change="reset-quitados" data-path="${path}">${C.opciones(S().all('cargos').map((c) => [c.id, c.nombre]), s.cargoId)}</select></div>
      <div><label class="label" for="${path}-r">${GS.t('Rol en la plataforma')}</label><select id="${path}-r" class="input" data-bind="${path}.rol" data-rerender>${C.opciones(opcionesRoles(), s.rol)}</select></div>
      <div><label class="label" for="${path}-j">${GS.t('Jefatura directa')}</label><select id="${path}-j" class="input" data-bind="${path}.jefeId"><option value="">${GS.t('Sin jefatura en la plataforma')}</option>${C.opciones(opcionesJefes(persona && persona.id), s.jefeId)}</select></div>
      ${sigueBox}
      ${esNueva ? C.rutasPersona(path) : cambioCargo}
      <div class="row full"><button class="btn" type="submit">${boton}</button><button type="button" class="btn2" data-action="persona-cerrar">${GS.t('Cancelar')}</button></div>
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
      panel = formPersona('nuevaPersona', GS.t('Nueva persona'), 'crear-persona', GS.t('Crear persona'), true);
    } else if (st.modo === 'editar') {
      const p = GS.persona(st.editId);
      if (!GS.ui.editPersona || GS.ui.editPersona.id !== p.id) GS.ui.editPersona = { id: p.id, unidadId: p.unidadId, cargoId: p.cargoId, rol: p.rol, jefeId: p.jefeId || '', sigue: (p.sigue || []).slice(), plazo: '' };
      panel = formPersona('editPersona', GS.t('Editar · {nombre}', { nombre: p.nombre }), 'guardar-persona', GS.t('Guardar cambios'), false, p);
    } else if (st.modo === 'carga') {
      panel = vistaCarga();
    }
    const sinAcceso = GS.auth.disponible() ? S().where('personas', (p) => p.activo && !p.cuenta && C.puedeDarAcceso(p, real)) : [];
    return html`<div class="stack" style="gap:16px">
      ${C.panelClaves()}
      <div class="row">
        <div class="searchbar"><label class="sr-only" for="ap-q">${GS.t('Buscar persona')}</label><input id="ap-q" class="input" type="search" placeholder="${GS.t('Buscar por nombre, RUT, unidad o cargo')}" value="${st.q}" data-bind="aPersonas.q" data-input="refrescar"></div>
        <button type="button" class="btn" data-action="persona-modo" data-v="nueva">${GS.t('Agregar persona')}</button>
        <button type="button" class="btn2" data-action="persona-modo" data-v="carga">${GS.t('Carga masiva desde Excel')}</button>
        ${sinAcceso.length ? html`<button type="button" class="btn2" data-action="accesos-pendientes">${GS.t('Crear accesos pendientes ({n})', { n: sinAcceso.length })}</button>` : ''}
      </div>
      ${panel}
      <label class="check small"><input type="checkbox" data-bind="aPersonas.mostrarInactivos" data-rerender${GS.attr(st.mostrarInactivos, 'checked')}>${GS.t('Mostrar personas desactivadas')}</label>
      <div class="card table-wrap"><table>
        <thead><tr><th>${GS.t('Persona')}</th><th>RUT</th><th>${GS.t('Unidad')}</th><th>${GS.t('Cargo')}</th><th>${GS.t('Rol')}</th>${GS.auth.disponible() ? html`<th>${GS.t('Acceso')}</th>` : ''}<th><span class="sr-only">${GS.t('Acciones')}</span></th></tr></thead>
        <tbody>${lista.map((p) => html`<tr class="${p.activo ? '' : 'inactivo'}">
          <td class="strong">${p.nombre}${p.activo ? '' : html`<div class="muted xs">${GS.t('Desactivada')}</div>`}</td><td>${p.rut}</td>
          <td>${p.rol === 'visualizador' && (p.sigue || []).length ? GS.t('Sigue: {unidades}', { unidades: p.sigue.map((u) => (GS.unidad(u) || { nombre: u }).nombre.replace('Edificio ', '')).join(', ') }) : GS.unidadDe(p)}</td>
          <td>${GS.cargoDe(p)}</td><td><span class="chip c-suave">${GS.ROLES[p.rol]}</span></td>
          ${GS.auth.disponible() ? html`<td>${C.celdaAcceso(p)}</td>` : ''}
          <td class="actions">
            ${C.botonAcceso(p, real)}
            ${p.id !== real.id && p.activo ? html`<button type="button" class="btn2 btn-sm" data-action="ver-como" data-id="${p.id}">${GS.t('Ver como')}</button>` : ''}
            <button type="button" class="btn2 btn-sm" data-action="persona-editar" data-id="${p.id}">${GS.t('Editar')}</button>
            ${p.id !== real.id ? html`<button type="button" class="btn2 btn-sm" data-action="toggle-activo" data-id="${p.id}">${p.activo ? GS.t('Desactivar') : GS.t('Reactivar')}</button>` : ''}
          </td></tr>`)}</tbody></table></div>
      <p class="muted small" style="margin:0">${GS.t('En "Editar" se cambia rol, unidad, cargo y jefatura. Para visualizadores se eligen las unidades que puede seguir.')}${GS.auth.disponible() ? ' ' + GS.t('"Crear acceso" y "Restablecer clave" generan una clave provisoria que la persona cambia en su primer ingreso.') : ''}</p>
    </div>`;
  }
  GS.accion('persona-modo', (el) => { const st = GS.ui.aPersonas; st.modo = st.modo === el.dataset.v ? null : el.dataset.v; delete GS.ui.nuevaPersona; delete GS.ui.carga; });
  GS.accion('persona-editar', (el) => { const st = GS.ui.aPersonas; st.modo = 'editar'; st.editId = el.dataset.id; delete GS.ui.editPersona; });
  GS.accion('persona-cerrar', () => { GS.ui.aPersonas.modo = null; delete GS.ui.nuevaPersona; delete GS.ui.editPersona; });
  GS.accion('ver-como', (el) => { GS.sesion.verComo(el.dataset.id); GS.ir('#/cursos'); return false; });
  GS.accion('crear-persona', async () => {
    const p = await C.crearPersona(GS.ui.nuevaPersona, GS.yo().id);
    const r = GS.auth.disponible() ? await C.darAccesos([p], GS.yo().id) : { error: null };
    GS.toast(GS.t('{nombre} quedó creada.', { nombre: p.nombre }) + (r.error ? ' ' + GS.t('No se pudo crear su acceso: {error} Puedes crearlo desde la lista.', { error: r.error.message }) : ''), r.error ? 'error' : undefined);
    delete GS.ui.nuevaPersona;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });
  GS.accion('guardar-persona', async () => {
    const s = GS.ui.editPersona;
    const p = GS.persona(s.id);
    if (s.jefeId === p.id) throw new Error(GS.t('Una persona no puede ser su propia jefatura.'));
    const cambios = { unidadId: s.unidadId, cargoId: s.cargoId, rol: s.rol, jefeId: s.jefeId || null, sigue: s.rol === 'visualizador' ? s.sigue : [] };
    let msg = GS.t('Cambios guardados.');
    if (s.cargoId !== p.cargoId) {
      const vieja = GS.rutaDeCargo(p.cargoId);
      const nueva = GS.rutaDeCargo(s.cargoId);
      cambios.rutas = (p.rutas || []).filter((r) => !vieja || r !== vieja.id).concat(nueva ? [nueva.id] : []);
      if (nueva) {
        const faltan = nueva.cursos.filter((kid) => !GS.ins(p.id, kid));
        if (faltan.length) { await GS.ops.asignar({ personaIds: [p.id], cursoIds: faltan, plazo: s.plazo || null, por: GS.yo().id }); msg = GS.t('Cambios guardados. Se le asignaron {cursos}.', { cursos: GS.plural(faltan.length, 'curso nuevo', 'cursos nuevos') }); }
      }
    }
    await S().update('personas', p.id, cambios);
    GS.toast(msg);
    delete GS.ui.editPersona;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });

  GS.accion('accesos-pendientes', async () => {
    const yo = GS.yo();
    const lista = S().where('personas', (p) => p.activo && !p.cuenta && C.puedeDarAcceso(p, yo));
    if (!confirm(GS.t('Se crearán {accesos} con su clave provisoria. Firebase permite alrededor de 100 por hora; si se alcanza el límite, el resto queda pendiente. ¿Seguir?', { accesos: GS.plural(lista.length, 'acceso', 'accesos') }))) return false;
    const r = await C.darAccesos(lista, yo.id);
    GS.toast(GS.plural(r.creados, 'acceso creado', 'accesos creados') + '.' + (r.error ? ' ' + r.error.message : ''), r.error ? 'error' : undefined);
  }, { escribe: true });

  // Carga masiva: se pega una tabla copiada desde Excel.
  function vistaCarga() {
    const st = GS.ui.carga = GS.ui.carga || { texto: '', filas: null };
    return html`<div class="card card-pad stack card-focus">
      <h2 class="h2">${GS.t('Carga masiva desde Excel')}</h2>
      <p style="margin:0">${GS.t('En Excel, arma columnas en este orden: {nombre}, {rut}, {unidad}, {cargo}, {rol} (opcional, por defecto Trabajador) y {jefatura} (opcional). Selecciona las filas, cópialas y pégalas aquí. A cada persona se le asigna la ruta de su cargo.', { nombre: html`<strong>${GS.t('Nombre')}</strong>`, rut: html`<strong>RUT</strong>`, unidad: html`<strong>${GS.t('Unidad')}</strong>`, cargo: html`<strong>${GS.t('Cargo')}</strong>`, rol: html`<strong>${GS.t('Rol')}</strong>`, jefatura: html`<strong>${GS.t('RUT de su jefatura')}</strong>` })}</p>
      <div><label class="label" for="carga-t">${GS.t('Filas copiadas desde Excel')}</label><textarea id="carga-t" class="input" rows="6" placeholder="Camila Rojas	12.345.678-5	Edificio Nativo	Guest Service" data-bind="carga.texto">${st.texto}</textarea></div>
      <div class="row"><button type="button" class="btn2" data-action="carga-revisar">${GS.t('Revisar filas')}</button></div>
      ${st.filas ? html`<div class="table-wrap"><table>
        <thead><tr><th>${GS.t('Fila')}</th><th>${GS.t('Nombre')}</th><th>RUT</th><th>${GS.t('Unidad')}</th><th>${GS.t('Cargo')}</th><th>${GS.t('Rol')}</th><th>${GS.t('Resultado')}</th></tr></thead>
        <tbody>${st.filas.map((f, i) => html`<tr><td>${i + 1}</td><td>${f.nombre}</td><td>${f.rut}</td><td>${f.unidad ? f.unidad.nombre : f.unidadTxt}</td><td>${f.cargo ? f.cargo.nombre : f.cargoTxt}</td><td>${GS.ROLES[f.rol] || f.rol}</td>
          <td>${f.error ? html`<span class="chip c-late">${f.error}</span>` : html`<span class="chip c-ok">${GS.t('Lista')}</span>`}</td></tr>`)}</tbody></table></div>
        <button type="button" class="btn self-start" data-action="carga-crear"${GS.attr(!st.filas.some((f) => !f.error), 'disabled')}>${GS.t('Crear {personas}', { personas: GS.plural(st.filas.filter((f) => !f.error).length, 'persona', 'personas') })}</button>` : ''}
    </div>`;
  }
  GS.accion('carga-revisar', () => {
    const st = GS.ui.carga;
    // Acepta el rol en español (como vienen las planillas) o en el idioma de la pantalla.
    const ROLES_ES = { trabajador: 'Trabajador', jefatura: 'Jefatura', gerente: 'Gerente', visualizador: 'Visualizador', admin: 'Administrador' };
    const rolDe = (t) => { const n = GS.normalizar(t); if (!n) return 'trabajador'; return Object.keys(GS.ROLES).find((r) => [ROLES_ES[r], GS.ROLES[r]].some((l) => GS.normalizar(l).startsWith(n.slice(0, 5))) || r === n) || ''; };
    const vistos = new Set();
    st.filas = String(st.texto).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const c = l.split(/\t|;/).map((x) => x.trim());
      const f = { nombre: c[0] || '', rut: c[1] || '', unidadTxt: c[2] || '', cargoTxt: c[3] || '', rol: rolDe(c[4] || ''), jefeRut: c[5] || '' };
      f.unidad = S().all('unidades').find((u) => GS.normalizar(u.nombre) === GS.normalizar(f.unidadTxt) || GS.normalizar(u.nombre) === 'edificio ' + GS.normalizar(f.unidadTxt));
      f.cargo = S().all('cargos').find((x) => GS.normalizar(x.nombre) === GS.normalizar(f.cargoTxt));
      const jefe = f.jefeRut ? S().all('personas').find((p) => GS.limpiarRut(p.rut) === GS.limpiarRut(f.jefeRut)) : null;
      f.jefeId = jefe ? jefe.id : (f.unidad && f.unidad.jefeId) || null;
      const limpio = GS.limpiarRut(f.rut);
      if (f.nombre.length < 3) f.error = GS.t('Falta el nombre');
      else if (!GS.rutValido(f.rut)) f.error = GS.t('RUT no válido');
      else if (vistos.has(limpio) || S().all('personas').some((p) => GS.limpiarRut(p.rut) === limpio)) f.error = GS.t('RUT repetido');
      else if (!f.unidad) f.error = GS.t('Unidad no encontrada');
      else if (!f.cargo) f.error = GS.t('Cargo no encontrado');
      else if (!f.rol) f.error = GS.t('Rol no reconocido');
      else if (f.jefeRut && !jefe) f.error = GS.t('Jefatura no encontrada');
      vistos.add(limpio);
      return f;
    });
    if (!st.filas.length) throw new Error(GS.t('Pega al menos una fila.'));
  });
  GS.accion('carga-crear', async () => {
    const st = GS.ui.carga;
    const ok = st.filas.filter((f) => !f.error);
    const creadas = [];
    for (const f of ok) {
      creadas.push(await C.crearPersona({ nombre: f.nombre, rut: f.rut, rol: f.rol, unidadId: f.unidad.id, cargoId: f.cargo.id, jefeId: f.jefeId, rutaCargo: true, quitados: [], otra: '', otraQuitados: [], plazo: '', sigue: [] }, GS.yo().id));
    }
    let msg = GS.plural(ok.length, 'persona creada', 'personas creadas') + '.';
    if (GS.auth.disponible()) {
      const r = await C.darAccesos(creadas, GS.yo().id);
      msg += ' ' + GS.plural(r.creados, 'acceso creado', 'accesos creados') + '.' + (r.error ? ' ' + r.error.message + ' ' + GS.t('Los que faltan se crean con "Crear accesos pendientes".') : '');
    }
    GS.toast(msg);
    delete GS.ui.carga;
    GS.ui.aPersonas.modo = null;
  }, { escribe: true });

  // ---------- Estructura ----------
  function vistaEstructura() {
    const st = GS.ui.aEst = GS.ui.aEst || { nueva: false, editId: null };
    const raices = S().where('unidades', (u) => !u.padreId).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const hijos = (id) => S().where('unidades', (u) => u.padreId === id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const jefe = (u) => (u.jefeId ? GS.nombreDe(u.jefeId) : GS.t('Sin jefatura asignada'));
    const nPers = (u) => S().where('personas', (p) => p.unidadId === u.id && p.activo).length;
    const formUnidad = (u) => html`<form class="card card-pad grid-form card-focus" data-submit="guardar-unidad">
      <h2 class="h2 full">${u ? GS.t('Editar · {nombre}', { nombre: u.nombre }) : GS.t('Nueva unidad')}</h2>
      <input type="hidden" name="id" value="${u ? u.id : ''}">
      <div><label class="label" for="un-n">${GS.t('Nombre')}</label><input id="un-n" name="nombre" class="input" value="${u ? u.nombre : ''}" required maxlength="80" placeholder="${GS.t('Ej: Edificio Nuevo')}"></div>
      <div><label class="label" for="un-t">${GS.t('Tipo')}</label><select id="un-t" name="tipo" class="input">${C.opciones([['edificio', GS.t('Edificio')], ['gerencia', GS.t('Gerencia')], ['equipo', GS.t('Equipo o área')]], u ? u.tipo : 'edificio')}</select></div>
      <div><label class="label" for="un-p">${GS.t('Depende de')}</label><select id="un-p" name="padreId" class="input"><option value="">${GS.t('Greystar Chile (nivel principal)')}</option>${C.opciones(S().where('unidades', (x) => x.tipo === 'gerencia' && (!u || x.id !== u.id)).map((x) => [x.id, x.nombre]), u ? u.padreId || '' : 'u-op')}</select></div>
      <div><label class="label" for="un-j">${GS.t('Jefatura')}</label><select id="un-j" name="jefeId" class="input"><option value="">${GS.t('Sin jefatura asignada')}</option>${C.opciones(opcionesJefes(), u ? u.jefeId || '' : '')}</select></div>
      <div class="row full"><button class="btn" type="submit">${u ? GS.t('Guardar cambios') : GS.t('Crear unidad')}</button><button type="button" class="btn2" data-action="unidad-cerrar">${GS.t('Cancelar')}</button></div>
    </form>`;
    const editU = st.editId ? GS.unidad(st.editId) : null;
    return html`<div class="stack" style="gap:16px">
      <div class="row"><button type="button" class="btn" data-action="unidad-nueva">${GS.t('Nueva unidad')}</button></div>
      ${st.nueva ? formUnidad(null) : ''}${editU ? formUnidad(editU) : ''}
      <div class="card card-pad stack-sm" style="gap:4px">
        <strong class="strong" style="font-size:18px">Greystar Chile</strong>
        ${raices.map((g) => html`<div class="tree-node">
          <div class="row"><strong class="strong">${g.nombre}</strong><span class="muted small">${GS.t('Jefatura: {jefe}', { jefe: jefe(g) })} · ${GS.plural(nPers(g), 'persona', 'personas')}</span>
            <button type="button" class="btn2 btn-xs" data-action="unidad-editar" data-id="${g.id}">${GS.t('Editar')}</button></div>
          ${hijos(g.id).length ? html`<div class="grid-cards" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">${hijos(g.id).map((h) => html`<div class="tree-leaf">
            <div><b>${h.nombre}</b><span class="muted xs">${jefe(h)} · ${GS.plural(nPers(h), 'persona', 'personas')}</span></div>
            <button type="button" class="link" data-action="unidad-editar" data-id="${h.id}" aria-label="${GS.t('Editar {nombre}', { nombre: h.nombre })}">${GS.t('Editar')}</button></div>`)}</div>` : ''}
        </div>`)}
      </div>
    </div>`;
  }
  GS.accion('unidad-nueva', () => { GS.ui.aEst.nueva = true; GS.ui.aEst.editId = null; });
  GS.accion('unidad-editar', (el) => { GS.ui.aEst.editId = el.dataset.id; GS.ui.aEst.nueva = false; });
  GS.accion('unidad-cerrar', () => { GS.ui.aEst.nueva = false; GS.ui.aEst.editId = null; });
  GS.accion('guardar-unidad', async (form, ev, fd) => {
    const datos = { nombre: String(fd.get('nombre') || '').trim(), tipo: fd.get('tipo'), padreId: fd.get('padreId') || null, jefeId: fd.get('jefeId') || null };
    if (!datos.nombre) throw new Error(GS.t('Escribe el nombre de la unidad.'));
    const id = fd.get('id');
    if (id) await S().update('unidades', id, datos); else await S().add('unidades', datos);
    GS.ui.aEst.nueva = false; GS.ui.aEst.editId = null;
    GS.toast(id ? GS.t('Unidad actualizada.') : GS.t('Unidad creada.'));
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
        <thead><tr><th>${GS.t('Unidad')}</th><th>${GS.t('Personas activas')}</th><th>${GS.t('Con cursos')}</th><th>${GS.t('Avance promedio')}</th><th>${GS.t('Cursos vencidos')}</th></tr></thead>
        <tbody>${filas.map((f) => html`<tr><td class="strong">${f.u}</td><td>${f.n}</td><td>${f.con}</td><td style="min-width:180px">${f.con ? C.barra(f.a) : '—'}</td><td>${f.v ? html`<span class="chip c-late">${f.v}</span>` : '0'}</td></tr>`)}</tbody></table></div>` : C.vacio(GS.t('No hay datos con estos filtros.'));
    } else if (st.vista === 'curso') {
      const filas = porCurso(res);
      tabla = filas.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>${GS.t('Curso')}</th><th>${GS.t('Personas')}</th><th>${GS.t('Completado')}</th><th>${GS.t('Avance promedio')}</th><th>${GS.t('Vencidos')}</th><th>${GS.t('Valoración')}</th></tr></thead>
        <tbody>${filas.map((f) => html`<tr><td class="strong">${f.t}</td><td>${f.n}</td><td>${f.comp}</td><td style="min-width:180px">${C.barra(f.a)}</td><td>${f.v ? html`<span class="chip c-late">${f.v}</span>` : '0'}</td><td style="white-space:nowrap">${f.val}</td></tr>`)}</tbody></table></div>` : C.vacio(GS.t('No hay datos con estos filtros.'));
    } else {
      tabla = html`${C.tablaAvance(res, 'rep')}<p class="muted small" style="margin:0">${GS.t('Avance general = promedio del avance de todos los cursos de la persona, asignados e inscritos.')}</p>`;
    }
    return html`<div class="stack" style="gap:18px">
      <div class="grid-form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        <div><label class="label" for="r-u">${GS.t('Unidad')}</label><select id="r-u" class="input" data-bind="aRep.unidad" data-rerender><option value="">${GS.t('Todas')}</option>${C.opciones(opcionesUnidades(), st.unidad)}</select></div>
        <div><label class="label" for="r-c">${GS.t('Cargo')}</label><select id="r-c" class="input" data-bind="aRep.cargo" data-rerender><option value="">${GS.t('Todos')}</option>${C.opciones(GS.GRUPOS_CARGO.map((g) => [g, g]), st.cargo)}</select></div>
        <div><label class="label" for="r-k">${GS.t('Curso')}</label><select id="r-k" class="input" data-bind="aRep.curso" data-rerender><option value="">${GS.t('Todos')}</option>${C.opciones(cursosConIns.map((k) => [k.id, k.titulo]), st.curso)}</select></div>
        <div><label class="label" for="r-o">${GS.t('Ordenar por')}</label><select id="r-o" class="input" data-bind="aRep.orden" data-rerender>${C.opciones([['avance', GS.t('Menor avance primero')], ['vencidos', GS.t('Más cursos vencidos')], ['nombre', GS.t('Nombre')]], st.orden)}</select></div>
        <button type="button" class="btn2" data-action="exportar">${GS.t('Exportar a Excel')}</button>
      </div>
      ${C.segmentos([['persona', GS.t('Por persona')], ['unidad', GS.t('Por unidad')], ['curso', GS.t('Por curso')]], st.vista, 'rep-vista')}
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
    if (st.vista === 'unidad') filas = [[GS.t('Unidad'), GS.t('Personas activas'), GS.t('Con cursos'), GS.t('Avance promedio %'), GS.t('Cursos vencidos')]].concat(porUnidad(res, personas).map((f) => [f.u, f.n, f.con, f.a, f.v]));
    else if (st.vista === 'curso') filas = [[GS.t('Curso'), GS.t('Personas'), GS.t('Completado'), GS.t('Avance promedio %'), GS.t('Vencidos'), GS.t('Valoración')]].concat(porCurso(res).map((f) => [f.t, f.n, f.comp, f.a, f.v, f.val]));
    else {
      filas = C.filasAvance(res.filter((r) => r.cursos.length));
    }
    GS.descargarCSV('grey-skills-reporte-' + st.vista + '-' + GS.hoy() + '.csv', filas);
    return false;
  });

  // ---------- Pantalla ----------
  // ---------- Respaldo ----------
  // Descarga toda la base en un archivo, para guardarlo fuera de Firebase (segunda capa de protección).
  const COLECCIONES_RESPALDO = ['unidades', 'cargos', 'personas', 'cursos', 'rutas', 'inscripciones', 'propuestas', 'solicitudes', 'presencialCatalogo', 'convocatorias'];
  function vistaRespaldo() {
    const n = (c) => S().all(c).length;
    return html`<div class="card card-pad stack" style="max-width:860px">
      <h2 class="h2">${GS.t('Respaldo de la información')}</h2>
      <p style="margin:0">${GS.t('Descarga un archivo con toda la información de Grey Skills: {personas}, {cursos}, {registros} y el resto de la configuración.', { personas: GS.plural(n('personas'), 'persona', 'personas'), cursos: GS.plural(n('cursos'), 'curso', 'cursos'), registros: GS.plural(n('inscripciones'), 'registro de avance', 'registros de avance') })}</p>
      <div class="notice">${GS.t('Descárgalo al menos una vez por semana y guárdalo en una carpeta de la empresa, fuera de Firebase. Si algún día se pierde información, con este archivo se puede recuperar. Contiene datos personales (nombres y RUT): guárdalo con el mismo cuidado que una planilla de personal.')}</div>
      <button type="button" class="btn self-start" data-action="respaldo-descargar">${GS.t('Descargar respaldo completo')}</button>
    </div>`;
  }
  GS.accion('respaldo-descargar', async () => {
    const datos = { app: 'Grey Skills', fecha: GS.ahora(), colecciones: {} };
    COLECCIONES_RESPALDO.forEach((c) => { datos.colecciones[c] = S().all(c); });
    if (GS.store.modo() === 'firestore') {
      const snap = await (await GS.firebase()).firestore().collection('accesos').get();
      datos.colecciones.accesos = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'greyskills-respaldo-' + GS.hoy() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    GS.toast(GS.t('Respaldo descargado. Guárdalo en una carpeta de la empresa.'));
    return false;
  });

  const SUBS = [['bandeja', GS.t('Bandeja')], ['cursos', GS.t('Cursos')], ['rutas', GS.t('Rutas')], ['personas', GS.t('Personas')], ['estructura', GS.t('Estructura')], ['reportes', GS.t('Reportes')], ['respaldo', GS.t('Respaldo')]];
  GS.vistas.admin = {
    titulo: GS.t('Administración'),
    render({ real, params }) {
      const sub = SUBS.some((s) => s[0] === params[0]) ? params[0] : 'bandeja';
      const pend = GS.bandejaPendientes();
      let cuerpo;
      if (sub === 'cursos') cuerpo = vistaCursos();
      else if (sub === 'rutas') cuerpo = vistaRutas();
      else if (sub === 'personas') cuerpo = vistaPersonas(real);
      else if (sub === 'estructura') cuerpo = vistaEstructura();
      else if (sub === 'reportes') cuerpo = vistaReportes();
      else if (sub === 'respaldo') cuerpo = vistaRespaldo();
      else cuerpo = vistaBandeja();
      return html`<section class="stack-lg" style="gap:22px">
        <div><h1 class="h1">${GS.t('Administración')}</h1><p class="lead">${GS.t('Acceso total a cursos, personas y estructura de Greystar Chile.')}</p></div>
        ${C.subtabs(SUBS.map(([k, l]) => [k, l, k === 'bandeja' && pend ? pend : null]), sub, '#/admin', GS.t('Herramientas de administración'))}
        ${cuerpo}
      </section>`;
    }
  };
})(window.GS);
