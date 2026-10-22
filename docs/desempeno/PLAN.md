# Evaluación de Desempeño: plan de construcción

Plataforma para evaluar el desempeño de las personas de Greystar Chile. Referencia visual y funcional: [mockup.html](mockup.html) (ábrelo con doble clic; arriba hay pestañas para recorrer cada pantalla).

Este documento es una **propuesta para validar con RRHH** antes de construir. Los valores marcados como *propuesta* (escalas, ponderaciones, tipo de evaluación por cargo, plazos) son puntos de partida y quedan configurables en la plataforma.

## Qué resuelve

1. Cada persona sabe qué se espera de ella (competencias de su cargo y objetivos del año) desde el inicio del ciclo.
2. La evaluación se hace en un solo lugar, con plazos y avisos, en vez de planillas por correo.
3. Cada persona es evaluada por quien corresponde según su cargo: **90°, 180° o 360°**.
4. Gerencia y RRHH calibran los resultados antes de comunicarlos, para que una misma nota signifique lo mismo en todos los edificios.
5. Cada evaluación termina en una conversación y un plan de desarrollo, con cursos sugeridos de Grey Skills.

## Dónde vive (decisión pendiente)

| Opción | A favor | En contra |
|---|---|---|
| **Módulo dentro de Grey Skills** (recomendada) | Reutiliza personas, unidades, cargos, jefaturas, roles, acceso con RUT y clave, "ver como" y exportación a Excel. El plan de desarrollo enlaza directo a cursos. Un solo link para la gente. | Grey Skills pasa a guardar datos más sensibles; hay que cerrar bien las reglas de seguridad. |
| Plataforma separada | Datos de desempeño aislados en otro proyecto de Firebase. | Duplica personas y estructura (hay que mantenerlas sincronizadas), otro link y otro acceso. |

En ambos casos se usa el **mismo stack** (HTML, CSS y JavaScript con Firebase: Firestore, Hosting y Authentication) y las mismas colecciones de `personas`, `unidades` y `cargos`.

## Tipo de evaluación según cargo (*propuesta*)

| Tipo | Quién evalúa | Cargos sugeridos | Por qué |
|---|---|---|---|
| **90°** | Solo la jefatura directa | Aseo, Mantención | Personal operativo, muchas veces sin correo ni computador. La jefatura conversa la evaluación cara a cara. |
| **180°** | Autoevaluación + jefatura | Guest Service, Building Manager Assistant, Analista | Rol con trato directo con residentes o con autonomía; la autoevaluación ordena la conversación. |
| **360°** | Autoevaluación + jefatura + pares + equipo a cargo | Building Manager, Gerentes, People Partner, HR Business Partner | Cargos que lideran personas: su equipo y sus pares ven cosas que la jefatura no ve. |

- El tipo se define **por cargo** en la configuración del ciclo y se puede cambiar para una persona puntual (por ejemplo, un BM recién llegado sin equipo todavía pasa a 180°).
- En **360°**, la persona propone entre 3 y 5 pares y su jefatura los aprueba. El equipo a cargo se toma de la estructura (quienes tienen a esa persona como jefatura).
- **Anonimato:** las respuestas de pares y del equipo a cargo se muestran solo como promedio y solo si hay **al menos 3 respuestas** en ese grupo; si no, se suman a "otros evaluadores" o no se muestran. La jefatura y la autoevaluación sí son nominativas.

### Peso de cada evaluador en la nota (*propuesta*)

| Tipo | Jefatura | Pares | Equipo a cargo | Autoevaluación |
|---|---|---|---|---|
| 90° | 100 % | — | — | — |
| 180° | 100 % | — | — | Referencial (se muestra al lado, no pondera) |
| 360° | 60 % | 20 % | 20 % | Referencial |

Que la autoevaluación no pondere evita que suba la nota sola y la deja como insumo para la conversación. Si un grupo no alcanza el mínimo de 3 respuestas, su peso pasa a la jefatura.

## Qué se evalúa

### Competencias

- **Corporativas** (para todas las personas), por ejemplo: Servicio al residente, Trabajo en equipo, Responsabilidad, Comunicación.
- **De cargo** (según el cargo), por ejemplo: Orden y limpieza (Aseo), Diagnóstico y reparación (Mantención), Liderazgo de equipo y Gestión del edificio (BM).
- Cada competencia tiene **conductas observables** por nivel, para que la persona y la jefatura evalúen lo mismo.
- Escala de 1 a 5 (*propuesta*):

| Nota | Nivel | Significa |
|---|---|---|
| 1 | No cumple | No muestra la conducta esperada. |
| 2 | Cumple parcialmente | La muestra a veces o con apoyo. |
| 3 | Cumple | La muestra de forma consistente. Es lo esperado para el cargo. |
| 4 | Supera | La muestra siempre y es referente para otros. |
| 5 | Destaca | Va más allá del cargo y mejora cómo trabaja el equipo. |

- Se puede marcar "No observado" (no cuenta en el promedio). Las notas 1 y 5 exigen un comentario con un ejemplo concreto.

### Objetivos

- Entre 3 y 5 objetivos por persona, con **peso** (suman 100 %), **indicador**, **meta** y **resultado**.
- Se fijan al inicio del ciclo: los propone la jefatura (o la persona, en cargos con autonomía) y ambos los aceptan. Pueden heredar objetivos del edificio (por ejemplo, NPS de residentes u ocupación).
- Al cierre se registra el resultado y se calcula el **% de logro** de cada objetivo (con tope de 120 %), que se convierte a la misma escala de 1 a 5:

| % de logro | Nota |
|---|---|
| Menos de 60 % | 1 |
| 60 % a 84 % | 2 |
| 85 % a 99 % | 3 |
| 100 % a 109 % | 4 |
| 110 % o más | 5 |

### Nota final (*propuesta*)

| Cargos | Competencias | Objetivos |
|---|---|---|
| Operativos (Aseo, Mantención, Guest Service) | 70 % | 30 % |
| BMA, BM y oficina central | 50 % | 50 % |
| Gerentes | 40 % | 60 % |

La nota final (1,0 a 5,0) se traduce a un **resultado**: No cumple (< 2,0), Cumple parcialmente (2,0 a 2,7), Cumple (2,8 a 3,6), Supera (3,7 a 4,4), Destaca (4,5 o más).

## Roles

| Rol | Ve y hace |
|---|---|
| Trabajador | Sus tareas del ciclo (autoevaluación, evaluar a pares si le toca), sus objetivos, su resultado final y su plan de desarrollo. Firma la toma de conocimiento. |
| Jefatura | + Su equipo: fija objetivos, evalúa, aprueba pares, ve el avance, registra la conversación de retroalimentación y el plan de desarrollo. |
| Gerente | + Calibra a los equipos de su gerencia; ve los equipos de sus BM. |
| Visualizador | Seguimiento del avance (no de las notas) de las unidades asignadas. *A confirmar si debe ver resultados.* |
| Administración RRHH | Crea y configura el ciclo, competencias, tipo por cargo y ponderaciones; sigue el avance; cierra la calibración; reportes; reabre evaluaciones. |

Las notas son **más sensibles** que el avance de cursos: cada persona ve solo lo suyo, la jefatura ve a su equipo directo, el gerente a su gerencia y RRHH todo. Esto se aplica en las reglas de seguridad de Firestore, no solo en las pantallas.

## Flujo del ciclo

```
1. Configuración      RRHH abre el ciclo, define competencias, tipo por cargo, pesos y fechas
2. Objetivos          Jefatura y persona fijan objetivos (pesos suman 100 %) y los aceptan
3. Mitad de año       (opcional) Revisión de avance de objetivos, sin nota
4. Evaluación         Autoevaluación → evaluación de jefatura, pares y equipo (en paralelo)
5. Calibración        Gerente y RRHH revisan la distribución y ajustan con justificación
6. Conversación       Jefatura y persona conversan, acuerdan plan de desarrollo
7. Cierre             La persona firma que tomó conocimiento (puede dejar comentario)
```

- Cada etapa tiene fecha de inicio y término; la plataforma muestra lo pendiente a cada persona y avisa a la jefatura de lo atrasado.
- La jefatura **no ve la autoevaluación hasta enviar la suya**, para no sesgarse.
- El resultado no se muestra a la persona hasta que la calibración está cerrada y se hizo la conversación.
- Los ajustes en la calibración quedan registrados (nota original, nota calibrada, quién y por qué).
- Si la persona no está de acuerdo, lo deja escrito al firmar y RRHH lo ve en su bandeja.

## Plan de desarrollo

Al cerrar la conversación, la jefatura registra 1 a 3 acciones de desarrollo ligadas a las competencias más bajas. La plataforma sugiere **cursos de Grey Skills** asociados a esa competencia; si se eligen, quedan asignados con plazo en Grey Skills (si se construye como módulo). Cada competencia del catálogo puede tener cursos asociados.

## Modelo de datos (colecciones de Firestore)

Se reutilizan `personas`, `unidades` y `cargos`. Nuevas:

- **`ciclos`**: nombre (Evaluación 2026), estado (borrador / objetivos / evaluación / calibración / conversación / cerrado), fechas de cada etapa, configuración por cargo (tipo 90/180/360, competencias, peso competencias/objetivos), pesos por evaluador, escala.
- **`competencias`**: nombre, tipo (corporativa / de cargo), descripción, conductas por nivel, cursos asociados.
- **`objetivos`**: ciclo, persona, título, indicador, meta, peso, estado (propuesto / aceptado), resultado, % de logro, comentarios.
- **`evaluaciones`**: una por evaluador y evaluado: ciclo, evaluado, evaluador, relación (auto / jefatura / par / equipo), estado (pendiente / en curso / enviada), respuestas por competencia (nota y comentario), notas de objetivos (solo jefatura), comentario general, fechas.
- **`resultados`**: ciclo, persona, nota de competencias, nota de objetivos, nota final calculada, nota calibrada, justificación del ajuste, resultado, conversación (fecha, resumen), plan de desarrollo, toma de conocimiento (fecha, comentario, de acuerdo sí/no).

Las notas de pares y del equipo se guardan con el evaluador para controlar duplicados, pero **nunca se leen desde las pantallas de la persona evaluada ni de su jefatura**: el promedio agregado se guarda en `resultados`.

## Etapas de construcción

Cada etapa termina publicada en Firebase Hosting para probarla con datos de prueba.

0. **Validación:** revisar este plan y el mockup con RRHH; definir dónde vive, competencias, escalas, tipo por cargo y pesos.
1. **Configuración del ciclo:** catálogo de competencias con conductas, tipo y pesos por cargo, fechas de etapas.
2. **Objetivos:** fijar, aceptar y editar objetivos; revisión de mitad de año.
3. **Evaluación:** formularios de autoevaluación, jefatura, pares y equipo; selección y aprobación de pares; avance por equipo.
4. **Cálculo y calibración:** nota final, vista de calibración con distribución y ajustes justificados.
5. **Conversación y cierre:** resultado para la persona, comparación por evaluador, plan de desarrollo con cursos, toma de conocimiento.
6. **Reportes:** avance del ciclo, distribución por unidad y cargo, brechas por competencia, exportables a Excel.
7. **Seguridad y puesta en marcha:** reglas de Firestore por rol (requisito antes de datos reales), piloto en uno o dos edificios y luego toda la empresa.

## Decisiones pendientes con RRHH

1. Dónde vive: módulo de Grey Skills o plataforma separada.
2. Lista de competencias corporativas y de cargo, con sus conductas por nivel.
3. Tipo de evaluación por cargo (tabla de arriba) y si hay excepciones.
4. Pesos: competencias vs. objetivos por cargo, y peso de cada evaluador en 360°.
5. Si la autoevaluación pondera o es solo referencial.
6. Si la calibración usa una distribución sugerida (por ejemplo, máximo 15 % en "Destaca") o es libre.
7. Frecuencia: un ciclo anual con revisión de mitad de año, o dos ciclos semestrales.
8. Si el resultado se conecta con bonos o reajustes (cambia el nivel de seguridad y auditoría que se necesita).
9. Cómo evalúa el personal operativo sin computador: la jefatura en su teléfono durante la conversación, o un tótem/tablet en el edificio.
10. Si el rol visualizador ve notas o solo avance.

## Pendientes fuera del código

- Confirmar con TI y Legal el tratamiento de datos de desempeño (más sensibles que el avance de cursos), plazo de conservación y quién puede acceder.
- Comunicar el proceso a jefaturas antes de abrir el primer ciclo (capacitación corta, idealmente como curso en Grey Skills).
