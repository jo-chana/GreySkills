// "Mi equipo" (jefatura y gerente) y "Seguimiento" (visualizador).
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;

  const SUBS = [['avances', 'Avances'], ['asignar', 'Asignar cursos'], ['usuarios', 'Usuarios'], ['crear', 'Crear curso'], ['presencial', 'Capacitación presencial']];

  GS.vistas.equipo = {
    titulo: ({ yo }) => (yo.rol === 'visualizador' ? 'Seguimiento' : 'Mi equipo'),
    render({ yo, params }) {
      const ctxEq = GS.contextoEquipo(yo, GS.ui.equipoSel);
      const sub = ctxEq.editable ? (SUBS.some((s) => s[0] === params[0]) ? params[0] : 'avances') : 'avances';
      let cuerpo;
      if (sub === 'asignar') cuerpo = vistaAsignar(yo, ctxEq);
      else if (sub === 'usuarios') cuerpo = vistaUsuarios(yo);
      else if (sub === 'crear') cuerpo = vistaCrear(yo);
      else if (sub === 'presencial') cuerpo = vistaPresencial(yo, ctxEq);
      else cuerpo = vistaAvances(ctxEq, yo);

      return html`<section class="stack-lg" style="gap:22px">
        <div class="row-between">
          <div><h1 class="h1">${ctxEq.titulo}</h1><p class="lead">${ctxEq.sub}</p></div>
          ${!ctxEq.editable ? html`<span class="chip chip-lg c-gris">Solo lectura</span>` : ''}
        </div>
        ${ctxEq.opciones.length ? html`<div class="row"><span class="muted xs strong">Ver:</span>${C.segmentos(ctxEq.opciones.map((o) => [o.id, o.l]), ctxEq.sel, 'equipo-sel')}</div>` : ''}
        ${!ctxEq.editable && ctxEq.msg ? html`<div class="notice">${ctxEq.msg}</div>` : ''}
        ${ctxEq.editable ? C.subtabs(SUBS, sub, '#/equipo', 'Herramientas de equipo') : ''}
        ${cuerpo}
      </section>`;
    }
  };
  const nombreArchivo = (txt) => 'avance-' + GS.normalizar(txt).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + GS.hoy() + '.csv';
  GS.accion('exportar-equipo', () => {
    const yo = GS.yo();
    const ctxEq = GS.contextoEquipo(yo, GS.ui.equipoSel);
    const res = ctxEq.personas.map(GS.resumenPersona).sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre, 'es'));
    GS.descargarCSV(nombreArchivo(ctxEq.sub.split(' · ')[0]), C.filasAvance(res));
    return false;
  });
  // Gerente: su equipo directo y los equipos de cada jefatura, en un solo archivo.
  GS.accion('exportar-equipos', () => {
    const yo = GS.yo();
    const res = [];
    GS.contextoEquipo(yo, 'directo').opciones.forEach((o) => {
      const ctxEq = GS.contextoEquipo(yo, o.id);
      ctxEq.personas.map(GS.resumenPersona).sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre, 'es'))
        .forEach((r) => res.push(Object.assign(r, { equipo: o.l })));
    });
    GS.descargarCSV(nombreArchivo('todos mis equipos'), C.filasAvance(res, true));
    return false;
  });
  GS.accion('equipo-sel', (el) => { GS.ui.equipoSel = el.dataset.v; if (GS.ruta().params[0] && GS.ruta().params[0] !== 'avances') { GS.ir('#/equipo/avances'); return false; } });

  // ---------- Avances ----------
  // Jefaturas y gerentes pueden exportar a Excel el avance del equipo que están viendo.
  const puedeExportar = (yo) => yo.rol === 'jefatura' || yo.rol === 'gerente';
  function vistaAvances(ctxEq, yo) {
    const res = C.ordenarResumenes(ctxEq.personas.map(GS.resumenPersona).filter((r) => r.total > 0));
    const avance = res.length ? Math.round(res.reduce((a, r) => a + r.avg, 0) / res.length) + '%' : '—';
    return html`<div class="stack" style="gap:20px">
      <div class="grid-kpi">
        <div class="card card-pad-sm"><div class="kpi-num">${avance}</div><div class="muted small">avance general del equipo</div></div>
        <div class="card card-pad-sm"><div class="kpi-num">${res.length}</div><div class="muted small">personas con cursos</div></div>
        <div class="card card-pad-sm"><div class="kpi-num kpi-red">${res.filter((r) => r.vencidos).length}</div><div class="muted small">personas con algún curso vencido</div></div>
      </div>
      ${puedeExportar(yo) && ctxEq.personas.length ? html`<div class="row">
        <button type="button" class="btn2" data-action="exportar-equipo">Exportar a Excel</button>
        ${yo.rol === 'gerente' && ctxEq.opciones.length > 1 ? html`<button type="button" class="btn2" data-action="exportar-equipos">Exportar todos mis equipos</button>` : ''}
      </div>` : ''}
      ${res.length ? C.tablaAvance(res, 'eq') : C.vacio('Esta unidad todavía no tiene personas con cursos.')}
      <p class="muted small" style="margin:0">Haz clic en una persona para ver el detalle de cada curso. La lista parte por quien tiene menor avance.</p>
    </div>`;
  }

  // ---------- Asignar cursos ----------
  function vistaAsignar(yo, ctxEq) {
    const st = GS.ui.asignar = GS.ui.asignar || { cursoId: '', sel: [], conPlazo: true, plazo: '', listo: null };
    const cursos = GS.cursosPublicados().sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    if (!st.cursoId && cursos.length) st.cursoId = cursos[0].id;
    const equipo = ctxEq.personas;
    const todos = equipo.length && equipo.every((p) => st.sel.includes(p.id));
    return html`<form class="card card-pad stack" data-submit="asignar" style="gap:22px;max-width:760px">
      ${st.listo ? html`<div class="notice" role="status">${st.listo}</div>` : ''}
      <div><label class="label" for="a-curso">1. Elige el curso</label>
        <select id="a-curso" class="input" data-bind="asignar.cursoId" data-rerender>${C.opciones(cursos.map((k) => [k.id, k.titulo]), st.cursoId)}</select></div>
      <fieldset class="stack-sm" style="gap:4px">
        <legend class="label">2. Elige a quiénes</legend>
        ${equipo.length ? html`<label class="check check-strong"><input type="checkbox" data-action="asig-todos"${GS.attr(todos, 'checked')}>Todo el equipo</label>
          ${equipo.map((p) => {
            const ins = GS.ins(p.id, st.cursoId);
            const nota = ins ? (ins.completadoEn ? 'ya lo completó' : ins.origen === 'asignado' ? 'ya lo tiene asignado' : 'inscrito por su cuenta') : '';
            return html`<label class="check"><input type="checkbox" data-action="asig-persona" data-id="${p.id}"${GS.attr(st.sel.includes(p.id), 'checked')}${GS.attr(ins && ins.completadoEn, 'disabled')}>${p.nombre} <span class="muted small">· ${GS.cargoDe(p)}${nota ? ' · ' + nota : ''}</span></label>`;
          })}` : html`<p class="muted" style="margin:0">Tu equipo todavía no tiene personas.</p>`}
      </fieldset>
      <div class="stack-sm">
        <span class="label" style="margin:0">3. Fecha límite (opcional)</span>
        <label class="check"><input type="checkbox" data-bind="asignar.conPlazo" data-rerender${GS.attr(st.conPlazo, 'checked')}>Agregar fecha límite</label>
        ${st.conPlazo ? html`<div style="max-width:260px"><label class="label" for="a-fecha">Fecha</label><input id="a-fecha" class="input" type="date" min="${GS.hoy()}" data-bind="asignar.plazo" value="${st.plazo}"></div>` : ''}
      </div>
      <button class="btn self-start" type="submit"${GS.attr(!st.sel.length || !st.cursoId, 'disabled')}>Asignar curso${st.sel.length ? ' a ' + GS.plural(st.sel.length, 'persona', 'personas') : ''}</button>
    </form>`;
  }
  GS.accion('asig-todos', (el) => {
    const yo = GS.yo();
    const eq = GS.contextoEquipo(yo, GS.ui.equipoSel).personas.filter((p) => { const i = GS.ins(p.id, GS.ui.asignar.cursoId); return !(i && i.completadoEn); });
    GS.ui.asignar.sel = el.checked ? eq.map((p) => p.id) : [];
    GS.ui.asignar.listo = null;
  });
  GS.accion('asig-persona', (el) => {
    const s = GS.ui.asignar.sel;
    const i = s.indexOf(el.dataset.id);
    if (el.checked && i < 0) s.push(el.dataset.id);
    if (!el.checked && i >= 0) s.splice(i, 1);
    GS.ui.asignar.listo = null;
  });
  GS.accion('asignar', async () => {
    const st = GS.ui.asignar;
    if (st.conPlazo && st.plazo && st.plazo < GS.hoy()) throw new Error('La fecha límite no puede ser anterior a hoy.');
    const r = await GS.ops.asignar({ personaIds: st.sel, cursoIds: [st.cursoId], plazo: st.conPlazo ? st.plazo || null : null, por: GS.yo().id });
    st.listo = 'Listo. "' + GS.curso(st.cursoId).titulo + '" ya aparece en "Mis cursos" de ' + GS.plural(r.nuevos + r.actualizados, 'persona', 'personas') + '.';
    st.sel = [];
  }, { escribe: true });

  // ---------- Usuarios del equipo ----------
  function vistaUsuarios(yo) {
    const st = GS.ui.usuarios = GS.ui.usuarios || { abierto: false };
    const lista = GS.equipoTodos(yo.id).sort((a, b) => (b.activo - a.activo) || a.nombre.localeCompare(b.nombre, 'es'));
    let form = '';
    if (st.abierto) {
      const s = C.estadoPersona('nuevaPersonaEq', { unidadId: yo.unidadId, jefeId: yo.id, rol: 'trabajador' });
      const cargos = S().where('cargos', (c) => c.grupo !== 'Cargos de oficina central');
      form = html`<form class="card card-pad grid-form card-focus" data-submit="crear-persona-eq">
        <h2 class="h2 full">Nueva persona en tu equipo</h2>
        <div><label class="label" for="ne-n">Nombre completo</label><input id="ne-n" class="input" data-bind="nuevaPersonaEq.nombre" value="${s.nombre}" required maxlength="100"></div>
        <div><label class="label" for="ne-rut">RUT</label><input id="ne-rut" class="input" placeholder="12.345.678-9" data-bind="nuevaPersonaEq.rut" value="${s.rut}" required maxlength="12"></div>
        <div><label class="label" for="ne-c">Cargo</label><select id="ne-c" class="input" data-bind="nuevaPersonaEq.cargoId" data-change="reset-quitados" data-path="nuevaPersonaEq">${C.opciones(cargos.map((c) => [c.id, c.nombre]), s.cargoId)}</select></div>
        <p class="muted small" style="margin:0">Quedará en ${GS.unidadDe(yo)}, con rol de trabajador y a tu cargo.${GS.auth.disponible() ? ' Al crearla verás su clave provisoria para que se la entregues.' : ''}</p>
        ${C.rutasPersona('nuevaPersonaEq')}
        <button class="btn self-start" type="submit">Crear usuario</button>
      </form>`;
    }
    return html`<div class="stack" style="gap:18px">
      ${C.panelClaves()}
      <button type="button" class="btn self-start" data-action="toggle-usuarios">${st.abierto ? 'Cerrar formulario' : 'Agregar persona'}</button>
      ${form}
      ${lista.length ? html`<div class="card table-wrap"><table>
        <thead><tr><th>Persona</th><th>RUT</th><th>Cargo</th><th>Estado</th>${GS.auth.disponible() ? html`<th>Acceso</th>` : ''}<th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${lista.map((p) => html`<tr class="${p.activo ? '' : 'inactivo'}">
          <td class="strong">${p.nombre}</td><td>${p.rut}</td><td>${GS.cargoDe(p)}</td>
          <td><span class="chip ${p.activo ? 'c-ok' : 'c-gris'}">${p.activo ? 'Activo' : 'Desactivado'}</span></td>
          ${GS.auth.disponible() ? html`<td>${C.celdaAcceso(p)}</td>` : ''}
          <td class="actions">${C.botonAcceso(p, yo)}<button type="button" class="btn2 btn-sm" data-action="toggle-activo" data-id="${p.id}">${p.activo ? 'Desactivar' : 'Reactivar'}</button></td>
        </tr>`)}</tbody></table></div>` : C.vacio('Todavía no tienes personas a tu cargo.')}
      <p class="muted small" style="margin:0">Una persona desactivada no puede ingresar, pero conserva su historial de cursos y certificados.${GS.auth.disponible() ? ' Si alguien olvida su clave, usa "Restablecer clave" y entrégale la nueva clave provisoria.' : ''}</p>
    </div>`;
  }
  GS.accion('toggle-usuarios', () => { GS.ui.usuarios.abierto = !GS.ui.usuarios.abierto; if (!GS.ui.usuarios.abierto) delete GS.ui.nuevaPersonaEq; });
  GS.accion('reset-quitados', (el) => { const s = GS.getPath(GS.ui, el.dataset.path); s.quitados = []; s.otraQuitados = []; if (s.otra && GS.rutaDeCargo(s.cargoId) && GS.rutaDeCargo(s.cargoId).id === s.otra) s.otra = ''; });
  GS.accion('crear-persona-eq', async () => {
    const yo = GS.yo();
    const s = GS.ui.nuevaPersonaEq;
    s.unidadId = yo.unidadId; s.jefeId = yo.id; s.rol = 'trabajador';
    const p = await C.crearPersona(s, yo.id);
    const r = GS.auth.disponible() ? await C.darAccesos([p], yo.id) : { error: null };
    GS.toast(p.nombre + ' quedó creada en tu equipo.' + (r.error ? ' No se pudo crear su acceso: ' + r.error.message + ' Puedes crearlo desde la lista.' : ''), r.error ? 'error' : undefined);
    delete GS.ui.nuevaPersonaEq;
    GS.ui.usuarios.abierto = false;
  }, { escribe: true });
  GS.accion('toggle-activo', async (el) => {
    const p = GS.persona(el.dataset.id);
    if (p.id === GS.real().id) throw new Error('No puedes desactivar tu propia cuenta.');
    if (p.activo && !confirm('¿Desactivar a ' + p.nombre + '? No podrá ingresar, pero se conserva su historial.')) return false;
    await S().update('personas', p.id, { activo: !p.activo });
  }, { escribe: true });

  // ---------- Crear curso (jefaturas) ----------
  const ESTADO_SOL = { pendiente: ['Recibida', 'c-sky'], preparacion: ['En preparación', 'c-ok'], info: ['Falta información', 'c-warn'], aprobada: ['Aprobada', 'c-ok'], devuelta: ['Devuelta', 'c-warn'] };
  GS.ESTADO_SOL = ESTADO_SOL;
  function vistaCrear(yo) {
    const st = GS.ui.crear = GS.ui.crear || { modo: null };
    const mios = S().where('cursos', (k) => k.autorId === yo.id).sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
    const sols = S().where('solicitudes', (s) => s.tipo === 'ayuda' && s.personaId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    let form = '';
    if (st.modo === 'ayuda') {
      const a = GS.ui.ayuda = GS.ui.ayuda || { tema: '', objetivo: '', material: '', paraCuando: '' };
      form = html`<form class="card card-pad stack" data-submit="pedir-ayuda" style="gap:18px;max-width:860px">
        ${st.enviada ? html`<div class="notice" role="status">Tu solicitud llegó a la bandeja de RRHH. Te contactarán para armar el curso contigo.</div>` : ''}
        <div><label class="label" for="h-tema">Tema del curso</label><input id="h-tema" class="input" data-bind="ayuda.tema" value="${a.tema}" required maxlength="120"></div>
        <div><label class="label" for="h-obj">¿Qué debería saber hacer la persona al terminarlo?</label><textarea id="h-obj" class="input" rows="3" data-bind="ayuda.objetivo" required maxlength="1000">${a.objetivo}</textarea></div>
        ${C.alcance('ayuda.alcance', 'Destinado a')}
        <div><label class="label" for="h-mat">Material que ya tienes (link, opcional)</label><input id="h-mat" class="input" type="url" placeholder="https://" data-bind="ayuda.material" value="${a.material}"></div>
        <div style="max-width:260px"><label class="label" for="h-f">¿Para cuándo lo necesitas?</label><input id="h-f" class="input" type="date" min="${GS.hoy()}" data-bind="ayuda.paraCuando" value="${a.paraCuando}"></div>
        <button class="btn self-start" type="submit">Enviar solicitud a RRHH</button>
      </form>`;
    } else if (st.modo === 'solo') {
      form = html`<div class="card card-pad stack" style="max-width:860px">
        <p style="margin:0">Arma el curso paso a paso: datos y público, módulos con sus links, quiz y configuración. Se guarda como borrador mientras trabajas y, al terminar, se envía a revisión de RRHH antes de publicarse.</p>
        <button type="button" class="btn self-start" data-action="nuevo-curso">Empezar a crear el curso</button>
      </div>`;
    }
    return html`<div class="stack" style="gap:22px">
      <div class="grid-2">
        <button type="button" class="choice" aria-pressed="${String(st.modo === 'ayuda')}" data-action="crear-modo" data-v="ayuda"><span class="choice-t">Pedir ayuda a RRHH</span><span class="choice-d">Cuéntale qué necesitas y el material que tienes. RRHH arma el curso contigo.</span></button>
        <button type="button" class="choice" aria-pressed="${String(st.modo === 'solo')}" data-action="crear-modo" data-v="solo"><span class="choice-t">Crearlo yo</span><span class="choice-d">Arma los módulos tú mismo. Antes de publicarse, RRHH lo revisa.</span></button>
      </div>
      ${form}
      <div class="stack">
        <h2 class="h2">Cursos que has creado</h2>
        ${mios.length ? html`<div class="card table-wrap"><table>
          <thead><tr><th>Curso</th><th>Estado</th><th>Comentario de revisión</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>${mios.map((k) => html`<tr><td class="strong">${k.titulo || 'Sin título'}</td><td>${C.chipCurso(k.estado)}</td><td class="muted">${k.nota || '—'}</td>
            <td class="actions">${['borrador', 'devuelto'].includes(k.estado) ? html`<a class="btn2 btn-sm" href="#/editor/${k.id}">Editar</a>` : html`<a class="btn2 btn-sm" href="#/curso/${k.id}">Ver</a>`}</td></tr>`)}</tbody>
        </table></div>` : html`<p class="muted" style="margin:0">Aún no has creado cursos.</p>`}
      </div>
      ${sols.length ? html`<div class="stack"><h2 class="h2">Solicitudes de ayuda</h2>${sols.map((s) => html`<div class="list-item">
        <div><strong class="strong">${s.datos.tema}</strong><div class="muted xs">${s.nota || 'Enviada el ' + GS.fecha(s.fecha)}</div></div>
        <span class="chip ${ESTADO_SOL[s.estado][1]}">${ESTADO_SOL[s.estado][0]}</span></div>`)}</div>` : ''}
    </div>`;
  }
  GS.accion('crear-modo', (el) => { GS.ui.crear.modo = el.dataset.v; GS.ui.crear.enviada = false; });
  GS.accion('pedir-ayuda', async () => {
    const a = GS.ui.ayuda;
    const alc = C.alcanceEstado('ayuda.alcance');
    if (!String(a.tema).trim() || !String(a.objetivo).trim()) throw new Error('Completa el tema y lo que la persona debería saber hacer.');
    if (!C.alcanceCompleto(alc)) throw new Error('Elige al menos un edificio y un cargo.');
    if (a.material && !GS.urlSegura(a.material)) throw new Error('El link del material debe empezar con https://');
    await S().add('solicitudes', { tipo: 'ayuda', personaId: GS.yo().id, fecha: GS.hoy(), estado: 'pendiente', nota: '', datos: { tema: a.tema.trim(), objetivo: a.objetivo.trim(), alcance: alc, material: a.material.trim(), paraCuando: a.paraCuando } });
    delete GS.ui.ayuda;
    GS.ui.crear.enviada = true;
  }, { escribe: true });

  // Crea un borrador vacío y abre el editor. Lo usan jefaturas y administración.
  GS.accion('nuevo-curso', async () => {
    const yo = GS.yo();
    const ahora = GS.ahora();
    const k = await S().add('cursos', {
      titulo: '', descripcion: '', categoria: 'herramientas', portada: '#0A2245', autorId: yo.id, estado: 'borrador', nota: '', version: 1,
      alcance: yo.rol === 'admin' ? { edificios: 'todos', cargos: 'todos' } : { edificios: [GS.lugarDe(yo)], cargos: 'todos' },
      modulos: [], config: { orden: 'sec', notaMinima: 70, intentos: 0, duracion: '', certificado: true },
      creadoEn: ahora, actualizadoEn: ahora, publicadoEn: null
    });
    delete GS.ui.editor;
    GS.ir('#/editor/' + k.id);
    return false;
  }, { escribe: true });

  // ---------- Capacitación presencial ----------
  function vistaPresencial(yo, ctxEq) {
    const st = GS.ui.pres = GS.ui.pres || { modo: 'conv' };
    const catalogo = S().all('presencialCatalogo');
    const equipo = ctxEq.personas;
    const mias = S().where('convocatorias', (c) => c.convocadoPor === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    let izq, der = '';
    if (st.modo === 'conv') {
      const f = GS.ui.conv = GS.ui.conv || { presencialId: catalogo[0] ? catalogo[0].id : '', fecha: '', hora: '', lugar: '', sel: [] };
      const sel = S().get('presencialCatalogo', f.presencialId);
      izq = html`<form class="card card-pad stack side" data-submit="convocar" style="gap:16px;flex:1 1 380px">
        <h2 class="h2">Nueva convocatoria</h2>
        <div><label class="label" for="c-n">Capacitación del catálogo</label>
          <select id="c-n" class="input" data-bind="conv.presencialId" data-rerender>${C.opciones(catalogo.map((k) => [k.id, k.titulo]), f.presencialId)}</select></div>
        ${sel ? html`<div class="small" style="background:var(--fondo);border-radius:var(--radio);padding:12px 14px;display:flex;flex-direction:column;gap:4px">
          <span><strong class="strong">Relator:</strong> ${sel.relator}</span><span><strong class="strong">Duración:</strong> ${sel.duracion}</span><span><strong class="strong">Para:</strong> ${sel.para}</span></div>` : ''}
        <div class="grid-form" style="grid-template-columns:repeat(2,minmax(0,1fr))">
          <div><label class="label" for="c-f">Fecha</label><input id="c-f" class="input" type="date" data-bind="conv.fecha" value="${f.fecha}" data-rerender required></div>
          <div><label class="label" for="c-h">Hora</label><input id="c-h" class="input" type="time" data-bind="conv.hora" value="${f.hora}" required></div>
        </div>
        <div><label class="label" for="c-l">Lugar</label><input id="c-l" class="input" data-bind="conv.lugar" value="${f.lugar}" required maxlength="120"></div>
        <fieldset class="stack-sm" style="gap:0"><legend class="label">Convocados</legend>
          ${equipo.map((p) => html`<label class="check"><input type="checkbox" data-action="conv-persona" data-id="${p.id}"${GS.attr(f.sel.includes(p.id), 'checked')}>${p.nombre}</label>`)}</fieldset>
        ${f.fecha && f.fecha < GS.hoy() ? html`<div class="notice">Esta fecha ya pasó: se registrará como capacitación realizada y luego marcas quiénes asistieron.</div>` : html`<p class="muted small" style="margin:0">¿Ya se hizo? Elige la fecha en que fue y podrás registrarla con su asistencia.</p>`}
        <button class="btn self-start" type="submit"${GS.attr(!f.sel.length, 'disabled')}>${f.fecha && f.fecha < GS.hoy() ? 'Registrar capacitación realizada' : 'Enviar convocatoria'}</button>
      </form>`;
      der = html`<div class="grow stack">
        <h2 class="h2">Convocatorias</h2>
        ${mias.length ? mias.map((c) => {
          const k = S().get('presencialCatalogo', c.presencialId);
          const asis = c.asistencia ? Object.values(c.asistencia).filter(Boolean).length : 0;
          const marcando = GS.ui.marcar && GS.ui.marcar.id === c.id;
          return html`<div class="card card-pad-sm stack-sm${marcando ? ' card-focus' : ''}">
            <div class="row" style="justify-content:space-between"><strong class="strong" style="font-size:17px">${k ? k.titulo : 'Capacitación'}</strong>
              <span class="chip ${c.asistencia ? 'c-done' : 'c-warn'}">${c.asistencia ? 'Asistencia: ' + asis + ' de ' + c.convocados.length : 'Pendiente de asistencia'}</span></div>
            <span class="muted small">${GS.fecha(c.fecha, true)} · ${c.hora} · ${c.lugar}</span>
            <span class="muted small">Relator: ${k ? k.relator : '—'} · ${GS.plural(c.convocados.length, 'convocado', 'convocados')}</span>
            ${marcando ? html`<form class="stack-sm" data-submit="guardar-asistencia" style="gap:0;margin-top:6px">
                ${c.convocados.map((pid) => html`<label class="check"><input type="checkbox" name="p" value="${pid}"${GS.attr(c.asistencia ? c.asistencia[pid] : true, 'checked')}>${GS.nombreDe(pid)}</label>`)}
                <div class="row" style="margin-top:8px"><button class="btn btn-sm" type="submit">Guardar asistencia</button><button type="button" class="btn2 btn-sm" data-action="marcar" data-id="">Cancelar</button></div>
              </form>`
              : html`<button type="button" class="btn2 btn-sm self-start" data-action="marcar" data-id="${c.id}" style="margin-top:4px">${c.asistencia ? 'Corregir asistencia' : 'Marcar asistencia'}</button>`}
          </div>`;
        }) : html`<p class="muted" style="margin:0">Aún no has convocado capacitaciones.</p>`}
      </div>`;
    } else {
      const f = GS.ui.propPres = GS.ui.propPres || { tema: '', porque: '', para: 'equipo', relator: '', fechaTentativa: '', costo: '' };
      const propias = S().where('solicitudes', (s) => s.tipo === 'presencial' && s.personaId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
      izq = html`<form class="card card-pad stack" data-submit="proponer-presencial" style="gap:18px;flex:1 1 100%">
        <h2 class="h2">Proponer una capacitación presencial</h2>
        ${st.enviada ? html`<div class="notice" role="status">Tu propuesta llegó a la bandeja de RRHH. La verás abajo como "Recibida".</div>` : ''}
        <div><label class="label" for="pp-t">Tema</label><input id="pp-t" class="input" placeholder="Ej: comunicación efectiva" data-bind="propPres.tema" value="${f.tema}" required maxlength="120"></div>
        <div><label class="label" for="pp-p">¿Por qué la necesitan?</label><textarea id="pp-p" class="input" rows="3" placeholder="Qué situación quieres mejorar" data-bind="propPres.porque" required maxlength="1000">${f.porque}</textarea></div>
        <fieldset class="stack-sm" style="gap:0"><legend class="label">¿Para quién?</legend>
          <label class="check"><input type="radio" name="pp-para" value="equipo" data-bind="propPres.para" data-rerender${GS.attr(f.para === 'equipo', 'checked')}>Para mi equipo (${GS.unidadDe(yo)})</label>
          <label class="check"><input type="radio" name="pp-para" value="otro" data-bind="propPres.para" data-rerender${GS.attr(f.para === 'otro', 'checked')}>Para otro grupo (por ejemplo, todos los BM)</label></fieldset>
        ${f.para === 'otro' ? C.alcance('propPres.alcance', 'Dirigida a') : ''}
        <div class="grid-form">
          <div><label class="label" for="pp-r">Relator sugerido (opcional)</label><input id="pp-r" class="input" placeholder="Persona, empresa o área" data-bind="propPres.relator" value="${f.relator}" maxlength="120"></div>
          <div><label class="label" for="pp-f">Fecha tentativa (opcional)</label><input id="pp-f" class="input" type="month" data-bind="propPres.fechaTentativa" value="${f.fechaTentativa}"></div>
          <div><label class="label" for="pp-c">Costo estimado (opcional)</label><input id="pp-c" class="input" placeholder="$" data-bind="propPres.costo" value="${f.costo}" maxlength="30"></div>
        </div>
        <button class="btn self-start" type="submit">Enviar propuesta a RRHH</button>
        <div class="stack" style="border-top:1px solid var(--borde);padding-top:16px;gap:10px">
          <h3 class="h3">Mis propuestas presenciales</h3>
          ${propias.length ? propias.map((s) => html`<div class="list-item"><div><strong class="strong">${s.datos.tema}</strong><div class="muted xs">${s.nota || 'Enviada el ' + GS.fecha(s.fecha)}</div></div>
            <span class="chip ${ESTADO_SOL[s.estado][1]}">${ESTADO_SOL[s.estado][0]}</span></div>`) : html`<p class="muted" style="margin:0">Aún no has propuesto capacitaciones presenciales.</p>`}
        </div>
      </form>`;
    }
    return html`<div class="stack" style="gap:22px">
      <div class="grid-2">
        <button type="button" class="choice" aria-pressed="${String(st.modo === 'conv')}" data-action="pres-modo" data-v="conv"><span class="choice-t">Convocar a una capacitación existente</span><span class="choice-d">Ya está en el catálogo (por ejemplo, rescate en ascensores). Eliges fecha, lugar y a quiénes convocas.</span></button>
        <button type="button" class="choice" aria-pressed="${String(st.modo === 'prop')}" data-action="pres-modo" data-v="prop"><span class="choice-t">Proponer una nueva</span><span class="choice-d">Una capacitación que todavía no existe, para tu equipo u otro grupo. La revisa RRHH.</span></button>
      </div>
      <div class="split">${izq}${der}</div>
    </div>`;
  }
  GS.accion('pres-modo', (el) => { GS.ui.pres.modo = el.dataset.v; GS.ui.pres.enviada = false; });
  GS.accion('conv-persona', (el) => { const s = GS.ui.conv.sel; const i = s.indexOf(el.dataset.id); if (el.checked && i < 0) s.push(el.dataset.id); if (!el.checked && i >= 0) s.splice(i, 1); });
  GS.accion('convocar', async () => {
    const f = GS.ui.conv;
    if (!f.fecha || !f.hora || !String(f.lugar).trim()) throw new Error('Completa fecha, hora y lugar.');
    if (!f.sel.length) throw new Error('Elige al menos a una persona.');
    const pasada = f.fecha < GS.hoy();
    const c = await S().add('convocatorias', { presencialId: f.presencialId, fecha: f.fecha, hora: f.hora, lugar: f.lugar.trim(), convocados: f.sel.slice(), asistencia: null, convocadoPor: GS.yo().id, creadoEn: GS.ahora() });
    delete GS.ui.conv;
    // Capacitación que ya se hizo: se abre de inmediato para marcar la asistencia.
    if (pasada) GS.ui.marcar = { id: c.id };
    GS.toast(pasada ? 'Capacitación registrada. Ahora marca quiénes asistieron.' : 'Convocatoria enviada. Las personas la verán en su perfil.');
  }, { escribe: true });
  GS.accion('marcar', (el) => { GS.ui.marcar = el.dataset.id ? { id: el.dataset.id } : null; });
  GS.accion('guardar-asistencia', async (form, ev, fd) => {
    const c = S().get('convocatorias', GS.ui.marcar.id);
    const presentes = fd.getAll('p');
    const asistencia = {};
    c.convocados.forEach((pid) => { asistencia[pid] = presentes.includes(pid); });
    await S().update('convocatorias', c.id, { asistencia });
    GS.ui.marcar = null;
    GS.toast('Asistencia guardada.');
  }, { escribe: true });
  GS.accion('proponer-presencial', async () => {
    const f = GS.ui.propPres;
    if (!String(f.tema).trim() || !String(f.porque).trim()) throw new Error('Completa el tema y por qué la necesitan.');
    let alcance = null;
    if (f.para === 'otro') { alcance = C.alcanceEstado('propPres.alcance'); if (!C.alcanceCompleto(alcance)) throw new Error('Elige al menos un edificio y un cargo.'); }
    await S().add('solicitudes', { tipo: 'presencial', personaId: GS.yo().id, fecha: GS.hoy(), estado: 'pendiente', nota: '', datos: { tema: f.tema.trim(), porque: f.porque.trim(), para: f.para, alcance, relator: f.relator.trim(), fechaTentativa: f.fechaTentativa, costo: f.costo.trim() } });
    delete GS.ui.propPres;
    GS.ui.pres.enviada = true;
  }, { escribe: true });
})(window.GS);
