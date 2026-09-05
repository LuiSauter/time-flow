---
name: task-implementer
description: Usa esta skill cuando el usuario pida implementar una tarea concreta T[n] de un tasks.md existente. Aplica TDD cuando el cambio de comportamiento sea testeable y se detiene al terminar esa tarea. No la uses para implementar tareas posteriores ni para validar una funcionalidad completa.
---

# Implementador de tarea única

Implementa una sola tarea planificada y no sale de su alcance. Usa TDD para
cambios de comportamiento que admitan una prueba automatizada significativa.
Para cambios no testeables, usa la verificación definida por `Hecho cuando:`.
Al terminar, registra la evidencia, actualiza el estado de la tarea y se
detiene.

## Proceso

1. **Resuelve la tarea.** Usa la funcionalidad y `T[n]` indicados por el
   usuario. Si la tarea, su ubicación o su alcance son ambiguos, detente y
   pide una aclaración.
2. **Carga el contexto mínimo.** Lee únicamente la tarea actual, sus RF, sus
   dependencias, las decisiones relevantes del plan, los archivos o superficies
   afectadas y los tests necesarios. Consulta `AGENTS.md` y
   `docs/constitution.md` solo si existen y solo en lo aplicable. No leas specs
   anteriores salvo que una dependencia explícita lo requiera.
3. **Inspecciona el código necesario.** Confirma las convenciones, puntos de
   extensión, ubicación de tests y comandos del área afectada usando el plan,
   la documentación y el repositorio. No inventes estructura ni comandos.
4. **Determina la verificación.** Si T[n] cambia comportamiento observable y
   puede probarse automáticamente, sigue el ciclo TDD. Si no, sigue
   directamente la comprobación indicada por `Hecho cuando:`.
5. **Aplica TDD cuando corresponda.**
   - Escribe primero los tests específicos para los RF de T[n], en la
     ubicación y formato del proyecto.
   - Ejecuta esos tests y registra `RED`. Si pasan antes del cambio, comprueba
     si el comportamiento ya existe y documenta el resultado; no fuerces un
     fallo artificial.
   - Implementa el cambio mínimo dentro del alcance de T[n].
   - Ejecuta de nuevo los tests específicos y registra `GREEN`.
   - Ejecuta después los tests del módulo, paquete o superficie afectada.
6. **Verifica cambios no testeables.** Comprueba cada condición de
   `Hecho cuando:` mediante la evidencia que corresponda, por ejemplo una
   inspección, una comprobación manual, un análisis o un comando del proyecto.
7. **Evalúa la suite completa.** Ejecútala solo si existe riesgo de regresión,
   se está terminando la funcionalidad o lo exige `AGENTS.md`,
   `docs/constitution.md` u otra regla explícita del proyecto.
8. **Cierra T[n].** Solo si la verificación requerida es satisfactoria, marca
   la tarea como `- [x]` y registra los comandos, comprobaciones y resultados
   relevantes siguiendo la convención del proyecto.
9. **Detente.** No implementes T[n+1], no corrijas trabajo ajeno al alcance y
   no invoques `validate-implementation` ni ninguna otra skill.

## Reglas

- Trabaja exclusivamente sobre T[n], sus RF y sus dependencias necesarias.
- Respeta las decisiones del plan y las reglas reales del proyecto. Si entran
  en conflicto o falta una decisión necesaria, reporta el bloqueo y no
  inventes una solución.
- Mantén separados código de producción y tests según la convención del
  proyecto.
- Cubre los casos positivos, errores y límites que correspondan a los RF de
  T[n]. No añadas pruebas de requisitos no asociados.
- TDD es obligatorio para cambios de comportamiento testeables; no crees
  tests artificiales para documentación, configuración, estilos, estructura u
  otros cambios sin comportamiento automatizable significativo.
- Usa los comandos definidos por el proyecto. Si no existe un comando
  explícito, identifica el comando apropiado del área afectada o reporta la
  falta de información.
- No modifiques specs, planes ni tareas distintas de la actualización de
  estado y evidencia de T[n].
- Conserva la trazabilidad de los RF asociados en la evidencia de cierre.
- No delegues automáticamente en otras skills.
