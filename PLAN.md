# Grey Skills — Plan de construcción

Plataforma de aprendizaje de Greystar Chile. Referencia visual y funcional: [docs/mockup.html](docs/mockup.html).

## Stack

Mismo stack que LARning: Firebase. No requiere instalar nada en el computador.

| Pieza | Herramienta | Para qué |
|---|---|---|
| Código | GitHub | Repositorio, historial y respaldo |
| Pantallas | HTML, CSS y JavaScript (SDK de Firebase desde CDN) | Vistas según rol, sin herramientas de compilación |
| Base de datos | Firestore | Personas, cursos, asignaciones y avance |
| Publicación | Firebase Hosting | Link de la plataforma |
| Acceso (etapa 6) | Firebase Authentication | Ingreso con RUT y contraseña |

Material de los cursos: videos y PDFs se cargan como **links** (como en LARning), no se suben archivos a la plataforma. Los links deben poder abrirse sin cuenta corporativa de Microsoft si el curso es para personal sin correo de la empresa.

Seguridad: en la etapa 6 los permisos por rol se aplican con las reglas de seguridad de Firestore, no solo en las pantallas. Hasta entonces el acceso es provisional y **no se cargan datos reales**.

## Roles

| Rol | Ve |
|---|---|
| Trabajador | Mis cursos, explorador, proponer, perfil |
| Jefatura | + Mi equipo: avances, asignar, usuarios, crear curso, presencial |
| Gerente | + Su equipo directo (edita) y equipos de sus BM (solo lectura) |
| Visualizador | Seguimiento de las unidades asignadas (solo lectura) |
| Administradora | Administración: bandeja, cursos, rutas, personas, estructura, reportes, "ver como" |

## Modelo de datos (colecciones de Firestore)

- **Estructura:** `unidades` (gerencias, edificios y oficina central, con unidad padre), `cargos`
- **Personas:** `personas` (RUT, nombre, rol, unidad, cargo, jefatura, unidades que sigue si es visualizador, activo)
- **Cursos:** `cursos` (estado: borrador / en revisión / devuelto / publicado / archivado; categoría, portada, autor, alcance por edificios y cargos, módulos con su link o checklist y preguntas de quiz), `valoraciones`
- **Avance:** `inscripciones` (persona, curso, origen asignado o inscrito, plazo, módulos completados, % de avance, fecha de término; de aquí sale el certificado)
- **Rutas:** `rutas` (de cargo o complementarias, con su lista de cursos)
- **Flujos:** `propuestas`, `solicitudes` (ayuda para crear curso, propuesta presencial). La bandeja de la administradora se arma con esto y los cursos en revisión.
- **Presencial:** `presenciales` (curso, fecha, lugar, convocados, asistencia)

Semáforo (calculado): Completado, Vencido (plazo pasado), Por vencer (≤ 7 días), Al día, Sin fecha límite.

## Etapas

Cada etapa termina publicada en Firebase Hosting para probarla.

0. **Preparación:** crear el proyecto de Firebase de Grey Skills (separado de LARning), conectar Firestore y Hosting, y armar el esqueleto.
1. **Base:** acceso provisional (elegir persona de una lista, sin contraseña, solo con datos de prueba), vistas según rol, diseño general (colores Navy, Ocean, Sky y Stucco), estructura de unidades y gestión de personas.
2. **Cursos:** editor por pasos (módulos, quiz, alcance, portada, certificado), vista del curso por dentro, avance y certificados.
3. **Asignación:** Mis cursos, explorador e inscripción, asignar con plazo y rutas por cargo (incluido el cambio de cargo).
4. **Seguimiento:** Mi equipo, vista de gerente y visualizador, reportes por persona y por unidad, y "ver como".
5. **Flujos:** propuestas, revisión y publicación, solicitudes de ayuda, bandeja y capacitación presencial con asistencia.
6. **Acceso definitivo:** ingreso con RUT y contraseña (Firebase Authentication), cambio de contraseña en el primer ingreso y reglas de seguridad de Firestore por rol.
7. **Puesta en marcha:** pruebas, carga de personas reales y piloto en un edificio.

## Estado actual (15 de octubre de 2026)

Las etapas 1 a 5 están construidas con datos en el navegador (localStorage), listas para conectar Firestore:

- Ingreso provisional (elegir persona) y vistas según rol, incluido "ver como" en solo lectura.
- Mis cursos, explorador con inscripción, proponer cursos, mi perfil con certificados.
- Curso por dentro: video y documento por link, checklist, política con firma (nombre, RUT, fecha), quiz con nota mínima e intentos, encuesta final y certificado imprimible como PDF.
- Mi equipo: avances, asignar con plazo, usuarios con rutas, crear curso (con ayuda de RRHH o solo), capacitación presencial con convocatoria y asistencia.
- Gerente (equipo directo y equipos de sus BM en solo lectura) y visualizador (unidades asignadas).
- Administración: bandeja con respuestas, cursos (publicar, archivar, editar nueva versión), rutas, personas (crear, editar con cambio de cargo, carga masiva pegando desde Excel), estructura y reportes por persona, unidad y curso, exportables a Excel.

Pendiente: conectar Firestore, acceso con RUT y contraseña (etapa 6) y puesta en marcha (etapa 7). Mejoras posibles: detectar automáticamente el fin de un video de YouTube y permitir que la persona elija versión cuando un curso cambia a mitad de camino.

## Pendientes fuera del código

- Confirmar con TI el uso de Firebase con datos de colaboradores (RUT, cargo y avances), igual que en LARning.
- Definir el dominio, por ejemplo greyskills.greystar.cl, o usar el de Firebase (.web.app).
