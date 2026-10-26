// Editor de cursos en 4 pasos. Administración publica directo; jefaturas envían a revisión.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;
  const PASOS = [GS.t('Datos y público'), GS.t('Módulos'), GS.t('Configuración'), GS.t('Revisar y publicar')];
  const copia = (o) => JSON.parse(JSON.stringify(o));

  function puedeEditar(yo, k) {
    if (!k) return false;
    if (yo.rol === 'admin') return k.estado !== 'archivado';
    return k.autorId === yo.id && ['borrador', 'devuelto'].includes(k.estado);
  }
  function estado(k) {
    if (!GS.ui.editor || GS.ui.editor.id !== k.id) {
      const base = k.estado === 'publicado' && k.borradorEdicion ? k.borradorEdicion : k;
      const draft = copia({ titulo: base.titulo, descripcion: base.descripcion, categoria: base.categoria, portada: base.portada, alcance: base.alcance, modulos: base.modulos, config: base.config });
      GS.ui.editor = { id: k.id, paso: 1, draft, sel: draft.modulos[0] ? draft.modulos[0].id : null, listo: null };
    }
    return GS.ui.editor;
  }
  const volverA = (yo) => (yo.rol === 'admin' ? '#/admin/cursos' : '#/equipo/crear');

  // Lista de problemas que impiden publicar o enviar a revisión.
  function problemas(d) {
    const p = [];
    if (!String(d.titulo).trim()) p.push(GS.t('Falta el título del curso.'));
    if (!String(d.descripcion).trim()) p.push(GS.t('Falta la descripción corta.'));
    if (!C.alcanceCompleto(d.alcance)) p.push(GS.t('Elige al menos un edificio y un cargo en "¿Quién lo verá?".'));
    if (!d.modulos.length) p.push(GS.t('El curso no tiene módulos.'));
    d.modulos.forEach((m, i) => {
      const n = GS.t('Módulo {n}', { n: i + 1 });
      if (!String(m.titulo).trim()) p.push(GS.t('{modulo}: falta el título.', { modulo: n }));
      if ((m.tipo === 'video' || m.tipo === 'documento') && !GS.urlSegura(m.url)) p.push(GS.t('{modulo}: falta el link (debe empezar con https://).', { modulo: n }));
      if (m.tipo === 'checklist' && !m.items.some((x) => String(x).trim())) p.push(GS.t('{modulo}: el checklist no tiene ítems.', { modulo: n }));
      if (m.tipo === 'politica' && !String(m.texto).trim()) p.push(GS.t('{modulo}: falta el texto de la política.', { modulo: n }));
      if (GS.juegos.es(m.tipo)) p.push(...GS.juegos.problemas(m, n));
      if (m.quiz) {
        if (!m.quiz.preguntas.length) p.push(GS.t('{modulo}: el quiz no tiene preguntas.', { modulo: n }));
        m.quiz.preguntas.forEach((q, j) => {
          const alts = q.alts.filter((a) => String(a).trim());
          if (!String(q.q).trim()) p.push(GS.t('{modulo}, pregunta {n}: falta el enunciado.', { modulo: n, n: j + 1 }));
          if (alts.length < 2) p.push(GS.t('{modulo}, pregunta {n}: necesita al menos 2 alternativas.', { modulo: n, n: j + 1 }));
          if (!String(q.alts[q.ok] || '').trim()) p.push(GS.t('{modulo}, pregunta {n}: marca una alternativa correcta que tenga texto.', { modulo: n, n: j + 1 }));
        });
      }
    });
    return p;
  }

  GS.vistas.editor = {
    layout: 'propio',
    titulo: GS.t('Editor de cursos'),
    render({ yo, params }) {
      const k = GS.curso(params[0]);
      if (!puedeEditar(yo, k)) {
        return html`<main class="main">${C.vacio(GS.t('No puedes editar este curso.'), html`<a class="btn" href="${volverA(yo)}">${GS.t('Volver')}</a>`)}</main>`;
      }
      const st = estado(k);
      const d = st.draft;
      const esAdmin = yo.rol === 'admin';
      const editandoPublicado = k.estado === 'publicado';
      let cuerpo;
      if (st.paso === 1) cuerpo = paso1(d);
      else if (st.paso === 2) cuerpo = paso2(d, st);
      else if (st.paso === 3) cuerpo = paso3(d);
      else cuerpo = paso4(d, k, esAdmin, editandoPublicado, st);

      return html`<header class="header no-print"><div class="wrap" style="justify-content:space-between">
          ${GS.marca()}
          <div class="row" style="gap:16px"><span class="xs" style="color:var(--texto-claro)">${editandoPublicado ? GS.t('Editando un curso publicado: los cambios se ven al publicar la nueva versión') : GS.t('Se guarda como borrador al cambiar de paso')}</span>
          <a href="${volverA(yo)}" data-action="ed-salir" style="color:#FFF" class="strong">${GS.t('Salir')}</a></div>
        </div></header>
        <main class="main stack-lg" id="contenido" style="padding-top:32px">
          <div><p class="eyebrow">${esAdmin ? GS.t('Como administración') : GS.t('Como jefatura · {unidad}', { unidad: GS.unidadDe(yo) })}</p>
            <h1 class="h1">${editandoPublicado ? GS.t('Editar curso') : k.estado === 'devuelto' ? GS.t('Corregir curso devuelto') : GS.t('Crear curso')}</h1></div>
          ${k.estado === 'devuelto' && k.nota ? html`<div class="notice notice-warn"><strong class="strong">${GS.t('Comentario de revisión:')}</strong> ${k.nota}</div>` : ''}
          <nav class="steps" aria-label="${GS.t('Pasos')}">${PASOS.map((l, i) => {
            const n = i + 1;
            return html`<button type="button" class="step${n < st.paso ? ' hecho' : ''}" aria-current="${n === st.paso ? 'step' : 'false'}" data-action="ed-paso" data-v="${n}"><span class="step-n">${n}</span>${l}</button>`;
          })}</nav>
          ${cuerpo}
          <div class="row" style="justify-content:space-between;border-top:1px solid var(--borde);padding-top:20px">
            <button type="button" class="btn2" data-action="ed-paso" data-v="${st.paso - 1}"${GS.attr(st.paso === 1, 'disabled')}>${GS.t('Anterior')}</button>
            <div class="row">
              <button type="button" class="btn2" data-action="ed-guardar">${GS.t('Guardar borrador')}</button>
              ${st.paso < 4 ? html`<button type="button" class="btn" data-action="ed-paso" data-v="${st.paso + 1}">${GS.t('Siguiente')}</button>` : ''}
            </div>
          </div>
        </main>`;
    }
  };

  // ---------- Paso 1 ----------
  function paso1(d) {
    return html`<div class="card card-pad stack" style="gap:22px;padding:28px">
      <h2 class="h2">${GS.t('Datos del curso')}</h2>
      <div class="grid-form">
        <div><label class="label" for="ed-t">${GS.t('Título')}</label><input id="ed-t" class="input" data-bind="editor.draft.titulo" value="${d.titulo}" maxlength="100"></div>
        <div><label class="label" for="ed-cat">${GS.t('Categoría')}</label><select id="ed-cat" class="input" data-bind="editor.draft.categoria">${C.opciones(GS.CATEGORIAS.map((c) => [c.id, c.l]), d.categoria)}</select></div>
      </div>
      <div><label class="label" for="ed-d">${GS.t('Descripción corta (la ven en el explorador)')}</label><textarea id="ed-d" class="input" rows="2" placeholder="${GS.t('Qué aprenderá la persona y para qué le sirve')}" data-bind="editor.draft.descripcion" maxlength="240">${d.descripcion}</textarea></div>
      <fieldset><legend class="label">${GS.t('Color de portada')}</legend>
        <div class="row">${GS.PORTADAS.map(([hex, l]) => html`<button type="button" class="swatch" style="background:${hex}" aria-label="${GS.t('Portada {color}', { color: l })}" aria-pressed="${String(d.portada === hex)}" data-action="ed-portada" data-v="${hex}"></button>`)}</div></fieldset>
      <h2 class="h2" style="margin-top:6px">${GS.t('¿Quién lo verá?')}</h2>
      ${C.alcance('editor.draft.alcance')}
    </div>`;
  }

  // ---------- Paso 2 ----------
  function paso2(d, st) {
    const i = d.modulos.findIndex((m) => m.id === st.sel);
    const m = i >= 0 ? d.modulos[i] : null;
    const base = 'editor.draft.modulos.' + i;
    let detalle = C.vacio(GS.t('Agrega un módulo para empezar a editarlo.'));
    if (m) {
      let campos;
      if (m.tipo === 'video') {
        campos = html`<div><label class="label" for="ed-url">${GS.t('Link del video (YouTube, Vimeo o Google Drive)')}</label><input id="ed-url" class="input" type="url" placeholder="https://" data-bind="${base}.url" value="${m.url}">
          <p class="help">${GS.t('Si el video es para personal sin correo de la empresa, usa un link que se pueda abrir sin iniciar sesión.')}</p></div>
          <div><label class="label" for="ed-ind">${GS.t('Indicaciones (opcional)')}</label><textarea id="ed-ind" class="input" rows="2" data-bind="${base}.indicaciones">${m.indicaciones || ''}</textarea></div>`;
      } else if (m.tipo === 'documento') {
        campos = html`<div><label class="label" for="ed-url">${GS.t('Link del documento (PDF en Drive, SharePoint u otro)')}</label><input id="ed-url" class="input" type="url" placeholder="https://" data-bind="${base}.url" value="${m.url}">
          <p class="help">${GS.t('Los links de Google Drive se muestran dentro de la página; los demás se abren en otra pestaña.')}</p></div>
          <div><label class="label" for="ed-ind">${GS.t('Indicaciones para quien lo lee (opcional)')}</label><textarea id="ed-ind" class="input" rows="3" data-bind="${base}.indicaciones">${m.indicaciones || ''}</textarea></div>
          <p class="muted small" style="margin:0">${GS.t('La persona debe marcar "Lo leí completo" para avanzar.')}</p>`;
      } else if (m.tipo === 'checklist') {
        campos = html`<div class="stack-sm" style="gap:10px"><span class="label" style="margin:0">${GS.t('Ítems que la persona debe ir marcando')}</span>
          ${m.items.map((v, j) => html`<div class="row" style="flex-wrap:nowrap;gap:8px">
            <label class="sr-only" for="ed-it-${j}">${GS.t('Ítem {n}', { n: j + 1 })}</label>
            <input id="ed-it-${j}" class="input" data-bind="${base}.items.${j}" value="${v}" maxlength="160">
            <button type="button" class="icon-btn" aria-label="${GS.t('Eliminar ítem {n}', { n: j + 1 })}" data-action="ed-item-del" data-j="${j}">×</button></div>`)}
          <button type="button" class="btn2 btn-sm self-start" data-action="ed-item-add">${GS.t('+ Agregar ítem')}</button></div>`;
      } else if (GS.juegos.es(m.tipo)) {
        campos = GS.juegos.campos(m, base);
      } else {
        campos = html`<div><label class="label" for="ed-txt">${GS.t('Texto de la política')}</label><textarea id="ed-txt" class="input" rows="7" placeholder="${GS.t('Pega aquí el texto o un resumen')}" data-bind="${base}.texto">${m.texto || ''}</textarea></div>
          <div><label class="label" for="ed-url">${GS.t('Link al documento completo (opcional)')}</label><input id="ed-url" class="input" type="url" placeholder="https://" data-bind="${base}.url" value="${m.url || ''}"></div>
          <p class="muted small" style="margin:0">${GS.t('La persona acepta con su nombre, RUT y fecha; queda registrado.')}</p>`;
      }
      const preguntas = m.quiz ? m.quiz.preguntas : [];
      detalle = html`<div class="card card-pad stack" style="gap:18px">
        <div class="row">${C.chipTipo(m.tipo)}<span class="muted xs">${GS.t('Módulo {n} de {total}', { n: i + 1, total: d.modulos.length })}</span></div>
        <div><label class="label" for="ed-mt">${GS.t('Título del módulo')}</label><input id="ed-mt" class="input" data-bind="${base}.titulo" value="${m.titulo}" maxlength="120"></div>
        ${campos}
        ${GS.juegos.es(m.tipo) ? html`<p class="muted small" style="margin:0;border-top:1px solid var(--borde);padding-top:14px">${GS.t('Este juego ya evalúa: se aprueba con la nota mínima del curso (paso 3). No lleva quiz aparte.')}</p>` : html`<div class="stack" style="border-top:1px solid var(--borde);padding-top:18px">
          <label class="check check-strong"><input type="checkbox" data-action="ed-quiz"${GS.attr(!!m.quiz, 'checked')}>${GS.t('Agregar quiz al final de este módulo')}</label>
          ${m.quiz ? html`${preguntas.map((q, j) => html`<div class="q-box">
              <div class="row" style="justify-content:space-between"><label class="label" style="margin:0" for="ed-q-${j}">${GS.t('Pregunta {n}', { n: j + 1 })}</label>
                <button type="button" class="icon-btn" aria-label="${GS.t('Eliminar pregunta {n}', { n: j + 1 })}" data-action="ed-preg-del" data-j="${j}">×</button></div>
              <input id="ed-q-${j}" class="input" placeholder="${GS.t('Escribe la pregunta')}" data-bind="${base}.quiz.preguntas.${j}.q" value="${q.q}" maxlength="240">
              <span class="muted xs">${GS.t('Escribe las alternativas y marca la correcta')}</span>
              ${q.alts.map((a, x) => html`<div class="alt-row">
                <input type="radio" name="ok-${m.id}-${j}" aria-label="${GS.t('Marcar alternativa {letra} como correcta', { letra: 'ABCD'[x] })}" data-action="ed-ok" data-j="${j}" data-x="${x}"${GS.attr(q.ok === x, 'checked')}>
                <span class="alt-letter">${'ABCD'[x]}</span>
                <input class="input" placeholder="${GS.t('Alternativa')}" aria-label="${GS.t('Alternativa {letra}', { letra: 'ABCD'[x] })}" data-bind="${base}.quiz.preguntas.${j}.alts.${x}" value="${a}" maxlength="200"></div>`)}
            </div>`)}
            <button type="button" class="btn2 btn-sm self-start" data-action="ed-preg-add">${GS.t('+ Agregar pregunta')}</button>` : ''}
        </div>`}
      </div>`;
    }
    return html`<div class="split">
      <div class="side stack" style="flex:1 1 340px">
        <h2 class="h2">${GS.t('Módulos ({n})', { n: d.modulos.length })}</h2>
        ${d.modulos.map((x, j) => html`<div class="mod-edit${x.id === st.sel ? ' sel' : ''}">
          <button type="button" class="mod-edit-main" data-action="ed-sel" data-id="${x.id}">
            <span class="row" style="gap:8px"><span class="muted xs strong">${j + 1}.</span>${C.chipTipo(x.tipo)}<span class="muted xs">${GS.juegos.es(x.tipo) ? GS.t('Juego') : x.quiz ? GS.t('Con quiz') : GS.t('Sin quiz')}</span></span>
            <b>${x.titulo || GS.t('Sin título')}</b></button>
          <div class="row" style="gap:4px;flex-wrap:nowrap">
            <button type="button" class="icon-btn" aria-label="${GS.t('Subir módulo')}" data-action="ed-mover" data-j="${j}" data-d="-1"${GS.attr(j === 0, 'disabled')}>↑</button>
            <button type="button" class="icon-btn" aria-label="${GS.t('Bajar módulo')}" data-action="ed-mover" data-j="${j}" data-d="1"${GS.attr(j === d.modulos.length - 1, 'disabled')}>↓</button>
            <button type="button" class="icon-btn" aria-label="${GS.t('Eliminar módulo')}" data-action="ed-del" data-j="${j}">×</button>
          </div></div>`)}
        <div class="card card-pad-sm stack-sm" style="padding:14px">
          <span class="label" style="margin:0">${GS.t('Agregar módulo')}</span>
          <div class="grid-form" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
            ${Object.keys(GS.TIPOS_MODULO).map((t) => html`<button type="button" class="btn2 btn-sm" data-action="ed-add" data-v="${t}">+ ${GS.TIPOS_MODULO[t].l}</button>`)}
          </div>
        </div>
      </div>
      <div class="grow" style="flex:999 1 480px">${detalle}</div>
    </div>`;
  }

  // ---------- Paso 3 ----------
  function paso3(d) {
    const c = d.config;
    return html`<div class="card card-pad grid-2" style="gap:28px;padding:28px">
      <fieldset class="stack-sm"><legend class="label">${GS.t('Orden de los módulos')}</legend>
        <label class="check" style="align-items:flex-start"><input type="radio" name="orden" value="sec" data-bind="editor.draft.config.orden"${GS.attr(c.orden === 'sec', 'checked')} style="margin-top:2px"><span><strong class="strong">${GS.t('Uno tras otro')}</strong><br><span class="muted small">${GS.t('Se desbloquea el siguiente al terminar el anterior')}</span></span></label>
        <label class="check" style="align-items:flex-start"><input type="radio" name="orden" value="libre" data-bind="editor.draft.config.orden"${GS.attr(c.orden === 'libre', 'checked')} style="margin-top:2px"><span><strong class="strong">${GS.t('Libre')}</strong><br><span class="muted small">${GS.t('La persona elige por dónde partir')}</span></span></label>
      </fieldset>
      <div class="stack">
        <div><label class="label" for="cf-n">${GS.t('Nota mínima para aprobar los quiz y juegos')}</label><select id="cf-n" class="input" data-bind="editor.draft.config.notaMinima">${C.opciones([[60, '60 %'], [70, '70 %'], [80, '80 %'], [100, '100 %']], c.notaMinima)}</select></div>
        <div><label class="label" for="cf-i">${GS.t('Intentos por quiz')}</label><select id="cf-i" class="input" data-bind="editor.draft.config.intentos">${C.opciones([[0, GS.t('Ilimitados')], [3, GS.plural(3, 'intento', 'intentos')], [1, GS.plural(1, 'intento', 'intentos')]], c.intentos)}</select></div>
      </div>
      <div class="stack">
        <div><label class="label" for="cf-d">${GS.t('Duración estimada')}</label><input id="cf-d" class="input" placeholder="${GS.t('Ej: 40 min')}" data-bind="editor.draft.config.duracion" value="${c.duracion}" maxlength="20"></div>
        <label class="check"><input type="checkbox" data-bind="editor.draft.config.certificado"${GS.attr(c.certificado, 'checked')}>${GS.t('Entregar certificado al terminar')}</label>
      </div>
    </div>`;
  }

  // ---------- Paso 4 ----------
  function paso4(d, k, esAdmin, editandoPublicado, st) {
    const probs = problemas(d);
    const nQuiz = d.modulos.filter((m) => m.quiz).length;
    const nPreg = d.modulos.reduce((a, m) => a + (m.quiz ? m.quiz.preguntas.length : 0), 0);
    const enCurso = editandoPublicado ? S().where('inscripciones', (i) => i.cursoId === k.id && !i.completadoEn && i.hechos.length).length : 0;
    const accion = editandoPublicado ? GS.t('Publicar nueva versión') : esAdmin ? GS.t('Publicar curso') : GS.t('Enviar a revisión de RRHH');
    const resumen = [
      [GS.t('Título'), d.titulo || GS.t('Sin título')],
      [GS.t('Categoría'), GS.categoriaL(d.categoria)],
      [GS.t('Quién lo verá'), GS.capitalizar(GS.alcanceTexto(d.alcance))],
      [GS.t('Módulos'), d.modulos.length + (d.modulos.length ? ' (' + d.modulos.map((m) => GS.TIPOS_MODULO[m.tipo].l.toLowerCase()).join(', ') + ')' : '')],
      [GS.t('Quiz'), GS.t('{modulos} con quiz, {preguntas} en total · nota mínima {nota} %', { modulos: GS.plural(nQuiz, 'módulo', 'módulos'), preguntas: GS.plural(nPreg, 'pregunta', 'preguntas'), nota: d.config.notaMinima })],
      [GS.t('Orden'), d.config.orden === 'sec' ? GS.t('Uno tras otro') : GS.t('Libre')],
      [GS.t('Duración'), d.config.duracion || '—'],
      [GS.t('Certificado'), d.config.certificado ? GS.t('Sí, al terminar') : GS.t('No')]
    ];
    return html`<div class="stack" style="gap:20px">
      ${st.listo ? html`<div class="notice notice-ok" role="status">${st.listo}</div>` : ''}
      <div class="split">
        <div class="side stack-sm" style="gap:10px">
          <h2 class="h2">${GS.t('Así se verá en el explorador')}</h2>
          <article class="card course">
            <div style="height:96px;background:${d.portada}"></div>
            <div class="course-body">
              <span class="chip ${GS.esParaTodos(d.alcance) ? 'c-sky' : 'c-none'}">${GS.esParaTodos(d.alcance) ? GS.t('Para todos') : GS.t('Para tu cargo')}</span>
              <h3 class="h3">${d.titulo || GS.t('Sin título')}</h3>
              <p class="muted small" style="margin:0">${d.descripcion || GS.t('Sin descripción')}</p>
              <p class="muted small" style="margin:0">${GS.plural(d.modulos.length, 'módulo', 'módulos')}${d.config.duracion ? ' · ' + d.config.duracion : ''}</p>
              <span class="btn self-start" aria-hidden="true">${GS.t('Inscribirme')}</span>
            </div>
          </article>
        </div>
        <div class="card card-pad grow">
          <h2 class="h2" style="margin-bottom:10px">${GS.t('Revisión final')}</h2>
          <dl style="margin:0">${resumen.map(([a, b]) => html`<div class="resumen-row"><dt>${a}</dt><dd>${b}</dd></div>`)}</dl>
          ${probs.length ? html`<div class="notice notice-warn" style="margin-top:14px"><strong class="strong">${esAdmin ? GS.t('Antes de publicar, corrige:') : GS.t('Antes de enviar, corrige:')}</strong><ul style="margin:6px 0 0;padding-left:20px">${probs.map((p) => html`<li>${p}</li>`)}</ul></div>` : ''}
          ${enCurso ? html`<div class="notice notice-info" style="margin-top:14px"><strong class="strong">${GS.t('{personas} a mitad de este curso.', { personas: GS.plural(enCurso, 'persona va', 'personas van') })}</strong> ${GS.t('Conservan lo que ya completaron en los módulos que no cambiaste; los módulos nuevos les quedan pendientes. Quienes ya lo terminaron conservan su certificado.')}</div>` : ''}
          <p class="muted small" style="margin:14px 0 0">${esAdmin ? GS.t('Como administración, el curso se publica de inmediato.') : GS.t('RRHH revisará el curso antes de que aparezca en el explorador. Si tiene observaciones, te llegará devuelto con comentarios.')}</p>
          <div class="row" style="margin-top:16px">
            <button type="button" class="btn" data-action="ed-final"${GS.attr(probs.length > 0, 'disabled')}>${accion}</button>
            ${!editandoPublicado ? html`<button type="button" class="btn2" data-action="ed-preview">${GS.t('Ver vista previa')}</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  // ---------- Acciones ----------
  const st = () => GS.ui.editor;
  const modSel = () => st().draft.modulos.find((m) => m.id === st().sel);
  const nuevoModulo = (tipo) => {
    const base = { id: 'm' + GS.uid(), tipo, titulo: GS.t('Nuevo {tipo}', { tipo: GS.TIPOS_MODULO[tipo].l.toLowerCase() }), quiz: null };
    if (tipo === 'video' || tipo === 'documento') return Object.assign(base, { url: '', indicaciones: '' });
    if (tipo === 'checklist') return Object.assign(base, { items: [''] });
    if (GS.juegos.es(tipo)) return GS.juegos.nuevo(tipo, base);
    return Object.assign(base, { titulo: GS.t('Nueva política'), texto: '', url: '' });
  };
  const preguntaVacia = () => ({ q: '', alts: ['', '', '', ''], ok: 0 });

  async function guardarBorrador(silencioso) {
    if (GS.soloLectura()) return;
    const k = GS.curso(st().id);
    const d = copia(st().draft);
    d.modulos.forEach((m) => { if (m.items) m.items = m.items.filter((x, i) => String(x).trim() || i === m.items.length - 1); });
    if (k.estado === 'publicado') {
      const original = { titulo: k.titulo, descripcion: k.descripcion, categoria: k.categoria, portada: k.portada, alcance: k.alcance, modulos: k.modulos, config: k.config };
      const sinCambios = JSON.stringify(original) === JSON.stringify(d);
      if (sinCambios && !k.borradorEdicion) return;
      await S().update('cursos', k.id, { borradorEdicion: sinCambios ? null : d });
    }
    else await S().update('cursos', k.id, Object.assign(d, { actualizadoEn: GS.ahora() }));
    if (!silencioso) GS.toast(GS.t('Borrador guardado.'));
  }

  // El selector numérico se guarda como texto: se corrige aquí.
  function normalizar() {
    const c = st().draft.config;
    c.notaMinima = Number(c.notaMinima);
    c.intentos = Number(c.intentos);
  }

  GS.accion('ed-paso', async (el) => {
    const n = Math.min(4, Math.max(1, Number(el.dataset.v)));
    normalizar();
    await guardarBorrador(true);
    st().paso = n;
    st().listo = null;
  });
  GS.accion('ed-guardar', async () => { normalizar(); await guardarBorrador(false); }, { escribe: true });
  GS.accion('ed-salir', async (el) => { normalizar(); await guardarBorrador(true); delete GS.ui.editor; GS.ir(el.getAttribute('href')); return false; });
  GS.accion('ed-preview', async () => { normalizar(); await guardarBorrador(true); GS.ir('#/curso/' + st().id); return false; });
  GS.accion('ed-portada', (el) => { st().draft.portada = el.dataset.v; });
  GS.accion('ed-add', (el) => { const m = nuevoModulo(el.dataset.v); st().draft.modulos.push(m); st().sel = m.id; });
  GS.accion('ed-sel', (el) => { st().sel = el.dataset.id; });
  GS.accion('ed-mover', (el) => {
    const a = st().draft.modulos;
    const j = Number(el.dataset.j), t = j + Number(el.dataset.d);
    if (t < 0 || t >= a.length) return;
    [a[j], a[t]] = [a[t], a[j]];
  });
  GS.accion('ed-del', (el) => {
    const a = st().draft.modulos;
    const j = Number(el.dataset.j);
    if (!confirm(GS.t('¿Eliminar el módulo "{titulo}"?', { titulo: a[j].titulo || GS.t('Sin título') }))) return false;
    a.splice(j, 1);
    if (!a.some((m) => m.id === st().sel)) st().sel = a[0] ? a[0].id : null;
  });
  GS.accion('ed-item-add', () => { modSel().items.push(''); });
  GS.accion('ed-item-del', (el) => { const m = modSel(); m.items.splice(Number(el.dataset.j), 1); if (!m.items.length) m.items.push(''); });
  GS.accion('ed-quiz', (el) => { const m = modSel(); m.quiz = el.checked ? { preguntas: [preguntaVacia()] } : null; });
  GS.accion('ed-preg-add', () => { modSel().quiz.preguntas.push(preguntaVacia()); });
  GS.accion('ed-preg-del', (el) => { const m = modSel(); m.quiz.preguntas.splice(Number(el.dataset.j), 1); if (!m.quiz.preguntas.length) m.quiz = null; });
  GS.accion('ed-ok', (el) => { modSel().quiz.preguntas[Number(el.dataset.j)].ok = Number(el.dataset.x); });

  GS.accion('ed-final', async () => {
    normalizar();
    const s = st();
    const d = copia(s.draft);
    if (problemas(d).length) throw new Error(GS.t('Revisa los puntos pendientes antes de continuar.'));
    d.modulos.forEach((m) => { if (m.items) m.items = m.items.filter((x) => String(x).trim()); if (m.quiz) m.quiz.preguntas.forEach((q) => { q.alts = q.alts.map((a) => String(a).trim()); }); });
    const yo = GS.yo();
    const k = GS.curso(s.id);
    const ahora = GS.ahora();
    if (yo.rol === 'admin') {
      const nuevaVersion = k.estado === 'publicado' ? (k.version || 1) + 1 : k.version || 1;
      await S().update('cursos', k.id, Object.assign(d, { estado: 'publicado', nota: '', version: nuevaVersion, actualizadoEn: ahora, publicadoEn: ahora, borradorEdicion: null }));
      s.listo = (k.estado === 'publicado' ? GS.t('Nueva versión publicada.') : GS.t('Publicado.')) + ' ' + GS.t('Ya aparece en el explorador para {alcance}.', { alcance: GS.alcanceTexto(d.alcance) });
    } else {
      await S().update('cursos', k.id, Object.assign(d, { estado: 'revision', nota: '', actualizadoEn: ahora }));
      GS.toast(GS.t('Enviado a revisión. Lo verás como "En revisión" en Mi equipo › Crear curso.'));
      delete GS.ui.editor;
      GS.ir('#/equipo/crear');
      return false;
    }
  }, { escribe: true });
})(window.GS);
