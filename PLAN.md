# Grey Skills — Plan de construcción

Plataforma de aprendizaje de Greystar Chile. Referencia visual y funcional: [docs/mockup.html](docs/mockup.html).

## Stack

| Pieza | Herramienta | Para qué |
|---|---|---|
| Código | GitHub | Repositorio, historial y respaldo |
| Aplicación | Next.js (TypeScript) + Tailwind | Pantallas y lógica |
| Base de datos y login | Supabase (Postgres, Auth) | Datos e ingreso con RUT |
| Publicación | Vercel | Cada cambio en GitHub se publica solo |

Material de los cursos: videos y PDFs se cargan como **links** (como en LARning), no se suben archivos a la plataforma. Los links deben poder abrirse sin cuenta corporativa de Microsoft si el curso es para personal sin correo de la empresa.

Seguridad: los permisos por rol se verifican en el servidor en cada acción, no solo en las pantallas. Hasta la etapa 6 el acceso es provisional y no se cargan datos reales.

## Roles

| Rol | Ve |
|---|---|
| Trabajador | Mis cursos, explorador, proponer, perfil |
| Jefatura | + Mi equipo: avances, asignar, usuarios, crear curso, presencial |
| Gerente | + Su equipo directo (edita) y equipos de sus BM (solo lectura) |
| Visualizador | Seguimiento de las unidades asignadas (solo lectura) |
| Administradora | Administración: bandeja, cursos, rutas, personas, estructura, reportes, "ver como" |

## Modelo de datos (primera versión)

- **Estructura:** `unidades` (gerencias, edificios y oficina central, en jerarquía), `cargos`
- **Personas:** `perfiles` (RUT, nombre, rol, unidad, cargo, jefatura, activo), `visualizador_unidades`
- **Cursos:** `cursos` (estado: borrador / en revisión / devuelto / publicado / archivado, categoría, portada, autor), `curso_alcance` (edificios y cargos), `modulos` (video o documento con su link, o checklist; orden), `preguntas` (quiz), `valoraciones`
- **Avance:** `inscripciones` (origen asignado o inscrito, plazo, % de avance, fecha de término), `progreso_modulos`, `certificados`
- **Rutas:** `rutas` (de cargo o complementarias), `ruta_cursos`, `persona_rutas`
- **Flujos:** `propuestas`, `solicitudes_ayuda`, `revisiones` (la bandeja de la administradora se arma con esto)
- **Presencial:** `cursos_presenciales`, `convocatorias`, `asistencias`

Semáforo (calculado): Completado, Vencido (plazo pasado), Por vencer (≤ 7 días), Al día, Sin fecha límite.

## Etapas

Cada etapa termina publicada en Vercel para probarla.

0. **Preparación:** instalar Node.js y armar el esqueleto del proyecto. Base de datos local (SQLite con Prisma) para desarrollar sin cuentas externas.
1. **Base:** acceso provisional (elegir persona de una lista, sin contraseña, solo con datos de prueba), vistas según rol, diseño general (colores Navy, Ocean, Sky y Stucco), estructura de unidades y gestión de personas.
2. **Cursos:** editor por pasos (módulos, quiz, alcance, portada, certificado), vista del curso por dentro, avance y certificados.
3. **Asignación:** Mis cursos, explorador e inscripción, asignar con plazo y rutas por cargo (incluido el cambio de cargo).
4. **Seguimiento:** Mi equipo, vista de gerente y visualizador, reportes por persona y por unidad, y "ver como".
5. **Flujos:** propuestas, revisión y publicación, solicitudes de ayuda, bandeja y capacitación presencial con asistencia.
6. **Acceso definitivo y publicación:** ingreso con RUT y contraseña, cambio de contraseña en el primer ingreso, permisos verificados en el servidor; base de datos en Supabase y publicación en Vercel.
7. **Puesta en marcha:** pruebas, carga de personas reales y piloto en un edificio.

## Pendientes fuera del código

- Confirmar con TI que se puede usar Supabase y Vercel con datos de colaboradores (RUT, cargo y avances).
- Definir el dominio, por ejemplo greyskills.greystar.cl, o usar el de Vercel.
