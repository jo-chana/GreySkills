// Pantallas personales: ingreso provisional, Mis cursos, Explorador, Proponer cursos y Mi perfil.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;

  // ---------- Ingreso provisional ----------
  // Sin contraseña: se elige a una persona de la lista. Se reemplaza por RUT y contraseña en la etapa 6.
  GS.vistas.ingreso = {
    titulo: 'Ingreso',
    render() {
      const q = GS.normalizar((GS.ui.ingreso || {}).q || '');
      const orden = ['admin', 'gerente', 'jefatura', 'visualizador', 'trabajador'];
      const personas = GS.personasActivas()
        .filter((p) => !q || GS.normalizar(p.nombre + ' ' + p.rut + ' ' + GS.cargoDe(p) + ' ' + GS.unidadDe(p)).includes(q))
        .sort((a, b) => orden.indexOf(a.rol) - orden.indexOf(b.rol) || a.nombre.localeCompare(b.nombre, 'es'));
      return html`<div class="login">
        <div class="login-hero">
          <div class="brand"><span class="brand-name" style="font-size:26px">Grey Skills</span><span class="brand-tag">Greystar Chile</span></div>
          <div style="max-width:460px"><h1>Aprende algo nuevo para tu día a día.</h1><p>Tus cursos, los que te asignaron y los que eliges tú, en un solo lugar.</p></div>
          <div class="login-line"></div>
        </div>
        <div class="login-side"><div class="login-box">
          <h2 class="h2" style="font-size:28px">Ingresa</h2>
          <div class="notice">Acceso provisional para pruebas: elige con qué persona quieres entrar. Cada rol ve la plataforma distinta. El ingreso con RUT y contraseña se agrega más adelante.</div>
          <div><label class="label" for="ingreso-q">Buscar persona</label>
            <input id="ingreso-q" class="input" type="search" placeholder="Nombre, RUT, cargo o edificio" value="${(GS.ui.ingreso || {}).q || ''}" data-bind="ingreso.q" data-input="refrescar"></div>
          <div class="login-list">
            ${personas.length ? personas.map((p) => html`<button type="button" class="login-person" data-action="entrar" data-id="${p.id}">
              <span class="avatar" aria-hidden="true">${GS.iniciales(p.nombre)}</span>
              <span class="login-person-txt"><span>${p.nombre}</span><span>${GS.cargoDe(p)} · ${GS.unidadDe(p)}</span></span>
              <span class="chip c-suave">${GS.ROLES[p.rol]}</span>
            </button>`) : html`<p class="muted">No hay personas que coincidan.</p>`}
          </div>
        </div></div>
      </div>`;
    }
  };
  GS.accion('refrescar', () => {});
  GS.accion('entrar', (el) => { GS.sesion.entrar(el.dataset.id); GS.ui = {}; const p = GS.persona(el.dataset.id); GS.ir(p.rol === 'admin' ? '#/admin' : '#/cursos'); return false; });

  // ---------- Mis cursos ----------
  GS.vistas.cursos = {
    titulo: 'Mis cursos',
    render({ yo }) {
      const todas = GS.insDe(yo.id);
      const asignadas = todas.filter((i) => i.origen === 'asignado');
      const pendAsig = asignadas.filter((i) => !i.completadoEn).sort((a, b) => (a.plazo || '9999').localeCompare(b.plazo || '9999'));
      const pendInsc = todas.filter((i) => i.origen === 'inscrito' && !i.completadoEn);
      const completados = todas.filter((i) => i.completadoEn);
      const avg = asignadas.length ? Math.round(asignadas.reduce((a, i) => a + GS.avance(i), 0) / asignadas.length) : 0;
      const nComp = asignadas.filter((i) => i.completadoEn).length;
      const porVencer = pendAsig.filter((i) => GS.estado(i) === 'warn').length;
      const vencidos = pendAsig.filter((i) => GS.estado(i) === 'late').length;

      return html`<section class="stack-lg">
        <div class="row-between">
          <div><h1 class="h1">Hola, ${GS.primerNombre(yo.nombre)}</h1><p class="lead">${pendAsig.length + pendInsc.length ? 'Esto es lo que tienes pendiente.' : 'No tienes cursos pendientes. ¡Bien!'}</p></div>
          <div class="row">
            <span class="chip chip-lg c-blanco">${pendAsig.length + pendInsc.length} en curso</span>
            <span class="chip chip-lg c-warn">${porVencer} por vencer</span>
            <span class="chip chip-lg ${vencidos ? 'c-late' : 'c-suave'}">${GS.plural(vencidos, 'vencido', 'vencidos')}</span>
          </div>
        </div>

        ${asignadas.length ? html`<div class="card card-pad row" style="gap:20px 32px">
          <div class="stack-sm" style="gap:2px;flex:0 0 auto"><span class="kpi-big">${avg}%</span><span class="muted xs strong">avance de tus cursos asignados</span></div>
          <div class="stack-sm" style="flex:1 1 320px">
            <div class="bar bar-lg"><span style="width:${avg}%"></span></div>
            <span class="muted" style="font-size:15px">Promedio de los ${GS.plural(asignadas.length, 'curso que te asignaron', 'cursos que te asignaron')}: ${nComp} ${nComp === 1 ? 'completado' : 'completados'} y ${pendAsig.length} en curso. Los cursos que tomas por tu cuenta no cuentan aquí.</span>
          </div>
        </div>` : ''}

        <div class="stack">
          <h2 class="h2">Asignados por tu jefatura</h2>
          ${pendAsig.length ? html`<div class="grid-cards">${pendAsig.map(C.tarjetaMiCurso)}</div>`
            : C.vacio(asignadas.length ? 'Completaste todos los cursos que te asignaron.' : 'Todavía no tienes cursos asignados.')}
        </div>

        <div class="stack">
          <h2 class="h2">Inscritos por ti</h2>
          <div class="grid-cards">
            ${pendInsc.map(C.tarjetaMiCurso)}
            <a class="add-card" href="#/explorar">Buscar más cursos en el explorador</a>
          </div>
        </div>

        ${completados.length ? html`<p class="muted" style="margin:0">Has completado ${GS.plural(completados.length, 'curso', 'cursos')}. Tus certificados están en <a href="#/perfil">Mi perfil</a>.</p>` : ''}
      </section>`;
    }
  };

  // ---------- Explorador ----------
  GS.vistas.explorar = {
    titulo: 'Explorador de cursos',
    render({ yo }) {
      const st = GS.ui.explorar = GS.ui.explorar || { q: '', cat: 'todos' };
      const q = GS.normalizar(st.q);
      const lista = GS.cursosPublicados()
        .filter((k) => GS.visiblePara(k, yo))
        .filter((k) => st.cat === 'todos' || k.categoria === st.cat)
        .filter((k) => !q || GS.normalizar(k.titulo + ' ' + k.descripcion + ' ' + GS.categoriaL(k.categoria)).includes(q))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      const cats = [['todos', 'Todos']].concat(GS.CATEGORIAS.map((c) => [c.id, c.l]));
      return html`<section class="stack-lg">
        <div><h1 class="h1">Explorador de cursos</h1><p class="lead">Cursos abiertos para todos y los que corresponden a tu cargo. Te inscribes cuando quieras.</p></div>
        <div class="row" style="gap:12px">
          <div class="searchbar"><label class="sr-only" for="explorar-q">Buscar curso</label>
            <input id="explorar-q" class="input" type="search" placeholder="Buscar por nombre o tema" value="${st.q}" data-bind="explorar.q" data-input="refrescar"></div>
          ${C.segmentos(cats, st.cat, 'explorar-cat')}
        </div>
        ${lista.length ? html`<div class="grid-cards-lg">${lista.map((k) => {
          const ins = GS.ins(yo.id, k.id);
          const para = GS.esParaTodos(k.alcance);
          let boton;
          if (!ins) boton = html`<button type="button" class="btn self-start mt-auto" data-action="inscribir" data-id="${k.id}">Inscribirme</button>`;
          else if (ins.completadoEn) boton = html`<a class="btn2 self-start mt-auto" href="#/curso/${k.id}">Completado · repasar</a>`;
          else boton = html`<a class="btn2 self-start mt-auto" href="#/curso/${k.id}" style="border-color:var(--verde);color:var(--verde)">${ins.origen === 'asignado' ? 'Asignado' : 'Inscrito'} · ir al curso</a>`;
          return html`<article class="card card-pad-sm stack" style="padding:22px">
            <div class="row" style="justify-content:space-between"><span class="chip ${para ? 'c-sky' : 'c-none'}">${para ? 'Para todos' : 'Para tu cargo'}</span><span class="muted xs">${C.metaCurso(k)}</span></div>
            <h3 class="h3">${k.titulo}</h3>
            <p class="muted" style="margin:0;font-size:15px;line-height:1.5">${k.descripcion}</p>
            ${boton}
          </article>`;
        })}</div>` : C.vacio('No encontramos cursos con ese filtro.')}
      </section>`;
    }
  };
  GS.accion('explorar-cat', (el) => { GS.ui.explorar.cat = el.dataset.v; });
  GS.accion('inscribir', async (el) => {
    const yo = GS.yo();
    if (GS.ins(yo.id, el.dataset.id)) return;
    await S().add('inscripciones', GS.ops.nuevaInscripcion(yo.id, el.dataset.id, 'inscrito', null, null));
    GS.toast('Listo, quedaste inscrito. Lo verás en "Mis cursos".');
  }, { escribe: true });

  // ---------- Proponer cursos ----------
  const ESTADO_PROP = { revision: ['En revisión', 'c-sky'], aceptada: ['Aceptada', 'c-ok'], rechazada: ['No aprobada', 'c-gris'] };
  GS.vistas.proponer = {
    titulo: 'Proponer cursos',
    render({ yo }) {
      const mias = S().where('propuestas', (p) => p.personaId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const enviada = GS.ui.propEnviada;
      return html`<section class="stack-lg">
        <div><h1 class="h1">Proponer un curso</h1><p class="lead">¿Echas de menos algo que te ayudaría en tu trabajo? Cuéntanos. El equipo de RRHH revisa cada propuesta.</p></div>
        <div class="split">
          <form class="card card-pad stack grow" data-submit="proponer" style="gap:18px">
            ${enviada ? html`<div class="notice" role="status">Tu propuesta llegó a RRHH. Verás la respuesta en "Mis propuestas".</div>` : ''}
            <div><label class="label" for="p-tema">¿Qué te gustaría aprender?</label><input id="p-tema" name="tema" class="input" placeholder="Ej: primeros auxilios básicos" required maxlength="120"></div>
            <div><label class="label" for="p-por">¿Por qué te serviría?</label><textarea id="p-por" name="porque" class="input" rows="4" placeholder="Cuéntanos en qué situación lo usarías" required maxlength="1000"></textarea></div>
            <div><label class="label" for="p-para">¿Para quién sería?</label>
              <select id="p-para" name="para" class="input"><option>Para todos</option><option>Para mi cargo</option><option>Para otro cargo</option></select></div>
            <div><label class="label" for="p-quien">¿Conoces a alguien que podría enseñarlo? (opcional)</label><input id="p-quien" name="quien" class="input" placeholder="Nombre o área" maxlength="120"></div>
            <button class="btn self-start" type="submit">Enviar propuesta</button>
          </form>
          <div class="side stack">
            <h2 class="h2">Mis propuestas</h2>
            ${mias.length ? mias.map((x) => html`<div class="card card-pad-sm stack-sm">
              <div class="row" style="justify-content:space-between"><strong class="strong">${x.tema}</strong><span class="chip ${ESTADO_PROP[x.estado][1]}">${ESTADO_PROP[x.estado][0]}</span></div>
              <span class="muted small">${x.nota ? x.nota : 'Enviada el ' + GS.fecha(x.fecha)}</span>
            </div>`) : html`<p class="muted" style="margin:0">Aún no has enviado propuestas.</p>`}
          </div>
        </div>
      </section>`;
    }
  };
  GS.accion('proponer', async (form, ev, fd) => {
    const tema = String(fd.get('tema') || '').trim();
    const porque = String(fd.get('porque') || '').trim();
    if (!tema || !porque) throw new Error('Completa qué te gustaría aprender y por qué te serviría.');
    await S().add('propuestas', { personaId: GS.yo().id, tema, porque, para: fd.get('para'), quien: String(fd.get('quien') || '').trim(), estado: 'revision', nota: '', fecha: GS.hoy() });
    GS.ui.propEnviada = true;
    form.reset();
  }, { escribe: true });

  // ---------- Mi perfil ----------
  GS.vistas.perfil = {
    titulo: 'Mi perfil',
    render({ yo }) {
      const realizados = GS.insDe(yo.id).filter((i) => i.completadoEn).sort((a, b) => b.completadoEn.localeCompare(a.completadoEn));
      const presenciales = S().where('convocatorias', (c) => c.asistencia && c.asistencia[yo.id]).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const proximas = S().where('convocatorias', (c) => !c.asistencia && c.convocados.includes(yo.id) && c.fecha >= GS.hoy());
      const jefe = yo.jefeId ? GS.persona(yo.jefeId) : null;
      return html`<section class="stack-lg">
        <h1 class="h1">Mi perfil</h1>
        <div class="split">
          <div class="card card-pad stack side" style="gap:16px">
            <div class="row" style="gap:14px"><span class="avatar avatar-lg" aria-hidden="true">${GS.iniciales(yo.nombre)}</span>
              <div><div class="strong" style="font-size:20px">${yo.nombre}</div><div class="muted" style="font-size:15px">${GS.cargoDe(yo)}</div></div></div>
            <dl style="margin:0;display:grid;grid-template-columns:max-content 1fr;gap:10px 16px;font-size:15px">
              <dt class="muted">RUT</dt><dd style="margin:0">${yo.rut}</dd>
              <dt class="muted">Unidad</dt><dd style="margin:0">${GS.unidadDe(yo)}</dd>
              <dt class="muted">Jefatura</dt><dd style="margin:0">${jefe ? jefe.nombre + ', ' + GS.cargoDe(jefe) : '—'}</dd>
              <dt class="muted">Rol</dt><dd style="margin:0">${GS.ROLES[yo.rol]}</dd>
            </dl>
            <div class="row"><button type="button" class="btn2" data-action="cambiar-persona">Cerrar sesión</button></div>
          </div>
          <div class="grow stack-lg" style="gap:20px">
            ${proximas.length ? html`<div class="stack"><h2 class="h2">Próximas capacitaciones presenciales</h2>${proximas.map((c) => {
              const k = S().get('presencialCatalogo', c.presencialId);
              return html`<div class="card card-pad-sm"><div class="strong">${k ? k.titulo : 'Capacitación'}</div><div class="muted small">${GS.fecha(c.fecha, true)} · ${c.hora} · ${c.lugar}</div></div>`;
            })}</div>` : ''}
            <div class="stack">
              <h2 class="h2">Cursos realizados</h2>
              ${realizados.length ? realizados.map((i) => {
                const k = GS.curso(i.cursoId);
                return html`<div class="card card-pad-sm row" style="justify-content:space-between">
                  <div><div class="strong" style="font-size:16px">${k.titulo}</div><div class="muted small">Completado el ${GS.fecha(i.completadoEn, true)}</div></div>
                  ${k.config.certificado ? html`<a class="btn2 btn-sm" href="#/certificado/${i.id}">Ver certificado</a>` : ''}
                </div>`;
              }) : html`<p class="muted" style="margin:0">Cuando termines un curso aparecerá aquí con su certificado.</p>`}
            </div>
            <div class="stack">
              <h2 class="h2">Capacitaciones presenciales</h2>
              ${presenciales.length ? presenciales.map((c) => {
                const k = S().get('presencialCatalogo', c.presencialId);
                return html`<div class="card card-pad-sm row" style="justify-content:space-between">
                  <div><div class="strong" style="font-size:16px">${k ? k.titulo : 'Capacitación'}</div><div class="muted small">${GS.fecha(c.fecha, true)} · ${c.lugar}</div></div>
                  <span class="chip c-done">Asististe</span>
                </div>`;
              }) : html`<p class="muted" style="margin:0">Aún no registras asistencia a capacitaciones presenciales.</p>`}
            </div>
          </div>
        </div>
      </section>`;
    }
  };
})(window.GS);
