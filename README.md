# Grey Skills

Plataforma de aprendizaje de Greystar Chile. Ver el plan completo en [PLAN.md](PLAN.md) y el mockup original en [docs/mockup.html](docs/mockup.html).

**En diseño:** módulo de Evaluación de Desempeño. Ver [docs/desempeno/PLAN.md](docs/desempeno/PLAN.md) y su mockup en [docs/desempeno/mockup.html](docs/desempeno/mockup.html).

## Cómo abrirla

No requiere instalar nada. Abre `index.html` con doble clic en Chrome o Edge.

En la pantalla de ingreso eliges con qué persona entrar. El acceso es **provisional y solo con datos de prueba**: no cargues personas reales hasta activar el ingreso con RUT y contraseña (etapa 6 del plan).

- **Cambiar de persona** (barra superior): vuelve a la lista para entrar con otro rol.
- **Restablecer datos de prueba**: borra lo que hayas probado y recarga los datos de ejemplo.
- Cada pestaña del navegador puede tener una persona distinta. Por ejemplo, Andrés (jefatura) en una pestaña asigna un curso y Camila (trabajadora) en otra lo ve aparecer.

## Personas de prueba

| Persona | Rol | Para probar |
|---|---|---|
| Josefina Chaná | Administrador | Bandeja, cursos, rutas, personas, estructura, reportes, "ver como" |
| Marcela Vidal | Gerente | Su equipo directo (edita) y los equipos de sus BM (solo lectura) |
| Andrés Soto | Jefatura · Edificio Nativo | Avances, asignar, usuarios, crear curso, presencial |
| Paula Herrera | Visualizador | Seguimiento de Nativo y Brooklyn (solo lectura) |
| Camila Rojas | Trabajador | Mis cursos, explorador, curso por dentro, quiz, certificado |

## Dónde se guarda la información

Por ahora, en el navegador de cada computador (`localStorage`). El avance de cada curso, los quiz, las firmas de políticas, las encuestas y los certificados se guardan de verdad, pero solo en ese navegador. Al conectar Firestore pasan a una base de datos compartida.

## Estructura del código

```
index.html            Página única que carga todo
css/styles.css        Estilos (colores Navy, Ocean, Sky, Stucco)
js/util.js            Utilidades: plantillas HTML seguras, fechas, RUT, exportar a Excel
js/seed.js            Datos de prueba
js/store.js           Capa de datos (hoy localStorage; mañana Firestore)
js/logic.js           Reglas: roles, visibilidad de cursos, avance, estados, equipos
js/app.js             Núcleo: sesión, rutas (#/seccion), encabezado según rol, acciones
js/components.js      Piezas reutilizables (tarjetas, barras, selector de público, tablas)
js/views/personal.js  Ingreso, Mis cursos, Explorador, Proponer, Mi perfil
js/views/curso.js     Curso por dentro, quiz, encuesta y certificado
js/views/equipo.js    Mi equipo / Seguimiento
js/views/editor.js    Editor de cursos en 4 pasos
js/views/admin.js     Administración
```

**Para conectar Firestore** solo se reemplaza `js/store.js` por una versión que lea las colecciones con `onSnapshot` y escriba con `addDoc`/`updateDoc`/`deleteDoc`, manteniendo los mismos nombres de funciones (`all`, `get`, `where`, `add`, `addMany`, `update`, `remove`). Las pantallas no cambian.

## Colecciones

`unidades`, `cargos`, `personas`, `cursos` (con sus módulos y quiz), `rutas`, `inscripciones` (avance por persona y curso), `propuestas`, `solicitudes` (ayuda para crear cursos y propuestas presenciales), `presencialCatalogo`, `convocatorias`.
