---
name: spec-generator
description: Usa esta skill cuando el usuario pida crear una especificación nueva a partir de una idea o requisitos. No la uses para revisar una spec existente, generar un plan, descomponer tareas, implementar código o validar una implementación.
---

# Generador de specs

Convierte una idea o unos requisitos iniciales en una especificación nueva y
verificable. La spec define el comportamiento acordado; las decisiones de
implementación pertenecen al plan.

## Proceso

1. **Resuelve el alcance.** Usa la ruta o el nombre indicados por el usuario.
   Si no están indicados, descubre la convención existente en el repositorio y
   en su documentación. Si hay más de una ubicación razonable, pregunta antes
   de escribir.
2. **Lee solo el contexto aplicable.** Consulta `AGENTS.md` y
   `docs/constitution.md` únicamente si existen. Consulta también la
   documentación del proyecto y specs anteriores solo cuando sean relevantes
   para esta funcionalidad o estén referenciadas. No cargues todas las specs por
   defecto.
3. **Entrevista al usuario.** Formula una pregunta cada vez, esperando la
   respuesta antes de continuar, con un máximo de 6 preguntas salvo que el
   usuario pida otra cosa. Prioriza decisiones que cambien el comportamiento,
   los errores, los límites o el fuera de alcance. No propongas soluciones
   técnicas; redirige las preguntas sobre el cómo hacia el qué.
4. **Redacta** la spec nueva usando `spec-template.md` de esta skill. Conserva
   identificadores estables `RF-1`, `RF-2`, etc. Usa EARS como estándar por
   defecto, salvo que el proyecto defina explícitamente otra convención.
5. **Haz visibles las incertidumbres.** Usa
   `[NECESITA ACLARACIÓN: pregunta concreta]` y no inventes respuestas.
6. **Comprueba la spec.** Cada RF debe describir un comportamiento observable,
   una sola idea y una forma de verificación. Incluye el fuera de alcance y
   criterios de finalización.
7. **Solicita aprobación explícita.** Detente al terminar la spec aprobable.
   No generes el plan, tareas ni código, y no invoques otra skill.

## Reglas

- Describe qué problema se resuelve, por qué y qué comportamiento se espera.
- No incluyas stack, arquitectura, nombres de archivos, esquemas de datos,
  algoritmos ni firmas de funciones salvo que sean una parte explícita del
  comportamiento que el usuario deba observar.
- Incluye siempre "Fuera de alcance".
- Mantén un comportamiento por RF. Divide los requisitos que unan varios
  comportamientos independientes.
- Evita adjetivos no medibles. Expresa umbrales o elimina la afirmación.
- Usa el idioma indicado por la convención del proyecto; si no existe, usa el
  idioma del usuario.

## Notación EARS

Cuando el proyecto no define otra convención, usa el patrón EARS que
corresponda y no mezcles patrones dentro de un mismo RF:

| Patrón | Forma | Cuándo |
|---|---|---|
| Ubicuo | EL SISTEMA \<hará\> | siempre cierto |
| Dirigido por evento | CUANDO \<disparador\>, EL SISTEMA \<hará\> | responde a algo |
| Estado | MIENTRAS \<estado\>, EL SISTEMA \<hará\> | durante una condición |
| Opcional | DONDE \<característica\>, EL SISTEMA \<hará\> | solo si está presente |
| No deseado | SI \<condición\>, ENTONCES EL SISTEMA \<hará\> | errores y casos límite |

Ejemplo bien escrito:

> RF-4: SI el nombre ya existe (comparación ignorando mayúsculas y espacios
> exteriores), ENTONCES EL SISTEMA no creará un duplicado e informará del
> conflicto (salida 1).

Mal escrito, para contrastar:

> ~~RF-4: El sistema debe manejar bien los duplicados y ser rápido.~~
> Sin patrón EARS, sin criterio verificable, dos ideas en una frase y un
> adjetivo no medible.
