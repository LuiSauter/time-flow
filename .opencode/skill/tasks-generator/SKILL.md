---
name: tasks-generator
description: Usa esta skill cuando el usuario pida descomponer una especificación y su plan aprobado en tareas de implementación. No la uses para crear o revisar specs, generar el plan, implementar código ni validar una implementación.
---

# Generador de tareas

Convierte una spec y un plan aprobados en una lista de tareas accionables. Cada
tarea debe tener un alcance pequeño, ser cohesiva, declarar sus dependencias y
ser verificable por sí misma. No contiene código de implementación.

## Proceso

1. **Resuelve la entrada.** Usa las rutas indicadas por el usuario. Si la
   ubicación de `tasks.md` no está definida, descubre la convención del
   repositorio y su documentación. Si es ambigua, pregunta antes de escribir.
2. **Lee el contexto mínimo.** Usa la tabla de trazabilidad y las decisiones
   relevantes del plan como índice. Lee de la spec solo los RF y criterios
   necesarios para las tareas. Consulta `AGENTS.md` y
   `docs/constitution.md` únicamente si existen y solo en lo aplicable.
3. **Comprueba la cobertura del plan.** Cada RF debe tener una superficie de
   implementación y una verificación prevista. Si falta algo, describe el
   bloqueo y detente. No invoques otra skill ni inventes trabajo.
4. **Identifica dependencias reales.** Basa el orden en relaciones de datos,
   contratos, interfaces, migraciones, configuración, componentes o pruebas
   que existan en el plan y el repositorio. No impongas un orden de capas o
   arquitectura.
5. **Descompón el trabajo.** Divide por alcance y cohesión, procurando que cada
   tarea pueda implementarse y verificarse sin arrastrar trabajo no definido.
   Usa una estimación temporal solo como referencia opcional, nunca como límite
   o criterio de validez.
6. **Genera** `tasks.md` en la ubicación acordada usando el formato siguiente.
7. **Comprueba el resultado.** Verifica cobertura completa de RF, dependencias
   acíclicas, orden ejecutable y un `Hecho cuando:` verificable para cada tarea.

## Formato de cada tarea

```markdown
- [ ] **T<n> — <título breve>** (<RF-x, RF-y>)
  - Alcance: <qué construir o cambiar, apoyándose en el plan>
  - Plan: <sección, decisión o referencia breve relevante del plan>
  - Depende de: <T<n> anteriores o "ninguna">
  - Verificación: <test, comprobación manual, análisis u otra evidencia>
  - Hecho cuando: <resultado observable y verificable>
```

- **Título** breve y orientado a acción.
- **RF que cubre** en la cabecera de la tarea.
- **Alcance**: describe el cambio concreto sin escribir el cuerpo de la
  implementación.
- **Plan**: referencia el encabezado, identificador de decisión o sección
  relevante del plan. Resume la referencia en una línea; no copies el contenido
  del plan. Si una tarea no tiene una referencia concreta, indica `no aplica` y
  justifica esa excepción en el alcance.
- **Depende de**: enumera solo dependencias reales y evita dependencias
  circulares. Una tarea puede no depender de otra.
- **Verificación**: identifica la evidencia adecuada al tipo de cambio.
- **"Hecho cuando:"**: resultado observable. Nunca uses criterios subjetivos
  como "funciona bien".

## Reglas

- **Alcance pequeño**: si una tarea contiene varios objetivos independientes,
  sepáralos. El tamaño se juzga por alcance, cohesión y verificabilidad, no por
  una duración fija.
- **Dependencias reales**: una tarea solo puede depender de trabajo necesario y
  definido previamente. Ordena las tareas respetando el grafo resultante.
- **Checkboxes**: cada tarea empieza con `- [ ] `.
- **RF en cada tarea**: siempre al menos uno. Un RF no debe quedar huérfano
  entre tareas.
- Incluye tareas de estructura, configuración, migración, integración o
  validación final solo cuando el plan las requiera.
- **No escribas código de implementación** en `tasks.md`: solo qué construir y
  cómo saber que está terminado.
- Usa nombres de archivos, módulos, paquetes o comandos reales solo si están
  definidos por el plan o descubiertos en el repositorio.
- Idioma: el de la documentación del proyecto; si no existe una convención,
  usa el idioma del usuario.

## Verificación al terminar

- Todas las RF de la spec están cubiertas por al menos una tarea.
- Cada RF conserva su relación con la superficie de implementación y la
  verificación del plan.
- Cada tarea incluye una referencia breve a la sección o decisión relevante del
  plan, o declara justificadamente `no aplica`.
- Cada tarea tiene línea "Hecho cuando:" verificable.
- Todas las dependencias son reales, acíclicas y apuntan a tareas anteriores o
  independientes.
- Nada de codeo sesgado: solo descomponer, no implementar.
- No invoques `spec-reviewer` ni ninguna otra skill.
