// Datos de prueba. Se cargan la primera vez y con "Restablecer datos de prueba".
// Ninguna persona es real: los RUT son ficticios (con dígito verificador válido).
window.GS = window.GS || {};

(function (GS) {
  GS.SEED_VERSION = 1;

  function rutCon(cuerpo) {
    let suma = 0, mul = 2;
    const s = String(cuerpo);
    for (let i = s.length - 1; i >= 0; i--) { suma += Number(s[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
    const r = 11 - (suma % 11);
    return GS.formatearRut(s + (r === 11 ? '0' : r === 10 ? 'K' : String(r)));
  }

  GS.seed = function () {
    const hoy = GS.hoy();
    const dia = (n) => GS.sumarDias(hoy, n);
    const ahora = GS.ahora();

    // ---------- Estructura ----------
    const edificios = ['Nativo', 'Brooklyn', 'IMU', 'Bellet', 'Holley', 'Spot NK', 'Spot R', 'Boldo', 'Central', 'Park', 'Soho'];
    const unidades = [
      { id: 'u-op', nombre: 'Gerencia de Operaciones', tipo: 'gerencia', padreId: null, jefeId: 'p-marcela' },
      { id: 'u-com', nombre: 'Gerencia Comercial', tipo: 'gerencia', padreId: null, jefeId: null },
      { id: 'u-fin', nombre: 'Gerencia de Finanzas', tipo: 'gerencia', padreId: null, jefeId: null },
      { id: 'u-rrhh', nombre: 'Gerencia de RRHH', tipo: 'gerencia', padreId: null, jefeId: null }
    ].concat(edificios.map((e) => ({
      id: 'u-' + GS.normalizar(e).replace(/\s+/g, '-'),
      nombre: 'Edificio ' + e, tipo: 'edificio', padreId: 'u-op',
      jefeId: { Nativo: 'p-andres', Brooklyn: 'p-tomas', IMU: 'p-carolina' }[e] || null
    })));

    const cargos = [
      { id: 'c-gs', nombre: 'Guest Service', grupo: 'Guest Service' },
      { id: 'c-aseo', nombre: 'Aseo', grupo: 'Aseo' },
      { id: 'c-mant', nombre: 'Mantención', grupo: 'Mantención' },
      { id: 'c-bma', nombre: 'Building Manager Assistant', grupo: 'Building Manager Assistant' },
      { id: 'c-bm', nombre: 'Building Manager', grupo: 'Building Manager' },
      { id: 'c-gop', nombre: 'Gerente de Operaciones', grupo: 'Cargos de oficina central' },
      { id: 'c-pp', nombre: 'People Partner', grupo: 'Cargos de oficina central' },
      { id: 'c-hrbp', nombre: 'HR Business Partner', grupo: 'Cargos de oficina central' },
      { id: 'c-analista', nombre: 'Analista', grupo: 'Cargos de oficina central' }
    ];

    // ---------- Personas ----------
    const P = (id, nombre, rut, rol, unidadId, cargoId, jefeId, extra) => Object.assign(
      { id, nombre, rut: rutCon(rut), rol, unidadId, cargoId, jefeId, activo: true, rutas: [], sigue: [], creadoEn: ahora }, extra || {});
    const personas = [
      P('p-josefina', 'Josefina Chaná', 16234567, 'admin', 'u-rrhh', 'c-hrbp', null),
      P('p-marcela', 'Marcela Vidal', 10111222, 'gerente', 'u-op', 'c-gop', null),
      P('p-paula', 'Paula Herrera', 15444555, 'visualizador', 'u-rrhh', 'c-pp', null, { sigue: ['u-nativo', 'u-brooklyn'] }),
      P('p-andres', 'Andrés Soto', 11222333, 'jefatura', 'u-nativo', 'c-bm', 'p-marcela', { rutas: ['r-bm'] }),
      P('p-francisca', 'Francisca Araya', 16789012, 'trabajador', 'u-nativo', 'c-bma', 'p-andres', { rutas: ['r-bma'] }),
      P('p-camila', 'Camila Rojas', 12345678, 'trabajador', 'u-nativo', 'c-gs', 'p-andres', { rutas: ['r-gs'] }),
      P('p-diego', 'Diego Muñoz', 13456789, 'trabajador', 'u-nativo', 'c-gs', 'p-andres', { rutas: ['r-gs'] }),
      P('p-valentina', 'Valentina Pérez', 14567890, 'trabajador', 'u-nativo', 'c-aseo', 'p-andres', { rutas: ['r-aseo'] }),
      P('p-matias', 'Matías Contreras', 17890123, 'trabajador', 'u-nativo', 'c-aseo', 'p-andres', { rutas: ['r-aseo'] }),
      P('p-tomas', 'Tomás Reyes', 13222444, 'jefatura', 'u-brooklyn', 'c-bm', 'p-marcela', { rutas: ['r-bm'] }),
      P('p-jorge', 'Jorge Fuentes', 15678901, 'trabajador', 'u-brooklyn', 'c-mant', 'p-tomas', { rutas: ['r-mant'] }),
      P('p-ignacia', 'Ignacia Morales', 18123456, 'trabajador', 'u-brooklyn', 'c-gs', 'p-tomas', { rutas: ['r-gs'] }),
      P('p-felipe', 'Felipe Castro', 17345678, 'trabajador', 'u-brooklyn', 'c-aseo', 'p-tomas', { rutas: ['r-aseo'] }),
      P('p-carolina', 'Carolina Díaz', 14222111, 'jefatura', 'u-imu', 'c-bm', 'p-marcela', { rutas: ['r-bm'] }),
      P('p-rocio', 'Rocío Silva', 19234567, 'trabajador', 'u-imu', 'c-aseo', 'p-carolina', { rutas: ['r-aseo'] }),
      P('p-benjamin', 'Benjamín Torres', 18765432, 'trabajador', 'u-imu', 'c-gs', 'p-carolina', { rutas: ['r-gs'] })
    ];

    // ---------- Cursos ----------
    let n = 0;
    const mid = () => 'm' + (++n);
    const Q = (q, alts, ok) => ({ q, alts, ok });
    const V = (titulo, preguntas) => ({ id: mid(), tipo: 'video', titulo, url: '', indicaciones: '', quiz: preguntas ? { preguntas } : null });
    const D = (titulo, indicaciones, preguntas) => ({ id: mid(), tipo: 'documento', titulo, url: '', indicaciones: indicaciones || '', quiz: preguntas ? { preguntas } : null });
    const C = (titulo, items) => ({ id: mid(), tipo: 'checklist', titulo, items, quiz: null });
    const POL = (titulo, texto) => ({ id: mid(), tipo: 'politica', titulo, texto, url: '', quiz: null });
    const TODOS = { edificios: 'todos', cargos: 'todos' };
    const cfg = (duracion, extra) => Object.assign({ orden: 'sec', notaMinima: 70, intentos: 0, duracion, certificado: true }, extra || {});
    const K = (id, titulo, categoria, portada, descripcion, modulos, config, extra) => Object.assign({
      id, titulo, categoria, portada, descripcion, modulos, config,
      autorId: 'p-josefina', estado: 'publicado', alcance: TODOS, nota: '', version: 1,
      creadoEn: ahora, actualizadoEn: ahora, publicadoEn: ahora
    }, extra || {});

    const textoReglamento = 'Este reglamento resume las normas básicas de orden, higiene y seguridad de Greystar Chile.\n\n1. Responsabilidades del personal: cumplir los protocolos del edificio, usar los elementos de protección personal y avisar de inmediato cualquier condición insegura.\n\n2. Comunicación: ante una emergencia, informar a la jefatura y a los servicios de emergencia según el protocolo del edificio.\n\n3. Registro: todo incidente debe quedar registrado el mismo día.\n\n[Texto de ejemplo. La administración reemplaza este contenido al editar el curso.]';

    const cursos = [
      K('k-ind', 'Inducción Greystar', 'cultura', '#0A2245', 'Quiénes somos, cómo funciona tu edificio y qué necesitas saber en tus primeros días.', [
        V('Bienvenida a Greystar', [Q('¿Qué es lo más importante en la atención de un residente?', ['Resolver rápido aunque sea a medias', 'Escuchar, resolver y avisar cuando está listo', 'Derivar todo a la administración', 'Responder solo por correo'], 1), Q('¿A quién avisas primero si detectas un problema en el edificio?', ['A un residente', 'A tu jefatura directa', 'A nadie, lo resuelves solo', 'Al conserje del edificio vecino'], 1)]),
        D('Organigrama y contactos clave', 'Revisa quién es quién y guarda los contactos de emergencia.'),
        V('Nuestros valores'),
        POL('Reglamento interno de orden, higiene y seguridad', textoReglamento),
        C('Tu primer día: recorrido por el edificio', ['Conocí la sala de basura y reciclaje', 'Sé dónde están los tableros eléctricos', 'Ubiqué la sala de bombas y la red húmeda', 'Tengo el teléfono de mi jefatura'])
      ], cfg('50 min')),
      K('k-odi', 'Prevención de riesgos: ODI', 'seguridad', '#0077D4', 'Los riesgos de tu puesto, cómo prevenirlos y qué hacer si ocurre un accidente.', [
        V('Riesgos de tu puesto de trabajo', [Q('¿Qué significa ODI?', ['Orden de inspección', 'Obligación de informar', 'Oficio de investigación', 'Organización de turnos'], 1), Q('Si ves una condición insegura, ¿qué haces?', ['La ignoro si no es mi área', 'La informo de inmediato a mi jefatura', 'Espero a que alguien más la vea', 'La comento al final del mes'], 1)]),
        D('Obligación de informar los riesgos laborales', 'Lee el documento completo. Al terminar, marca que lo leíste.'),
        C('Elementos de protección personal', ['Tengo zapatos de seguridad', 'Tengo guantes adecuados a mi tarea', 'Sé dónde se guarda el botiquín']),
        POL('Declaración de toma de conocimiento ODI', 'Declaro haber sido informado de los riesgos asociados a mi puesto de trabajo, de las medidas preventivas y de los métodos de trabajo correctos.\n\n[Texto de ejemplo.]')
      ], cfg('40 min')),
      K('k-ate', 'Atención al residente', 'residente', '#92C9EB', 'Cómo recibir, escuchar y resolver lo que necesita cada residente.', [
        V('El primer contacto'),
        V('Escuchar y resolver', [Q('Un residente llega molesto. ¿Qué haces primero?', ['Le explicas las reglas', 'Lo escuchas sin interrumpir', 'Le pides que escriba un correo', 'Llamas a tu jefatura'], 1)]),
        D('Guía de respuestas frecuentes'),
        C('Checklist de recepción', ['Saludo y me presento', 'Registro la solicitud', 'Confirmo plazos con el residente', 'Aviso cuando está resuelto'])
      ], cfg('45 min')),
      K('k-eme', 'Protocolo de emergencias', 'seguridad', '#0A2245', 'Qué hacer ante incendio, sismo o cortes de agua y luz.', [
        V('Qué hacer ante un sismo', [
          Q('Durante un sismo, ¿qué es lo primero que debes hacer?', ['Salir corriendo del edificio', 'Ubicarte en una zona de seguridad, lejos de ventanas', 'Usar el ascensor para bajar', 'Llamar a la administración'], 1),
          Q('¿Se puede usar el ascensor durante una evacuación?', ['Sí, si funciona', 'Solo con residentes mayores', 'No, nunca', 'Solo el personal'], 2),
          Q('Un residente entra en pánico en el hall. ¿Qué haces?', ['Le pides que se calme y sigues con lo tuyo', 'Le hablas con calma y lo guías a la zona de seguridad', 'Lo dejas solo para no empeorar la situación', 'Llamas a su familia'], 1),
          Q('Después del sismo, ¿cuándo se evacua el edificio?', ['Siempre, de inmediato', 'Cuando lo indique el encargado de emergencias según el protocolo', 'Nunca', 'Cuando los residentes lo pidan'], 1)
        ]),
        D('Plano de evacuación del edificio', 'Ubica las salidas de emergencia y la zona de seguridad de tu edificio.'),
        C('Revisión de extintores y red húmeda', ['Extintores con carga vigente', 'Señalética de evacuación visible', 'Gabinete de red húmeda sin obstrucciones']),
        POL('Reglamento de seguridad del edificio', textoReglamento)
      ], cfg('40 min')),
      K('k-rec', 'Manejo de reclamos difíciles', 'residente', '#0077D4', 'Herramientas para conversaciones tensas sin perder la calma.', [
        V('Por qué escalan los reclamos'),
        V('Técnicas para bajar la tensión', [Q('¿Qué ayuda más a bajar la tensión?', ['Subir la voz para que te escuchen', 'Reconocer la molestia y proponer un siguiente paso', 'Decir que no es tu responsabilidad', 'Cortar la conversación'], 1)]),
        C('Después del reclamo', ['Registré el caso', 'Avisé a mi jefatura', 'Hice seguimiento con el residente'])
      ], cfg('30 min')),
      K('k-kar', 'Prevención del acoso laboral (Ley Karin)', 'cultura', '#0A2245', 'Qué es el acoso laboral y sexual, y cómo denunciar.', [
        V('Qué dice la Ley Karin'),
        D('Procedimiento de denuncia'),
        POL('Protocolo de prevención del acoso', 'Greystar Chile promueve un ambiente de trabajo libre de acoso laboral, sexual y violencia.\n\n[Texto de ejemplo.]')
      ], cfg('35 min')),
      K('k-aseo', 'Uso seguro de productos de aseo', 'seguridad', '#F5EBDC', 'Cómo usar, mezclar y guardar productos de aseo sin riesgos.', [
        V('Lectura de etiquetas y hojas de seguridad'),
        C('Bodega de productos', ['Productos rotulados', 'Separados de alimentos', 'Hoja de seguridad disponible'])
      ], cfg('25 min'), { alcance: { edificios: 'todos', cargos: ['Aseo'] } }),
      K('k-mant', 'Mantención preventiva básica', 'herramientas', '#92C9EB', 'Rutinas de revisión para evitar fallas en el edificio.', [
        V('Plan de mantención del edificio'),
        D('Bitácora de mantención'),
        C('Ronda semanal', ['Bombas de agua', 'Iluminación de áreas comunes', 'Portones y accesos'])
      ], cfg('60 min'), { alcance: { edificios: 'todos', cargos: ['Mantención', 'Building Manager'] } }),
      K('k-lid', 'Liderazgo de equipos operativos', 'cultura', '#0A2245', 'Cómo organizar turnos, dar feedback y acompañar a tu equipo.', [
        V('El rol de la jefatura'),
        V('Dar feedback que sirve'),
        D('Planificación de turnos'),
        C('Conversaciones uno a uno', ['Agendé una conversación con cada persona', 'Acordamos un objetivo', 'Registré los acuerdos'])
      ], cfg('90 min'), { alcance: { edificios: 'todos', cargos: ['Building Manager', 'Building Manager Assistant', 'Cargos de oficina central'] } }),
      K('k-pres', 'Presupuesto del edificio', 'herramientas', '#0077D4', 'Cómo se arma y controla el presupuesto anual del edificio.', [
        V('Partidas del presupuesto'),
        D('Planilla de control mensual'),
        V('Cómo presentar desviaciones')
      ], cfg('60 min'), { alcance: { edificios: 'todos', cargos: ['Building Manager'] } }),
      K('k-esc', 'Comunicación por escrito', 'herramientas', '#F5EBDC', 'Correos y avisos claros para residentes y equipo.', [
        V('Escribir para que te entiendan'),
        D('Plantillas de avisos')
      ], cfg('20 min')),
      K('k-xls', 'Excel básico para operaciones', 'herramientas', '#F5EBDC', 'Planillas de turnos, inventarios y registros sin enredos.', [
        V('Conociendo Excel'), V('Fórmulas básicas'), V('Planilla de turnos'), V('Inventarios'), D('Ejercicios'), V('Filtros y orden')
      ], cfg('60 min'), { alcance: { edificios: 'todos', cargos: ['Guest Service', 'Building Manager Assistant'] } }),
      K('k-cul', 'Cultura Greystar', 'cultura', '#92C9EB', 'Quiénes somos, cómo trabajamos y qué esperamos unos de otros.', [
        V('Nuestra historia'), V('Cómo trabajamos'), D('Código de conducta')
      ], cfg('25 min')),
      K('k-pisc', 'Uso de piscina y quinchos', 'residente', '#0077D4', 'Reglas de uso, reservas y revisión de espacios comunes.', [
        D('Reglamento de piscina y quinchos'),
        C('Revisión antes de entregar un quincho', ['Parrilla limpia', 'Basureros vacíos', 'Inventario completo'])
      ], cfg('20 min'), { alcance: { edificios: ['u-brooklyn', 'u-park', 'u-soho'], cargos: ['Guest Service', 'Aseo'] } }),
      K('k-bienv', 'Bienvenida al Edificio Nativo', 'cultura', '#92C9EB', 'Todo lo que necesitas saber para empezar en el Edificio Nativo.', [
        V('Recorrido virtual'), C('Primer día en Nativo', ['Recibí mis llaves', 'Conocí al equipo', 'Revisé el libro de novedades'])
      ], cfg('15 min'), { autorId: 'p-andres', alcance: { edificios: ['u-nativo'], cargos: 'todos' } }),
      K('k-apert', 'Apertura y cierre de turno', 'herramientas', '#0A2245', 'Pasos para recibir y entregar el turno sin que se pierda nada.', [
        C('Apertura de turno', ['Leí el libro de novedades', 'Revisé cámaras', 'Revisé encomiendas pendientes']),
        C('Cierre de turno', ['Anoté novedades', 'Entregué llaves', 'Avisé pendientes al siguiente turno']),
        V('Errores frecuentes')
      ], cfg('20 min'), { autorId: 'p-andres', estado: 'revision', publicadoEn: null, alcance: { edificios: ['u-nativo'], cargos: ['Guest Service'] } }),
      K('k-enco', 'Uso del sistema de encomiendas', 'herramientas', '#0077D4', 'Cómo registrar y entregar encomiendas.', [
        V('Registro de encomiendas'), V('Entrega al residente')
      ], cfg('15 min'), { autorId: 'p-andres', estado: 'devuelto', nota: 'Agregar un quiz al final del módulo 2.', publicadoEn: null, alcance: { edificios: ['u-nativo'], cargos: ['Guest Service'] } }),
      K('k-areas', 'Checklist de áreas comunes', 'herramientas', '#F5EBDC', 'Revisión diaria de áreas comunes.', [
        C('Ronda de la mañana', ['Hall de acceso', 'Ascensores', 'Estacionamientos'])
      ], cfg('10 min'), { autorId: 'p-andres', estado: 'borrador', publicadoEn: null, alcance: { edificios: ['u-nativo'], cargos: 'todos' } }),
      K('k-eme-old', 'Protocolo de emergencias (versión anterior)', 'seguridad', '#0A2245', 'Versión anterior del protocolo de emergencias.', [
        V('Sismos e incendios')
      ], cfg('30 min'), { estado: 'archivado' })
    ];

    // ---------- Rutas ----------
    const rutas = [
      { id: 'r-gs', nombre: 'Ruta Guest Service', cargoId: 'c-gs', cursos: ['k-ind', 'k-odi', 'k-kar', 'k-ate', 'k-eme', 'k-rec'] },
      { id: 'r-aseo', nombre: 'Ruta Aseo', cargoId: 'c-aseo', cursos: ['k-ind', 'k-odi', 'k-kar', 'k-aseo', 'k-eme'] },
      { id: 'r-mant', nombre: 'Ruta Mantención', cargoId: 'c-mant', cursos: ['k-ind', 'k-odi', 'k-kar', 'k-mant', 'k-eme'] },
      { id: 'r-bma', nombre: 'Ruta Building Manager Assistant', cargoId: 'c-bma', cursos: ['k-ind', 'k-odi', 'k-kar', 'k-ate', 'k-rec', 'k-xls'] },
      { id: 'r-bm', nombre: 'Ruta Building Manager', cargoId: 'c-bm', cursos: ['k-ind', 'k-odi', 'k-kar', 'k-lid', 'k-pres', 'k-rec'] },
      { id: 'r-lid', nombre: 'Ruta de liderazgo', cargoId: null, cursos: ['k-lid', 'k-esc', 'k-rec'] },
      { id: 'r-dig', nombre: 'Ruta de herramientas digitales', cargoId: null, cursos: ['k-xls', 'k-esc'] }
    ];

    // ---------- Inscripciones (avance) ----------
    const curso = (id) => cursos.find((c) => c.id === id);
    const persona = (id) => personas.find((p) => p.id === id);
    const inscripciones = [];
    let encN = 0;
    function I(personaId, cursoId, origen, plazoDias, pct) {
      const k = curso(cursoId);
      const nHechos = Math.round(pct / 100 * k.modulos.length);
      const hechos = k.modulos.slice(0, nHechos).map((m) => m.id);
      const terminado = nHechos === k.modulos.length;
      const asignadoPor = origen === 'asignado' ? (persona(personaId).jefeId || 'p-josefina') : null;
      const ins = {
        id: 'i-' + personaId.slice(2) + '-' + cursoId.slice(2), personaId, cursoId, origen, asignadoPor,
        plazo: plazoDias == null ? null : dia(plazoDias), version: k.version,
        hechos, checks: {}, firmas: {}, quiz: {}, creadoEn: ahora,
        completadoEn: terminado ? dia(-20 - (inscripciones.length % 15)) : null, encuesta: null
      };
      if (terminado) {
        encN++;
        ins.encuesta = { utilidad: encN % 3 === 0 ? 4 : 5, claridad: encN % 4 === 0 ? 3 : 4 + (encN % 2), recomienda: encN % 5 === 0 ? 'Tal vez' : 'Sí', comentario: '' };
        ins.hechos.forEach((h) => {
          const m = k.modulos.find((x) => x.id === h);
          if (m.tipo === 'politica') ins.firmas[h] = { fecha: ins.completadoEn };
          if (m.quiz) ins.quiz[h] = { intentos: 1, aprobado: true, nota: 100 };
        });
      }
      inscripciones.push(ins);
    }
    I('p-camila', 'k-ind', 'asignado', 3, 80); I('p-camila', 'k-odi', 'asignado', -2, 40); I('p-camila', 'k-ate', 'asignado', 23, 25);
    I('p-camila', 'k-xls', 'inscrito', null, 50); I('p-camila', 'k-kar', 'asignado', null, 100); I('p-camila', 'k-eme', 'asignado', 30, 0);
    I('p-valentina', 'k-odi', 'asignado', -2, 25); I('p-valentina', 'k-ind', 'asignado', null, 100); I('p-valentina', 'k-eme', 'asignado', 23, 0);
    I('p-matias', 'k-ind', 'asignado', 10, 0); I('p-matias', 'k-odi', 'asignado', 10, 0);
    I('p-diego', 'k-ind', 'asignado', null, 100); I('p-diego', 'k-odi', 'asignado', null, 100); I('p-diego', 'k-ate', 'asignado', 23, 50);
    I('p-francisca', 'k-ate', 'asignado', null, 0); I('p-francisca', 'k-esc', 'inscrito', null, 100);
    I('p-andres', 'k-ind', 'asignado', null, 100); I('p-andres', 'k-odi', 'asignado', null, 100); I('p-andres', 'k-cul', 'inscrito', null, 67); I('p-andres', 'k-lid', 'asignado', 30, 25);
    I('p-tomas', 'k-ind', 'asignado', null, 100); I('p-tomas', 'k-odi', 'asignado', 3, 75); I('p-tomas', 'k-rec', 'asignado', 23, 33);
    I('p-jorge', 'k-eme', 'asignado', 23, 50); I('p-jorge', 'k-odi', 'asignado', null, 100); I('p-jorge', 'k-xls', 'inscrito', null, 17); I('p-jorge', 'k-ind', 'asignado', 3, 80);
    I('p-ignacia', 'k-ind', 'asignado', null, 100); I('p-ignacia', 'k-ate', 'asignado', 15, 50);
    I('p-felipe', 'k-ind', 'asignado', 3, 60); I('p-felipe', 'k-aseo', 'asignado', 15, 0);
    I('p-carolina', 'k-ind', 'asignado', null, 100); I('p-carolina', 'k-odi', 'asignado', null, 100); I('p-carolina', 'k-lid', 'asignado', 30, 0);
    I('p-rocio', 'k-ind', 'asignado', -6, 60); I('p-rocio', 'k-odi', 'asignado', 3, 25);
    I('p-benjamin', 'k-ind', 'asignado', null, 100); I('p-benjamin', 'k-ate', 'asignado', -1, 50);
    I('p-marcela', 'k-ind', 'asignado', null, 100); I('p-marcela', 'k-lid', 'inscrito', null, 50);
    I('p-paula', 'k-cul', 'inscrito', null, 100);
    I('p-josefina', 'k-ind', 'inscrito', null, 100);

    // ---------- Propuestas y solicitudes ----------
    const propuestas = [
      { id: 'pr-1', personaId: 'p-camila', tema: 'Primeros auxilios básicos', porque: 'En recepción a veces llegan residentes con lesiones menores y no sé cómo ayudar.', para: 'Para todos', quien: 'Mutual de seguridad', estado: 'revision', nota: '', fecha: dia(-12) },
      { id: 'pr-2', personaId: 'p-camila', tema: 'Inglés para atención de residentes', porque: 'Hay residentes extranjeros en el edificio.', para: 'Para mi cargo', quien: '', estado: 'aceptada', nota: 'Lo estoy preparando.', fecha: dia(-30) },
      { id: 'pr-3', personaId: 'p-camila', tema: 'Coctelería', porque: 'Para eventos del edificio.', para: 'Para mi cargo', quien: '', estado: 'rechazada', nota: 'No calza con el plan de capacitación de este año.', fecha: dia(-40) }
    ];
    const solicitudes = [
      { id: 's-1', tipo: 'ayuda', personaId: 'p-tomas', fecha: dia(-8), estado: 'pendiente', nota: '', datos: { tema: 'Protocolo de mudanzas', objetivo: 'Coordinar una mudanza sin dañar áreas comunes ni molestar a otros residentes.', alcance: { edificios: ['u-brooklyn'], cargos: ['Guest Service'] }, material: '', paraCuando: dia(30) } },
      { id: 's-2', tipo: 'presencial', personaId: 'p-andres', fecha: dia(-9), estado: 'pendiente', nota: '', datos: { tema: 'Comunicación efectiva para Building Managers', porque: 'Mejorar la coordinación entre edificios.', para: 'otro', alcance: { edificios: 'todos', cargos: ['Building Manager'] }, relator: '', fechaTentativa: '', costo: '' } },
      { id: 's-3', tipo: 'presencial', personaId: 'p-andres', fecha: dia(-10), estado: 'pendiente', nota: '', datos: { tema: 'Atención a residentes con discapacidad', porque: 'Tenemos residentes con movilidad reducida.', para: 'equipo', alcance: null, relator: '', fechaTentativa: '', costo: '' } }
    ];

    // ---------- Capacitación presencial ----------
    const presencialCatalogo = [
      { id: 'pc-asc', titulo: 'Rescate de personas atrapadas en ascensores', relator: '[Empresa de mantención de ascensores]', duracion: '3 horas', para: 'Guest Service y Mantención' },
      { id: 'pc-ext', titulo: 'Uso de extintores', relator: 'Prevencionista de riesgos', duracion: '1,5 horas', para: 'Todos los cargos' },
      { id: 'pc-pa', titulo: 'Primeros auxilios básicos', relator: '[Organismo administrador de la ley]', duracion: '4 horas', para: 'Todos los cargos' },
      { id: 'pc-aseo', titulo: 'Manejo seguro de productos de aseo', relator: 'Prevencionista de riesgos', duracion: '1 hora', para: 'Aseo' },
      { id: 'pc-bienv', titulo: 'Charla de bienvenida Greystar', relator: 'Equipo de RRHH', duracion: '2 horas', para: 'Todos los cargos' }
    ];
    const equipoNativo = ['p-camila', 'p-diego', 'p-valentina', 'p-matias', 'p-francisca'];
    const convocatorias = [
      { id: 'cv-1', presencialId: 'pc-ext', fecha: dia(2), hora: '10:00', lugar: 'Sala de reuniones, Edificio Nativo', convocados: equipoNativo, asistencia: null, convocadoPor: 'p-andres', creadoEn: ahora },
      { id: 'cv-2', presencialId: 'pc-bienv', fecha: dia(-23), hora: '09:00', lugar: 'Oficina central', convocados: equipoNativo, asistencia: { 'p-camila': true, 'p-diego': true, 'p-valentina': true, 'p-francisca': true, 'p-matias': false }, convocadoPor: 'p-andres', creadoEn: ahora }
    ];

    return { version: GS.SEED_VERSION, unidades, cargos, personas, cursos, rutas, inscripciones, propuestas, solicitudes, presencialCatalogo, convocatorias };
  };
})(window.GS);
