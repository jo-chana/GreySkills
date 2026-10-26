// Curso por dentro: módulos, quiz, encuesta final y certificado. Todo el avance se guarda.
window.GS = window.GS || {};

(function (GS) {
  const html = GS.html;
  const C = GS.comp;
  const S = () => GS.store;

  function estadoUI(cursoId) {
    if (!GS.ui.curso || GS.ui.curso.cursoId !== cursoId) {
      GS.ui.curso = { cursoId, cur: null, vista: 'contenido', resp: {}, quizEnviado: false, visto: {}, leido: {}, acepta: {}, enc: {} };
    }
    return GS.ui.curso;
  }
  const hechos = (ins) => (ins ? GS.hechosValidos(ins) : []);
  function desbloqueado(k, ins, i, preview) {
    if (preview || k.config.orden === 'libre') return true;
    const h = hechos(ins);
    return k.modulos.slice(0, i).every((m) => h.includes(m.id));
  }
  function primerPendiente(k, ins) {
    const h = hechos(ins);
    const i = k.modulos.findIndex((m) => !h.includes(m.id));
    return i < 0 ? 0 : i;
  }

  GS.vistas.curso = {
    layout: 'propio',
    titulo: ({ params }) => { const k = GS.curso(params[0]); return k ? k.titulo : GS.t('Curso'); },
    render({ yo, params }) {
      const k = GS.curso(params[0]);
      if (!k) return html`<main class="main">${C.vacio(GS.t('Este curso no existe o fue eliminado.'), html`<a class="btn" href="#/cursos">${GS.t('Volver a Mis cursos')}</a>`)}</main>`;
      const ins = GS.ins(yo.id, k.id);
      const puedeVer = ins || GS.visiblePara(k, yo) || yo.rol === 'admin' || k.autorId === yo.id;
      if (!puedeVer) return html`<main class="main">${C.vacio(GS.t('Este curso no está disponible para ti.'), html`<a class="btn" href="#/cursos">${GS.t('Volver a Mis cursos')}</a>`)}</main>`;
      const preview = !ins;
      const st = estadoUI(k.id);
      if (st.cur == null || st.cur >= k.modulos.length) st.cur = primerPendiente(k, ins);
      const h = hechos(ins);
      const pct = ins ? GS.avance(ins) : 0;

      let meta = GS.t('Vista previa · tu avance no se guarda hasta que te inscribas');
      if (ins && ins.origen === 'asignado') meta = (ins.asignadoPor ? GS.t('Asignado por {nombre}', { nombre: GS.nombreDe(ins.asignadoPor) }) : GS.t('Asignado')) + ' · ' + GS.plazoTxt(ins);
      else if (ins) meta = GS.t('Inscrito por ti') + ' · ' + GS.plazoTxt(ins);

      const header = html`<header class="course-header no-print"><div class="wrap">
        <div class="row" style="justify-content:space-between"><a href="#/cursos">← ${GS.t('Volver a Mis cursos')}</a><span style="font-family:var(--serif);font-size:18px">Grey Skills</span></div>
        <div class="row-between">
          <div><h1>${k.titulo}</h1><span class="meta">${meta}</span></div>
          ${ins ? html`<div class="stack-sm" style="flex:0 1 320px;min-width:220px;gap:6px">
            <span class="xs strong" style="color:var(--texto-claro)">${GS.t('{n} de {total} módulos completados', { n: h.length, total: k.modulos.length })}</span>
            <div class="bar"><span style="width:${pct}%"></span></div>
          </div>` : ''}
        </div>
      </div></header>`;

      if (!k.modulos.length) return html`${header}<main class="main">${C.vacio(GS.t('Este curso todavía no tiene módulos.'))}</main>`;

      const avisos = [];
      if (preview && GS.visiblePara(k, yo)) avisos.push(html`<div class="notice notice-info row" style="justify-content:space-between;flex:1 1 100%"><span>${GS.t('Estás viendo el curso sin inscribirte.')}</span><button type="button" class="btn" data-action="inscribir" data-id="${k.id}">${GS.t('Inscribirme y comenzar')}</button></div>`);
      else if (preview) avisos.push(html`<div class="notice notice-warn" style="flex:1 1 100%">${k.estado !== 'publicado' ? GS.t('Vista previa de un curso {estado}.', { estado: GS.ESTADOS_CURSO[k.estado].l.toLowerCase() }) : GS.t('Vista previa.')} ${GS.t('Nada de lo que hagas aquí se guarda.')}</div>`);

      let panel;
      if (st.vista === 'quiz') panel = vistaQuiz(k, ins, st, preview);
      else if (st.vista === 'encuesta' && ins && ins.completadoEn) panel = vistaEncuesta(k, ins, st);
      else if (st.vista === 'fin' && ins && ins.completadoEn) panel = vistaFin(k, ins, yo);
      else panel = vistaModulo(k, ins, st, preview, yo);

      return html`${header}<main class="main" id="contenido" style="padding-top:28px">
        <div class="split">
          ${avisos}
          <nav class="mod-nav" aria-label="${GS.t('Módulos del curso')}">
            ${k.modulos.map((m, i) => {
              const hecho = h.includes(m.id);
              const libre = desbloqueado(k, ins, i, preview);
              const actual = i === st.cur && (st.vista === 'contenido' || st.vista === 'quiz');
              const sub = GS.TIPOS_MODULO[m.tipo].l + (m.quiz ? ' + quiz' : '') + ' · ' + (hecho ? GS.t('Completado') : !libre ? GS.t('Bloqueado') : actual ? GS.t('En curso') : GS.t('Disponible'));
              return html`<button type="button" class="mod-item${hecho ? ' hecho' : ''}" data-action="curso-ir" data-i="${i}" aria-current="${actual ? 'step' : 'false'}"${GS.attr(!libre, 'disabled')}>
                <span class="mod-num" aria-hidden="true">${hecho ? '✓' : i + 1}</span>
                <span class="mod-txt"><b>${m.titulo}</b><span>${sub}</span></span>
              </button>`;
            })}
            ${ins && ins.completadoEn ? html`<button type="button" class="mod-item hecho" data-action="curso-fin" aria-current="${st.vista === 'fin' || st.vista === 'encuesta' ? 'step' : 'false'}">
              <span class="mod-num" aria-hidden="true">★</span><span class="mod-txt"><b>${k.config.certificado ? GS.t('Certificado') : GS.t('Curso terminado')}</b><span>${GS.fecha(ins.completadoEn, true)}</span></span></button>` : ''}
          </nav>
          <section class="grow" style="flex:999 1 560px">${panel}</section>
        </div>
      </main>`;
    }
  };

  // ---------- Contenido de un módulo ----------
  function vistaModulo(k, ins, st, preview, yo) {
    const i = st.cur;
    const m = k.modulos[i];
    const hecho = hechos(ins).includes(m.id);
    const esUltimo = i === k.modulos.length - 1;
    let cuerpo, puede = hecho;

    if (m.tipo === 'video') {
      const emb = GS.urlEmbebible(m.url);
      const url = GS.urlSegura(m.url);
      const visto = st.visto[m.id] || hecho;
      puede = puede || visto;
      cuerpo = html`<div class="stack">
        ${emb ? html`<div class="media media-embed"><iframe src="${emb}" title="${m.titulo}" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
          : html`<div class="media"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M10 8l6 4-6 4z"></path></svg>
            ${url ? html`<a class="btn2" href="${url}" target="_blank" rel="noopener">${GS.t('Abrir el video en otra pestaña')}</a>` : html`<span>${GS.t('Este módulo aún no tiene el link del video cargado.')}</span>`}</div>`}
        ${m.indicaciones ? html`<p style="margin:0;font-size:16px;line-height:1.55">${m.indicaciones}</p>` : ''}
        ${emb && url ? html`<a class="xs strong" href="${url}" target="_blank" rel="noopener">${GS.t('Abrir el video en otra pestaña')}</a>` : ''}
        <label class="check-box${visto ? ' on' : ''}"><input type="checkbox" data-action="curso-marca" data-campo="visto" data-id="${m.id}"${GS.attr(visto, 'checked')}${GS.attr(hecho, 'disabled')}>${GS.t('Vi el video completo')}</label>
      </div>`;
    } else if (m.tipo === 'documento') {
      const emb = GS.urlEmbebible(m.url);
      const url = GS.urlSegura(m.url);
      const leido = st.leido[m.id] || hecho;
      puede = puede || leido;
      cuerpo = html`<div class="stack">
        ${m.indicaciones ? html`<p style="margin:0;font-size:16px;line-height:1.55">${m.indicaciones}</p>` : ''}
        ${emb ? html`<iframe class="doc-frame" src="${emb}" title="${m.titulo}" loading="lazy"></iframe>` : ''}
        ${url ? html`<a class="btn2 self-start" href="${url}" target="_blank" rel="noopener">${GS.t('Abrir el documento en otra pestaña')}</a>` : html`<div class="notice">${GS.t('Este módulo aún no tiene el link del documento cargado.')}</div>`}
        <label class="check-box${leido ? ' on' : ''}"><input type="checkbox" data-action="curso-marca" data-campo="leido" data-id="${m.id}"${GS.attr(leido, 'checked')}${GS.attr(hecho, 'disabled')}>${GS.t('Lo leí completo')}</label>
      </div>`;
    } else if (m.tipo === 'checklist') {
      const marcas = (ins && ins.checks[m.id]) || (st.checksPreview && st.checksPreview[m.id]) || [];
      const n = m.items.filter((x, j) => marcas[j] || hecho).length;
      puede = puede || n === m.items.length;
      cuerpo = html`<div class="stack-sm" style="gap:10px">
        <p class="muted" style="margin:0;font-size:16px">${GS.t('Marca cada punto cuando lo hayas revisado. Tu avance se guarda al marcar.')}</p>
        ${m.items.map((t, j) => { const on = !!marcas[j] || hecho; return html`<label class="check-box${on ? ' on' : ''}"><input type="checkbox" data-action="curso-check" data-id="${m.id}" data-j="${j}"${GS.attr(on, 'checked')}${GS.attr(hecho, 'disabled')}>${t}</label>`; })}
        <span class="xs strong">${GS.t('{n} de {total} revisados', { n, total: m.items.length })}</span>
      </div>`;
    } else if (GS.juegos.es(m.tipo)) {
      const j = GS.juegos.render(m, { k, ins, st, hecho });
      puede = j.aprobado;
      cuerpo = j.cuerpo;
    } else {
      const firma = ins && ins.firmas[m.id];
      const acepta = st.acepta[m.id] || !!firma;
      puede = puede || acepta;
      const url = GS.urlSegura(m.url);
      cuerpo = html`<div class="stack">
        <div class="policy" tabindex="0">${m.texto || GS.t('Sin texto cargado.')}</div>
        ${url ? html`<a class="xs strong" href="${url}" target="_blank" rel="noopener">${GS.t('Ver el documento completo')}</a>` : ''}
        <label class="check-box${acepta ? ' on' : ''}" style="align-items:flex-start;padding-top:14px;padding-bottom:14px"><input type="checkbox" data-action="curso-marca" data-campo="acepta" data-id="${m.id}"${GS.attr(acepta, 'checked')}${GS.attr(!!firma, 'disabled')}>${GS.t('Leí el documento y me comprometo a cumplirlo')}</label>
        <div class="grid-form">
          <div><span class="label">${GS.t('Nombre')}</span><div class="readonly-field">${yo.nombre}</div></div>
          <div><span class="label">RUT</span><div class="readonly-field">${yo.rut}</div></div>
          <div><span class="label">${GS.t('Fecha')}</span><div class="readonly-field">${GS.fecha(firma ? firma.fecha : GS.hoy(), true)}</div></div>
        </div>
      </div>`;
    }

    const q = ins && ins.quiz[m.id];
    let txt = GS.t('Completar y seguir');
    if (m.quiz && !hecho && !(q && q.aprobado)) txt = GS.t('Ir al quiz');
    else if (hecho && esUltimo) txt = ins && ins.completadoEn ? (k.config.certificado ? GS.t('Ver mi certificado') : GS.t('Terminar')) : GS.t('Terminar el curso');
    else if (hecho) txt = GS.t('Siguiente módulo');
    else if (m.tipo === 'politica') txt = esUltimo ? GS.t('Firmar y terminar el curso') : GS.t('Firmar y seguir');
    else if (esUltimo) txt = GS.t('Completar y terminar el curso');

    return html`<div class="card card-pad stack" style="gap:20px;padding:28px">
      <div class="stack-sm" style="gap:6px"><span class="muted xs strong">${GS.t('Módulo {n} de {total}', { n: i + 1, total: k.modulos.length })} · ${m.quiz ? GS.t('{tipo} con quiz', { tipo: GS.TIPOS_MODULO[m.tipo].l }) : GS.TIPOS_MODULO[m.tipo].l}</span><h2 class="h2">${m.titulo}</h2></div>
      ${cuerpo}
      ${hecho ? html`<div class="notice">${GS.t('Ya completaste este módulo. Puedes repasarlo cuando quieras.')}</div>` : ''}
      <div class="row" style="justify-content:flex-end;border-top:1px solid var(--borde);padding-top:18px">
        <button type="button" class="btn" data-action="curso-avanzar"${GS.attr(!puede, 'disabled')}>${txt}</button>
      </div>
    </div>`;
  }

  // ---------- Quiz ----------
  function vistaQuiz(k, ins, st, preview) {
    const m = k.modulos[st.cur];
    const preguntas = m.quiz.preguntas;
    const q = (ins && ins.quiz[m.id]) || { intentos: 0 };
    const max = k.config.intentos;
    const enviado = st.quizEnviado;
    const correctas = preguntas.filter((p, i) => st.resp[i] === p.ok).length;
    const nota = Math.round(correctas / preguntas.length * 100);
    const aprobado = enviado && nota >= k.config.notaMinima;
    const agotado = max > 0 && q.intentos >= max && !q.aprobado;
    const intentoN = enviado ? q.intentos : q.intentos + 1;

    if (agotado && !enviado) {
      return html`<div class="card card-pad stack"><h2 class="h2">${GS.t('Usaste tus {n} intentos', { n: max })}</h2>
        <p style="margin:0">${GS.t('No alcanzaste la nota mínima en el quiz de este módulo. Habla con tu jefatura o con RRHH para que te habiliten un nuevo intento.')}</p>
        <button type="button" class="btn2 self-start" data-action="curso-volver">${GS.t('Volver al módulo')}</button></div>`;
    }

    let resultado = '';
    if (enviado) {
      resultado = aprobado
        ? html`<div class="notice notice-ok" role="status"><strong class="strong" style="font-size:18px">${GS.t('Aprobado · {n} de {total} ({nota} %)', { n: correctas, total: preguntas.length, nota })}</strong><br>${GS.t('Bien hecho. Ya puedes seguir.')}</div>`
        : html`<div class="notice notice-error" role="status"><strong class="strong" style="font-size:18px">${GS.t('Aún no · {n} de {total} ({nota} %)', { n: correctas, total: preguntas.length, nota })}</strong><br>${GS.t('Necesitas {nota} %.', { nota: k.config.notaMinima })} ${max > 0 ? (max - q.intentos > 0 ? GS.t('Te quedan {n}.', { n: GS.plural(max - q.intentos, 'intento', 'intentos') }) : GS.t('Ya no te quedan intentos.')) : GS.t('Repasa el módulo si quieres y vuelve a intentarlo; no hay límite de intentos.')}</div>`;
    }

    return html`<div class="card card-pad stack" style="gap:22px;padding:28px">
      <div class="stack-sm" style="gap:6px"><span class="muted xs strong">${GS.t('Quiz · Módulo {n}', { n: st.cur + 1 })} · ${GS.t('Necesitas {nota} % para aprobar', { nota: k.config.notaMinima })} · ${max > 0 ? GS.t('Intento {n} de {max}', { n: intentoN, max }) : GS.t('Intento {n}', { n: intentoN })}${preview ? ' · ' + GS.t('vista previa') : ''}</span><h2 class="h2">${GS.t('¿Qué aprendiste?')}</h2></div>
      ${preguntas.map((p, i) => html`<fieldset class="stack-sm">
        <legend class="strong" style="font-size:17px;line-height:1.35;margin-bottom:10px">${i + 1}. ${p.q}</legend>
        ${p.alts.map((a, j) => {
          if (!a) return '';
          const elegida = st.resp[i] === j;
          let cls = elegida ? ' sel' : '', tag = '';
          if (enviado) {
            if (aprobado && p.ok === j) { cls = ' bien'; tag = elegida ? GS.t('Bien') : GS.t('Correcta'); }
            else if (elegida && p.ok === j) { cls = ' bien'; tag = GS.t('Bien'); }
            else if (elegida) { cls = ' mal'; tag = GS.t('Tu respuesta'); }
          }
          return html`<label class="quiz-opt${cls}"><input type="radio" name="q${i}" data-action="quiz-resp" data-i="${i}" data-j="${j}"${GS.attr(elegida, 'checked')}${GS.attr(enviado, 'disabled')}><span>${a}</span>${tag ? html`<span class="tag">${tag}</span>` : ''}</label>`;
        })}
      </fieldset>`)}
      ${resultado}
      <div class="row" style="justify-content:flex-end;border-top:1px solid var(--borde);padding-top:18px">
        ${!enviado ? html`<button type="button" class="btn2" data-action="curso-volver">${GS.t('Volver al módulo')}</button>
          <button type="button" class="btn" data-action="quiz-enviar"${GS.attr(Object.keys(st.resp).length < preguntas.length, 'disabled')}>${GS.t('Enviar respuestas')}</button>` : ''}
        ${enviado && !aprobado ? html`<button type="button" class="btn2" data-action="curso-volver">${GS.t('Repasar el módulo')}</button>
          ${!(max > 0 && q.intentos >= max) ? html`<button type="button" class="btn" data-action="quiz-reintentar">${GS.t('Intentar de nuevo')}</button>` : ''}` : ''}
        ${enviado && aprobado ? html`<button type="button" class="btn" data-action="quiz-seguir">${st.cur === k.modulos.length - 1 ? GS.t('Terminar el curso') : GS.t('Siguiente módulo')}</button>` : ''}
      </div>
    </div>`;
  }

  // ---------- Encuesta final ----------
  function vistaEncuesta(k, ins, st) {
    const e = st.enc;
    const escala = (campo, pregunta, min, max) => html`<fieldset class="stack-sm" style="gap:10px">
      <legend class="strong" style="font-size:17px;margin-bottom:10px">${pregunta}</legend>
      <div class="row" style="gap:8px">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" class="scale" aria-pressed="${String(e[campo] === n)}" aria-label="${GS.t('{n} de 5', { n })}" data-action="enc" data-campo="${campo}" data-v="${n}">${n}</button>`)}</div>
      <div class="scale-legend"><span>${min}</span><span>${max}</span></div>
    </fieldset>`;
    return html`<div class="card card-pad stack" style="gap:24px;padding:28px">
      <div class="stack-sm" style="gap:6px"><span class="muted xs strong">${k.config.certificado ? GS.t('Último paso antes de tu certificado') : GS.t('Último paso')}</span><h2 class="h2">${GS.t('¿Cómo te fue con este curso?')}</h2>
        <span class="muted" style="font-size:15px">${GS.t('Tus respuestas ayudan a mejorar los cursos. Las ve solo el equipo de RRHH.')}</span></div>
      ${escala('utilidad', GS.t('¿Qué tan útil fue para tu trabajo?'), GS.t('Nada útil'), GS.t('Muy útil'))}
      ${escala('claridad', GS.t('¿Qué tan claro fue el contenido?'), GS.t('Nada claro'), GS.t('Muy claro'))}
      <fieldset class="stack-sm" style="gap:10px"><legend class="strong" style="font-size:17px;margin-bottom:10px">${GS.t('¿Se lo recomendarías a un compañero?')}</legend>
        <div class="row" style="gap:8px">${['Sí', 'Tal vez', 'No'].map((l) => html`<button type="button" class="pill" aria-pressed="${String(e.recomienda === l)}" data-action="enc" data-campo="recomienda" data-v="${l}">${GS.t(l)}</button>`)}</div></fieldset>
      <div><label class="label" for="enc-c">${GS.t('¿Qué mejorarías? (opcional)')}</label><textarea id="enc-c" class="input" rows="3" maxlength="1000" data-bind="curso.enc.comentario">${e.comentario || ''}</textarea></div>
      <div class="row" style="justify-content:flex-end;border-top:1px solid var(--borde);padding-top:18px">
        <button type="button" class="btn" data-action="enc-enviar"${GS.attr(!(e.utilidad && e.claridad && e.recomienda), 'disabled')}>${k.config.certificado ? GS.t('Enviar y ver mi certificado') : GS.t('Enviar')}</button>
      </div>
    </div>`;
  }

  function vistaFin(k, ins, yo) {
    if (!k.config.certificado) {
      return html`<div class="card card-pad stack" style="align-items:flex-start"><h2 class="h2">${GS.t('¡Terminaste el curso!')}</h2>
        <p style="margin:0">${GS.t('Completaste "{curso}" el {fecha}.', { curso: k.titulo, fecha: GS.fecha(ins.completadoEn, true) })}</p><a class="btn" href="#/cursos">${GS.t('Volver a Mis cursos')}</a></div>`;
    }
    return html`<div class="stack" style="align-items:center;gap:18px">
      ${GS.comp.certificado(yo, k, ins)}
      <div class="row" style="justify-content:center"><a class="btn" href="#/certificado/${ins.id}">${GS.t('Descargar certificado')}</a><a class="btn2" href="#/cursos">${GS.t('Volver a Mis cursos')}</a></div>
    </div>`;
  }

  // ---------- Certificado ----------
  GS.comp.certificado = (p, k, ins) => html`<div class="cert">
    <span class="cert-kicker">${GS.t('Certificado de aprobación')}</span>
    <span class="muted" style="font-size:16px">${GS.t('Se certifica que')}</span>
    <span class="cert-name">${p.nombre}</span>
    <span class="muted" style="font-size:14px">RUT ${p.rut}</span>
    <span class="muted" style="font-size:16px">${GS.t('completó el curso')}</span>
    <span class="cert-course">${k.titulo}</span>
    <div class="cert-line"></div>
    <span class="muted" style="font-size:14px">${GS.fecha(ins.completadoEn, true)} · Greystar Chile</span>
  </div>`;

  GS.vistas.certificado = {
    layout: 'propio',
    titulo: GS.t('Certificado'),
    render({ yo, real }) {
      const ins = S().get('inscripciones', GS.ruta().params[0]);
      const k = ins && GS.curso(ins.cursoId);
      const p = ins && GS.persona(ins.personaId);
      const permitido = ins && (ins.personaId === yo.id || real.rol === 'admin');
      if (!permitido || !ins.completadoEn || !k) return html`<main class="main">${C.vacio(GS.t('No encontramos este certificado.'), html`<a class="btn" href="#/perfil">${GS.t('Ir a Mi perfil')}</a>`)}</main>`;
      return html`<main class="main stack" style="gap:20px">
        <div class="row no-print" style="justify-content:space-between"><a href="#/perfil" class="strong" style="text-decoration:none">← ${GS.t('Volver a Mi perfil')}</a>
          <button type="button" class="btn" data-action="imprimir">${GS.t('Descargar o imprimir (PDF)')}</button></div>
        <p class="muted small no-print" style="margin:0">${GS.t('Para guardarlo como PDF, elige "Guardar como PDF" en la ventana de impresión.')}</p>
        ${GS.comp.certificado(p, k, ins)}
      </main>`;
    }
  };
  GS.accion('imprimir', () => { window.print(); return false; });

  // ---------- Acciones ----------
  const ctx = () => {
    const yo = GS.yo();
    const k = GS.curso(GS.ui.curso.cursoId);
    return { yo, k, ins: GS.ins(yo.id, k.id), st: GS.ui.curso };
  };

  GS.accion('curso-ir', (el) => { const st = GS.ui.curso; st.cur = Number(el.dataset.i); st.vista = 'contenido'; st.resp = {}; st.quizEnviado = false; });
  GS.accion('curso-fin', () => { const { ins, st } = ctx(); st.vista = ins.encuesta ? 'fin' : 'encuesta'; });
  GS.accion('curso-volver', () => { const st = GS.ui.curso; st.vista = 'contenido'; st.resp = {}; st.quizEnviado = false; });
  GS.accion('curso-marca', (el) => { const st = GS.ui.curso; st[el.dataset.campo][el.dataset.id] = el.checked; });

  GS.accion('curso-check', async (el) => {
    const { ins, k, st } = ctx();
    const m = k.modulos.find((x) => x.id === el.dataset.id);
    if (!ins) { st.checksPreview = st.checksPreview || {}; const a = st.checksPreview[m.id] = st.checksPreview[m.id] || []; a[Number(el.dataset.j)] = el.checked; return; }
    if (GS.soloLectura()) { GS.toast(GS.t('Modo solo lectura: en "ver como" no se guardan cambios.')); return; }
    const checks = Object.assign({}, ins.checks);
    const a = (checks[m.id] || []).slice();
    a[Number(el.dataset.j)] = el.checked;
    checks[m.id] = a;
    await S().update('inscripciones', ins.id, { checks });
  });

  // Marca el módulo actual como hecho y avanza. Si era el último, cierra el curso.
  async function completar(k, ins, st, extra) {
    const m = k.modulos[st.cur];
    const cambios = Object.assign({}, extra || {});
    const h = ins.hechos.includes(m.id) ? ins.hechos.slice() : ins.hechos.concat([m.id]);
    cambios.hechos = h;
    const todos = k.modulos.every((x) => h.includes(x.id));
    if (todos && !ins.completadoEn) cambios.completadoEn = GS.hoy();
    await S().update('inscripciones', ins.id, cambios);
    if (todos) { st.vista = ins.encuesta ? 'fin' : 'encuesta'; if (cambios.completadoEn) GS.toast(GS.t('¡Terminaste el curso!')); }
    else { const sig = k.modulos.findIndex((x, i) => i > st.cur && !h.includes(x.id)); st.cur = sig >= 0 ? sig : Math.min(st.cur + 1, k.modulos.length - 1); st.vista = 'contenido'; }
  }

  GS.accion('curso-avanzar', async () => {
    const { yo, k, ins, st } = ctx();
    const m = k.modulos[st.cur];
    const hecho = ins && ins.hechos.includes(m.id);
    const q = ins && ins.quiz[m.id];
    if (m.quiz && !hecho && !(q && q.aprobado)) { st.vista = 'quiz'; st.resp = {}; st.quizEnviado = false; return; }
    if (!ins) { // vista previa: solo navega
      if (st.cur < k.modulos.length - 1) st.cur++;
      else GS.toast(GS.t('Fin de la vista previa.'));
      return;
    }
    if (hecho) {
      if (st.cur === k.modulos.length - 1) { st.vista = ins.completadoEn ? (ins.encuesta ? 'fin' : 'encuesta') : 'contenido'; }
      else st.cur++;
      return;
    }
    if (GS.soloLectura()) { GS.toast(GS.t('Modo solo lectura: en "ver como" no se guardan cambios.')); return false; }
    const extra = {};
    if (m.tipo === 'politica') extra.firmas = Object.assign({}, ins.firmas, { [m.id]: { fecha: GS.hoy(), nombre: yo.nombre, rut: yo.rut } });
    await completar(k, ins, st, extra);
  });

  GS.accion('quiz-resp', (el) => { GS.ui.curso.resp[Number(el.dataset.i)] = Number(el.dataset.j); });
  GS.accion('quiz-reintentar', () => { const st = GS.ui.curso; st.resp = {}; st.quizEnviado = false; });
  GS.accion('quiz-enviar', async () => {
    const { k, ins, st } = ctx();
    const m = k.modulos[st.cur];
    const preg = m.quiz.preguntas;
    const nota = Math.round(preg.filter((p, i) => st.resp[i] === p.ok).length / preg.length * 100);
    st.quizEnviado = true;
    if (!ins) return;
    if (GS.soloLectura()) return;
    const prev = ins.quiz[m.id] || { intentos: 0 };
    const quiz = Object.assign({}, ins.quiz, { [m.id]: { intentos: prev.intentos + 1, aprobado: prev.aprobado || nota >= k.config.notaMinima, nota: Math.max(prev.nota || 0, nota) } });
    await S().update('inscripciones', ins.id, { quiz });
  });
  GS.accion('quiz-seguir', async () => {
    const { k, ins, st } = ctx();
    st.resp = {}; st.quizEnviado = false;
    if (!ins || GS.soloLectura()) { st.vista = 'contenido'; if (st.cur < k.modulos.length - 1) st.cur++; return; }
    await completar(k, ins, st);
  });

  GS.accion('enc', (el) => { const v = el.dataset.v; GS.ui.curso.enc[el.dataset.campo] = /^\d$/.test(v) ? Number(v) : v; });
  GS.accion('enc-enviar', async () => {
    const { ins, st } = ctx();
    const e = st.enc;
    await S().update('inscripciones', ins.id, { encuesta: { utilidad: e.utilidad, claridad: e.claridad, recomienda: e.recomienda, comentario: String(e.comentario || '').trim() } });
    st.vista = 'fin';
    GS.toast(GS.t('Gracias por tu respuesta.'));
  }, { escribe: true });
})(window.GS);
