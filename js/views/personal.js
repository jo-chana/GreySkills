// Pantallas personales: ingreso provisional, Mis cursos, Explorador, Proponer cursos y Mi perfil.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;

  // ---------- Ingreso provisional ----------
  // Clave común y luego se elige una vista (un usuario genérico por rol). Se reemplaza por RUT y contraseña en la etapa 6.
  GS.vistas.ingreso = {
    titulo: GS.t('Ingreso'),
    render() {
      const bloqueado = GS.CLAVE_HASH && !GS.sesion.get().acceso;
      return html`<div class="login">
        <div class="login-hero">
          <div class="brand"><span class="brand-name" style="font-size:26px">Grey Skills</span><span class="brand-tag">Greystar Chile</span></div>
          <div style="max-width:460px"><h1>${GS.t('Aprende algo nuevo para tu día a día.')}</h1><p>${GS.t('Tus cursos, los que te asignaron y los que eliges tú, en un solo lugar.')}</p></div>
          <div class="login-line"></div>
        </div>
        <div class="login-side"><div class="login-box">
          ${GS.botonIdioma(true)}
          <h2 class="h2" style="font-size:28px">${GS.t('Ingresa')}</h2>
          ${GS.auth.activo() ? formIngresoRut() : bloqueado ? html`<div class="notice">${GS.t('Acceso provisional para pruebas. Escribe la clave de acceso.')}</div>
          <form data-submit="clave" class="stack-sm">
            <div><label class="label" for="ingreso-clave">${GS.t('Clave de acceso')}</label>
              <input id="ingreso-clave" class="input" type="password" name="clave" autocomplete="current-password" required></div>
            <button class="btn self-start" type="submit">${GS.t('Continuar')}</button>
          </form>` : html`<div class="notice">${GS.t('Acceso provisional para pruebas: elige una vista. Cada una entra con un usuario genérico de ese rol y su equipo de prueba. El ingreso con RUT y contraseña se agrega más adelante.')}</div>
          <div class="login-list">
            ${GS.VISTAS.filter((v) => GS.persona(v.id)).map((v) => html`<button type="button" class="login-person" data-action="entrar" data-id="${v.id}">
              <span class="avatar" aria-hidden="true">${GS.iniciales(GS.ROLES[v.rol])}</span>
              <span class="login-person-txt"><span>${GS.ROLES[v.rol]}</span><span>${v.d}</span></span>
            </button>`)}
          </div>`}
        </div></div>
      </div>`;
    }
  };
  function formIngresoRut() {
    const st = GS.ui.ingreso || {};
    return html`${st.msg ? html`<div class="notice">${st.msg}</div>` : ''}
    <form data-submit="ingresar-rut" class="stack-sm">
      <div><label class="label" for="ingreso-rut">RUT</label>
        <input id="ingreso-rut" class="input" name="rut" value="${st.rut || ''}" data-bind="ingreso.rut" placeholder="12.345.678-9" autocomplete="username" inputmode="text" required maxlength="12"></div>
      <div><label class="label" for="ingreso-clave">${GS.t('Clave')}</label>
        <input id="ingreso-clave" class="input" type="password" name="clave" autocomplete="current-password" required></div>
      <button class="btn self-start" type="submit">${GS.t('Ingresar')}</button>
    </form>
    <p class="muted small" style="margin:0">${GS.t('¿Olvidaste tu clave o es tu primera vez? Pídele a tu jefatura que te entregue una clave provisoria.')}</p>`;
  }
  GS.accion('ingresar-rut', async (f, ev, datos) => {
    try { await GS.auth.ingresar(datos.get('rut'), datos.get('clave')); }
    catch (e) { GS.ui.ingreso = Object.assign(GS.ui.ingreso || {}, { msg: e.message }); return; }
    location.reload();
    return false;
  });

  // Cambio obligatorio de la clave provisoria (primer ingreso o clave restablecida).
  GS.vistas.claveNueva = {
    render({ yo }) {
      return html`<div class="login">
        <div class="login-hero">
          <div class="brand"><span class="brand-name" style="font-size:26px">Grey Skills</span><span class="brand-tag">Greystar Chile</span></div>
          <div style="max-width:460px"><h1>${GS.t('Hola, {nombre}.', { nombre: GS.primerNombre(yo.nombre) })}</h1><p>${GS.t('Antes de empezar, crea una clave que solo tú conozcas.')}</p></div>
          <div class="login-line"></div>
        </div>
        <div class="login-side"><div class="login-box">
          ${GS.botonIdioma(true)}
          <h2 class="h2" style="font-size:28px">${GS.t('Crea tu clave')}</h2>
          <div class="notice">${GS.t('Entraste con una clave provisoria. Elige una nueva de al menos 8 caracteres. No la compartas con nadie, ni con tu jefatura.')}</div>
          ${formClave('clave-nueva', false)}
          <button type="button" class="btn2 self-start" data-action="cambiar-persona">${GS.t('Salir')}</button>
        </div></div>
      </div>`;
    }
  };
  function formClave(accion, pedirActual) {
    return html`<form data-submit="${accion}" class="stack-sm">
      ${pedirActual ? html`<div><label class="label" for="${accion}-a">${GS.t('Clave actual')}</label><input id="${accion}-a" class="input" type="password" name="actual" autocomplete="current-password" required></div>` : ''}
      <div><label class="label" for="${accion}-n">${GS.t('Clave nueva')}</label><input id="${accion}-n" class="input" type="password" name="nueva" autocomplete="new-password" minlength="8" required></div>
      <div><label class="label" for="${accion}-r">${GS.t('Repite la clave nueva')}</label><input id="${accion}-r" class="input" type="password" name="repetir" autocomplete="new-password" minlength="8" required></div>
      <button class="btn self-start" type="submit">${GS.t('Guardar clave')}</button>
    </form>`;
  }
  GS.accion('clave-nueva', async (f, ev, datos) => {
    await GS.auth.cambiarClave(null, datos.get('nueva'), datos.get('repetir'));
    GS.toast(GS.t('Listo, tu clave quedó guardada.'));
    GS.ir('#/cursos');
    return false;
  });
  GS.accion('clave-cambiar', async (f, ev, datos) => {
    await GS.auth.cambiarClave(datos.get('actual'), datos.get('nueva'), datos.get('repetir'));
    GS.ui.perfilClave = false;
    GS.toast(GS.t('Listo, tu clave quedó cambiada.'));
  });
  GS.accion('toggle-perfil-clave', () => { GS.ui.perfilClave = !GS.ui.perfilClave; });
  GS.accion('refrescar', () => {});
  GS.accion('clave', async (f, ev, datos) => {
    if (!(await GS.claveOk(datos.get('clave')))) { GS.toast(GS.t('Clave incorrecta.'), 'error'); return false; }
    GS.sesion.desbloquear();
  });
  GS.accion('entrar', (el) => { GS.sesion.entrar(el.dataset.id); GS.ui = {}; const p = GS.persona(el.dataset.id); GS.ir(p.rol === 'admin' ? '#/admin' : '#/cursos'); return false; });

  // ---------- Mis cursos ----------
  GS.vistas.cursos = {
    titulo: GS.t('Mis cursos'),
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
          <div><h1 class="h1">${GS.t('Hola, {nombre}', { nombre: GS.primerNombre(yo.nombre) })}</h1><p class="lead">${pendAsig.length + pendInsc.length ? GS.t('Esto es lo que tienes pendiente.') : GS.t('No tienes cursos pendientes. ¡Bien!')}</p></div>
          <div class="row">
            <span class="chip chip-lg c-blanco">${GS.t('{n} en curso', { n: pendAsig.length + pendInsc.length })}</span>
            <span class="chip chip-lg c-warn">${GS.t('{n} por vencer', { n: porVencer })}</span>
            <span class="chip chip-lg ${vencidos ? 'c-late' : 'c-suave'}">${GS.plural(vencidos, 'vencido', 'vencidos')}</span>
          </div>
        </div>

        ${asignadas.length ? html`<div class="card card-pad row" style="gap:20px 32px">
          <div class="stack-sm" style="gap:2px;flex:0 0 auto"><span class="kpi-big">${avg}%</span><span class="muted xs strong">${GS.t('avance de tus cursos asignados')}</span></div>
          <div class="stack-sm" style="flex:1 1 320px">
            <div class="bar bar-lg"><span style="width:${avg}%"></span></div>
            <span class="muted" style="font-size:15px">${GS.t('Promedio de los {cursos}: {completados} y {enCurso} en curso. Los cursos que tomas por tu cuenta no cuentan aquí.', { cursos: GS.plural(asignadas.length, 'curso que te asignaron', 'cursos que te asignaron'), completados: GS.plural(nComp, 'completado', 'completados'), enCurso: pendAsig.length })}</span>
          </div>
        </div>` : ''}

        <div class="stack">
          <h2 class="h2">${GS.t('Asignados por tu jefatura')}</h2>
          ${pendAsig.length ? html`<div class="grid-cards">${pendAsig.map(C.tarjetaMiCurso)}</div>`
            : C.vacio(asignadas.length ? GS.t('Completaste todos los cursos que te asignaron.') : GS.t('Todavía no tienes cursos asignados.'))}
        </div>

        <div class="stack">
          <h2 class="h2">${GS.t('Inscritos por ti')}</h2>
          <div class="grid-cards">
            ${pendInsc.map(C.tarjetaMiCurso)}
            <a class="add-card" href="#/explorar">${GS.t('Buscar más cursos en el explorador')}</a>
          </div>
        </div>

        ${completados.length ? html`<p class="muted" style="margin:0">${GS.t('Has completado {cursos}. Tus certificados están en {enlace}.', { cursos: GS.plural(completados.length, 'curso', 'cursos'), enlace: html`<a href="#/perfil">${GS.t('Mi perfil')}</a>` })}</p>` : ''}
      </section>`;
    }
  };

  // ---------- Explorador ----------
  GS.vistas.explorar = {
    titulo: GS.t('Explorador de cursos'),
    render({ yo }) {
      const st = GS.ui.explorar = GS.ui.explorar || { q: '', cat: 'todos' };
      const q = GS.normalizar(st.q);
      const lista = GS.cursosPublicados()
        .filter((k) => GS.visiblePara(k, yo))
        .filter((k) => st.cat === 'todos' || k.categoria === st.cat)
        .filter((k) => !q || GS.normalizar(k.titulo + ' ' + k.descripcion + ' ' + GS.categoriaL(k.categoria)).includes(q))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      const cats = [['todos', GS.t('Todos')]].concat(GS.CATEGORIAS.map((c) => [c.id, c.l]));
      return html`<section class="stack-lg">
        <div><h1 class="h1">${GS.t('Explorador de cursos')}</h1><p class="lead">${GS.t('Cursos abiertos para todos y los que corresponden a tu cargo. Te inscribes cuando quieras.')}</p></div>
        <div class="row" style="gap:12px">
          <div class="searchbar"><label class="sr-only" for="explorar-q">${GS.t('Buscar curso')}</label>
            <input id="explorar-q" class="input" type="search" placeholder="${GS.t('Buscar por nombre o tema')}" value="${st.q}" data-bind="explorar.q" data-input="refrescar"></div>
          ${C.segmentos(cats, st.cat, 'explorar-cat')}
        </div>
        ${lista.length ? html`<div class="grid-cards-lg">${lista.map((k) => {
          const ins = GS.ins(yo.id, k.id);
          const para = GS.esParaTodos(k.alcance);
          let boton;
          if (!ins) boton = html`<button type="button" class="btn self-start mt-auto" data-action="inscribir" data-id="${k.id}">${GS.t('Inscribirme')}</button>`;
          else if (ins.completadoEn) boton = html`<a class="btn2 self-start mt-auto" href="#/curso/${k.id}">${GS.t('Completado · repasar')}</a>`;
          else boton = html`<a class="btn2 self-start mt-auto" href="#/curso/${k.id}" style="border-color:var(--verde);color:var(--verde)">${ins.origen === 'asignado' ? GS.t('Asignado · ir al curso') : GS.t('Inscrito · ir al curso')}</a>`;
          return html`<article class="card card-pad-sm stack" style="padding:22px">
            <div class="row" style="justify-content:space-between"><span class="chip ${para ? 'c-sky' : 'c-none'}">${para ? GS.t('Para todos') : GS.t('Para tu cargo')}</span><span class="muted xs">${C.metaCurso(k)}</span></div>
            <h3 class="h3">${k.titulo}</h3>
            <p class="muted" style="margin:0;font-size:15px;line-height:1.5">${k.descripcion}</p>
            ${boton}
          </article>`;
        })}</div>` : C.vacio(GS.t('No encontramos cursos con ese filtro.'))}
      </section>`;
    }
  };
  GS.accion('explorar-cat', (el) => { GS.ui.explorar.cat = el.dataset.v; });
  GS.accion('inscribir', async (el) => {
    const yo = GS.yo();
    if (GS.ins(yo.id, el.dataset.id)) return;
    await S().add('inscripciones', GS.ops.nuevaInscripcion(yo.id, el.dataset.id, 'inscrito', null, null));
    GS.toast(GS.t('Listo, quedaste inscrito. Lo verás en "Mis cursos".'));
  }, { escribe: true });

  // ---------- Proponer cursos ----------
  const ESTADO_PROP = { revision: [GS.t('En revisión'), 'c-sky'], aceptada: [GS.t('Aceptada'), 'c-ok'], rechazada: [GS.t('No aprobada'), 'c-gris'] };
  GS.vistas.proponer = {
    titulo: GS.t('Proponer cursos'),
    render({ yo }) {
      const mias = S().where('propuestas', (p) => p.personaId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const enviada = GS.ui.propEnviada;
      return html`<section class="stack-lg">
        <div><h1 class="h1">${GS.t('Proponer un curso')}</h1><p class="lead">${GS.t('¿Echas de menos algo que te ayudaría en tu trabajo? Cuéntanos. El equipo de RRHH revisa cada propuesta.')}</p></div>
        <div class="split">
          <form class="card card-pad stack grow" data-submit="proponer" style="gap:18px">
            ${enviada ? html`<div class="notice" role="status">${GS.t('Tu propuesta llegó a RRHH. Verás la respuesta en "Mis propuestas".')}</div>` : ''}
            <div><label class="label" for="p-tema">${GS.t('¿Qué te gustaría aprender?')}</label><input id="p-tema" name="tema" class="input" placeholder="${GS.t('Ej: primeros auxilios básicos')}" required maxlength="120"></div>
            <div><label class="label" for="p-por">${GS.t('¿Por qué te serviría?')}</label><textarea id="p-por" name="porque" class="input" rows="4" placeholder="${GS.t('Cuéntanos en qué situación lo usarías')}" required maxlength="1000"></textarea></div>
            <div><label class="label" for="p-para">${GS.t('¿Para quién sería?')}</label>
              <select id="p-para" name="para" class="input"><option value="Para todos">${GS.t('Para todos')}</option><option value="Para mi cargo">${GS.t('Para mi cargo')}</option><option value="Para otro cargo">${GS.t('Para otro cargo')}</option></select></div>
            <div><label class="label" for="p-quien">${GS.t('¿Conoces a alguien que podría enseñarlo? (opcional)')}</label><input id="p-quien" name="quien" class="input" placeholder="${GS.t('Nombre o área')}" maxlength="120"></div>
            <button class="btn self-start" type="submit">${GS.t('Enviar propuesta')}</button>
          </form>
          <div class="side stack">
            <h2 class="h2">${GS.t('Mis propuestas')}</h2>
            ${mias.length ? mias.map((x) => html`<div class="card card-pad-sm stack-sm">
              <div class="row" style="justify-content:space-between"><strong class="strong">${x.tema}</strong><span class="chip ${ESTADO_PROP[x.estado][1]}">${ESTADO_PROP[x.estado][0]}</span></div>
              <span class="muted small">${x.nota ? x.nota : GS.t('Enviada el {fecha}', { fecha: GS.fecha(x.fecha) })}</span>
            </div>`) : html`<p class="muted" style="margin:0">${GS.t('Aún no has enviado propuestas.')}</p>`}
          </div>
        </div>
      </section>`;
    }
  };
  GS.accion('proponer', async (form, ev, fd) => {
    const tema = String(fd.get('tema') || '').trim();
    const porque = String(fd.get('porque') || '').trim();
    if (!tema || !porque) throw new Error(GS.t('Completa qué te gustaría aprender y por qué te serviría.'));
    await S().add('propuestas', { personaId: GS.yo().id, tema, porque, para: fd.get('para'), quien: String(fd.get('quien') || '').trim(), estado: 'revision', nota: '', fecha: GS.hoy() });
    GS.ui.propEnviada = true;
    form.reset();
  }, { escribe: true });

  // ---------- Mi perfil ----------
  GS.vistas.perfil = {
    titulo: GS.t('Mi perfil'),
    render({ yo }) {
      const realizados = GS.insDe(yo.id).filter((i) => i.completadoEn).sort((a, b) => b.completadoEn.localeCompare(a.completadoEn));
      const presenciales = S().where('convocatorias', (c) => c.asistencia && c.asistencia[yo.id]).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const proximas = S().where('convocatorias', (c) => !c.asistencia && c.convocados.includes(yo.id) && c.fecha >= GS.hoy());
      const jefe = yo.jefeId ? GS.persona(yo.jefeId) : null;
      return html`<section class="stack-lg">
        <h1 class="h1">${GS.t('Mi perfil')}</h1>
        <div class="split">
          <div class="card card-pad stack side" style="gap:16px">
            <div class="row" style="gap:14px"><span class="avatar avatar-lg" aria-hidden="true">${GS.iniciales(yo.nombre)}</span>
              <div><div class="strong" style="font-size:20px">${yo.nombre}</div><div class="muted" style="font-size:15px">${GS.cargoDe(yo)}</div></div></div>
            <dl style="margin:0;display:grid;grid-template-columns:max-content 1fr;gap:10px 16px;font-size:15px">
              <dt class="muted">RUT</dt><dd style="margin:0">${yo.rut}</dd>
              <dt class="muted">${GS.t('Unidad')}</dt><dd style="margin:0">${GS.unidadDe(yo)}</dd>
              <dt class="muted">${GS.t('Jefatura')}</dt><dd style="margin:0">${jefe ? jefe.nombre + ', ' + GS.cargoDe(jefe) : '—'}</dd>
              <dt class="muted">${GS.t('Rol')}</dt><dd style="margin:0">${GS.ROLES[yo.rol]}</dd>
            </dl>
            <div class="row" style="justify-content:space-between"><span class="muted" style="font-size:15px">${GS.t('Idioma de la plataforma')}</span>${GS.botonIdioma(true)}</div>
            <div class="row">
              ${GS.auth.activo() ? html`<button type="button" class="btn2" data-action="toggle-perfil-clave">${GS.ui.perfilClave ? GS.t('Cancelar') : GS.t('Cambiar mi clave')}</button>` : ''}
              <button type="button" class="btn2" data-action="cambiar-persona">${GS.t('Cerrar sesión')}</button>
            </div>
            ${GS.auth.activo() && GS.ui.perfilClave ? formClave('clave-cambiar', true) : ''}
          </div>
          <div class="grow stack-lg" style="gap:20px">
            ${proximas.length ? html`<div class="stack"><h2 class="h2">${GS.t('Próximas capacitaciones presenciales')}</h2>${proximas.map((c) => {
              const k = S().get('presencialCatalogo', c.presencialId);
              return html`<div class="card card-pad-sm"><div class="strong">${k ? k.titulo : GS.t('Capacitación')}</div><div class="muted small">${GS.fecha(c.fecha, true)} · ${c.hora} · ${c.lugar}</div></div>`;
            })}</div>` : ''}
            <div class="stack">
              <h2 class="h2">${GS.t('Cursos realizados')}</h2>
              ${realizados.length ? realizados.map((i) => {
                const k = GS.curso(i.cursoId);
                return html`<div class="card card-pad-sm row" style="justify-content:space-between">
                  <div><div class="strong" style="font-size:16px">${k.titulo}</div><div class="muted small">${GS.t('Completado el {fecha}', { fecha: GS.fecha(i.completadoEn, true) })}</div></div>
                  ${k.config.certificado ? html`<a class="btn2 btn-sm" href="#/certificado/${i.id}">${GS.t('Ver certificado')}</a>` : ''}
                </div>`;
              }) : html`<p class="muted" style="margin:0">${GS.t('Cuando termines un curso aparecerá aquí con su certificado.')}</p>`}
            </div>
            <div class="stack">
              <h2 class="h2">${GS.t('Capacitaciones presenciales')}</h2>
              ${presenciales.length ? presenciales.map((c) => {
                const k = S().get('presencialCatalogo', c.presencialId);
                return html`<div class="card card-pad-sm row" style="justify-content:space-between">
                  <div><div class="strong" style="font-size:16px">${k ? k.titulo : GS.t('Capacitación')}</div><div class="muted small">${GS.fecha(c.fecha, true)} · ${c.lugar}</div></div>
                  <span class="chip c-done">${GS.t('Asististe')}</span>
                </div>`;
              }) : html`<p class="muted" style="margin:0">${GS.t('Aún no registras asistencia a capacitaciones presenciales.')}</p>`}
            </div>
          </div>
        </div>
      </section>`;
    }
  };
})(window.GS);
