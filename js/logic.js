// Reglas de Grey Skills: roles, visibilidad de cursos, avance, estados y equipos.
window.GS = window.GS || {};

(function (GS) {
  const S = () => GS.store;

  // ---------- Catálogos fijos ----------
  GS.ROLES = {
    trabajador: 'Trabajador', jefatura: 'Jefatura', gerente: 'Gerente', visualizador: 'Visualizador', admin: 'Administrador'
  };
  GS.CATEGORIAS = [
    { id: 'residente', l: 'Atención al residente' },
    { id: 'seguridad', l: 'Seguridad' },
    { id: 'cultura', l: 'Cultura' },
    { id: 'herramientas', l: 'Herramientas' }
  ];
  GS.GRUPOS_CARGO = ['Guest Service', 'Aseo', 'Mantención', 'Building Manager Assistant', 'Building Manager', 'Cargos de oficina central'];
  GS.TIPOS_MODULO = {
    video: { l: 'Video', c: 'c-sky' },
    documento: { l: 'Documento', c: 'c-none' },
    checklist: { l: 'Checklist', c: 'c-suave' },
    politica: { l: 'Política', c: 'c-gris' }
  };
  GS.ESTADOS_CURSO = {
    borrador: { l: 'Borrador', c: 'c-gris' },
    revision: { l: 'En revisión', c: 'c-sky' },
    devuelto: { l: 'Devuelto', c: 'c-warn' },
    publicado: { l: 'Publicado', c: 'c-ok' },
    archivado: { l: 'Archivado', c: 'c-suave' }
  };
  GS.SEM = {
    ok: { l: 'Al día', c: 'c-ok' },
    warn: { l: 'Por vencer', c: 'c-warn' },
    late: { l: 'Vencido', c: 'c-late' },
    done: { l: 'Completado', c: 'c-done' },
    none: { l: 'Sin fecha límite', c: 'c-none' }
  };
  GS.PORTADAS = [['#0A2245', 'Navy', '#92C9EB'], ['#0077D4', 'Ocean', '#FFFFFF'], ['#92C9EB', 'Sky', '#0A2245'], ['#F5EBDC', 'Stucco', '#0A2245']];
  GS.tintaPortada = (hex) => (GS.PORTADAS.find((p) => p[0] === hex) || GS.PORTADAS[0])[2];
  GS.DIAS_POR_VENCER = 7;

  // ---------- Accesos rápidos ----------
  GS.persona = (id) => S().get('personas', id);
  GS.unidad = (id) => S().get('unidades', id);
  GS.cargo = (id) => S().get('cargos', id);
  GS.curso = (id) => S().get('cursos', id);
  GS.categoriaL = (id) => (GS.CATEGORIAS.find((c) => c.id === id) || { l: id }).l;
  GS.nombreDe = (id) => { const p = GS.persona(id); return p ? p.nombre : '—'; };
  GS.cargoDe = (p) => { const c = p && GS.cargo(p.cargoId); return c ? c.nombre : '—'; };
  GS.unidadDe = (p) => { const u = p && GS.unidad(p.unidadId); return u ? u.nombre : '—'; };
  GS.personasActivas = () => S().where('personas', (p) => p.activo);

  // Lugar de trabajo para el alcance de un curso: su edificio, o la oficina central.
  GS.OFICINA = { id: 'oficina', nombre: 'Oficina central' };
  GS.lugares = () => S().where('unidades', (u) => u.tipo === 'edificio').concat([GS.OFICINA]);
  GS.lugarDe = (p) => { const u = GS.unidad(p.unidadId); return u && u.tipo === 'edificio' ? u.id : 'oficina'; };
  GS.grupoDe = (p) => { const c = GS.cargo(p.cargoId); return c ? c.grupo : ''; };
  GS.nombreLugar = (id) => (id === 'oficina' ? GS.OFICINA.nombre : (GS.unidad(id) || { nombre: id }).nombre);

  // ---------- Alcance de cursos ----------
  GS.visiblePara = (curso, p) => {
    if (curso.estado !== 'publicado') return false;
    const a = curso.alcance || {};
    const okLugar = a.edificios === 'todos' || (a.edificios || []).includes(GS.lugarDe(p));
    const okCargo = a.cargos === 'todos' || (a.cargos || []).includes(GS.grupoDe(p));
    return okLugar && okCargo;
  };
  GS.esParaTodos = (a) => a && a.edificios === 'todos' && a.cargos === 'todos';
  GS.alcanceTexto = (a) => {
    if (!a) return '';
    const ed = a.edificios === 'todos' ? 'todos los edificios y la oficina central'
      : (a.edificios.length ? a.edificios.map(GS.nombreLugar).join(', ') : 'ningún edificio elegido aún');
    const cg = a.cargos === 'todos' ? 'todos los cargos' : (a.cargos.length ? a.cargos.join(', ') : 'ningún cargo elegido aún');
    return cg + ' de ' + ed;
  };
  GS.alcanceEdificiosCorto = (a) => (a.edificios === 'todos' ? 'Todos' : a.edificios.map((id) => GS.nombreLugar(id).replace('Edificio ', '')).join(', ') || '—');
  GS.alcanceCargosCorto = (a) => (a.cargos === 'todos' ? 'Todos' : a.cargos.map((c) => c.replace('Building Manager Assistant', 'BMA').replace('Cargos de oficina central', 'Oficina')).join(', ') || '—');

  // ---------- Avance ----------
  GS.ins = (personaId, cursoId) => S().all('inscripciones').find((i) => i.personaId === personaId && i.cursoId === cursoId) || null;
  GS.insDe = (personaId) => S().where('inscripciones', (i) => i.personaId === personaId && GS.curso(i.cursoId));
  GS.hechosValidos = (ins) => { const k = GS.curso(ins.cursoId); return k ? k.modulos.filter((m) => ins.hechos.includes(m.id)).map((m) => m.id) : []; };
  GS.avance = (ins) => {
    if (ins.completadoEn) return 100;
    const k = GS.curso(ins.cursoId);
    if (!k || !k.modulos.length) return 0;
    return Math.round(GS.hechosValidos(ins).length / k.modulos.length * 100);
  };
  GS.estado = (ins) => {
    if (ins.completadoEn) return 'done';
    if (!ins.plazo) return 'none';
    const d = GS.diasEntre(GS.hoy(), ins.plazo);
    if (d < 0) return 'late';
    if (d <= GS.DIAS_POR_VENCER) return 'warn';
    return 'ok';
  };
  GS.plazoTxt = (ins, corto) => {
    const f = corto ? GS.fechaCorta : GS.fecha;
    if (ins.completadoEn) return 'Terminado el ' + f(ins.completadoEn);
    if (!ins.plazo) return corto ? 'Sin fecha' : 'Sin fecha límite';
    return (GS.estado(ins) === 'late' ? 'Venció el ' : 'Vence el ') + f(ins.plazo);
  };
  GS.resumenPersona = (p) => {
    const cursos = GS.insDe(p.id).map((ins) => ({ ins, curso: GS.curso(ins.cursoId), pct: GS.avance(ins), k: GS.estado(ins) }));
    const avg = cursos.length ? Math.round(cursos.reduce((a, c) => a + c.pct, 0) / cursos.length) : 0;
    return { persona: p, cursos, avg, total: cursos.length, vencidos: cursos.filter((c) => c.k === 'late').length };
  };
  GS.valoracion = (cursoId) => {
    const r = S().where('inscripciones', (i) => i.cursoId === cursoId && i.encuesta);
    if (!r.length) return null;
    const prom = r.reduce((a, i) => a + (i.encuesta.utilidad + i.encuesta.claridad) / 2, 0) / r.length;
    return { prom: prom.toFixed(1).replace('.', ','), n: r.length };
  };
  GS.inscritos = (cursoId) => S().where('inscripciones', (i) => i.cursoId === cursoId).length;

  // ---------- Equipos ----------
  GS.equipo = (jefeId) => S().where('personas', (p) => p.jefeId === jefeId && p.activo);
  GS.equipoTodos = (jefeId) => S().where('personas', (p) => p.jefeId === jefeId);
  GS.puedeVerEquipo = (p) => ['jefatura', 'gerente', 'visualizador'].includes(p.rol);

  // Contexto de "Mi equipo" / "Seguimiento" según el rol y la unidad elegida.
  GS.contextoEquipo = (yo, sel) => {
    if (yo.rol === 'visualizador') {
      const opciones = (yo.sigue || []).map((uid) => ({ id: uid, l: (GS.unidad(uid) || { nombre: uid }).nombre }));
      const s = opciones.find((o) => o.id === sel) || opciones[0];
      return {
        titulo: 'Seguimiento', opciones, sel: s ? s.id : null, editable: false,
        sub: s ? s.l + ' · unidad asignada a tu seguimiento' : 'La administración aún no te asigna unidades para seguir.',
        msg: 'Tienes acceso de visualizador a las unidades que te asignó la administración. Puedes revisar avances, sin editar.',
        personas: s ? S().where('personas', (p) => p.unidadId === s.id && p.activo) : []
      };
    }
    if (yo.rol === 'gerente') {
      const directos = GS.equipo(yo.id);
      const opciones = [{ id: 'directo', l: 'Mi equipo directo' }].concat(
        directos.filter((d) => GS.equipo(d.id).length).map((d) => ({ id: d.id, l: GS.unidadDe(d) })));
      const s = opciones.find((o) => o.id === sel) || opciones[0];
      if (s.id === 'directo') {
        return { titulo: 'Mi equipo', opciones, sel: s.id, editable: true, sub: GS.unidadDe(yo) + ' · tu equipo directo', personas: directos };
      }
      return {
        titulo: 'Mi equipo', opciones, sel: s.id, editable: false,
        sub: s.l + ' · equipo de ' + GS.nombreDe(s.id),
        msg: 'Estás viendo este equipo como gerente. Puedes revisar avances; las asignaciones y cambios los hace su jefatura directa.',
        personas: GS.equipo(s.id)
      };
    }
    const personas = GS.equipo(yo.id);
    return { titulo: 'Mi equipo', opciones: [], sel: null, editable: true, sub: GS.unidadDe(yo) + ' · ' + GS.plural(personas.length, 'persona', 'personas'), personas };
  };

  GS.rutaDeCargo = (cargoId) => S().all('rutas').find((r) => r.cargoId === cargoId) || null;
  GS.cursosPublicados = () => S().where('cursos', (k) => k.estado === 'publicado');

  // ---------- Operaciones que escriben ----------
  GS.ops = {
    // Asigna cursos a personas. Si ya estaba inscrita por su cuenta, pasa a "asignado" y toma el plazo.
    async asignar({ personaIds, cursoIds, plazo, por }) {
      let nuevos = 0, actualizados = 0;
      const crear = [];
      for (const pid of personaIds) {
        for (const kid of cursoIds) {
          const ex = GS.ins(pid, kid);
          if (ex) {
            if (ex.completadoEn) continue;
            const cambios = { origen: 'asignado', asignadoPor: por };
            if (plazo) cambios.plazo = plazo;
            await S().update('inscripciones', ex.id, cambios);
            actualizados++;
          } else {
            crear.push(GS.ops.nuevaInscripcion(pid, kid, 'asignado', plazo || null, por));
            nuevos++;
          }
        }
      }
      if (crear.length) await S().addMany('inscripciones', crear);
      return { nuevos, actualizados };
    },
    nuevaInscripcion(personaId, cursoId, origen, plazo, por) {
      const k = GS.curso(cursoId);
      return {
        personaId, cursoId, origen, asignadoPor: por || null, plazo: plazo || null, version: k ? k.version : 1,
        hechos: [], checks: {}, firmas: {}, quiz: {}, creadoEn: GS.ahora(), completadoEn: null, encuesta: null
      };
    }
  };
})(window.GS);
