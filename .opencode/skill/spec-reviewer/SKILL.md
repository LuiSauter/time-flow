---
name: spec-reviewer
description: Usa esta skill cuando el usuario pida revisar o clarificar una especificación existente. Detecta ambigüedades, contradicciones, casos límite y conflictos con las reglas del proyecto; no crea specs, genera planes, implementa código ni valida implementaciones.
---

# Revisor de specs

Revisa una spec existente antes de planificar. Tu trabajo es detectar y listar
problemas y formular las decisiones que el autor debe resolver. No reescribas la
spec, propongas soluciones técnicas ni modifiques el repositorio.

La spec es el contrato. Si algo no está claro o se contradice aquí, el plan y
el código lo heredarán. La revisión debe distinguir entre un bloqueo real y una
observación que no impide continuar.

## Proceso

1. **Resuelve la spec objetivo.** Usa la ruta indicada por el usuario. Si no
   existe o hay varias candidatas, detente y pide una ruta inequívoca.
2. **Lee solo lo necesario.** Lee la spec completa porque es el objeto de la
   revisión. Consulta `AGENTS.md` y `docs/constitution.md` únicamente si
   existen. Consulta documentación adicional o specs relacionadas solo cuando
   la spec las referencie o sea necesario para comprobar un conflicto.
3. **Revisa en cuatro bloques** y referencia el RF afectado cuando aplique.
4. **Separa hallazgos y decisiones.** Para cada problema indica el motivo, el
   impacto y la pregunta que debe responder el autor. No indiques la solución.
5. **Emite un estado final:** lista para planificar, bloqueada por decisiones
   pendientes o incompleta por falta de contexto.
6. **Detente.** No reescribas la spec, no generes otro artefacto y no invoques
   otra skill.

## Los cuatro bloques

Formato: lista numerada dentro de cada bloque, con referencia al requisito
afectado (p. ej. `RF-4`) cuando aplique. Si el bloque está limpio, dilo
explícitamente ("nada que señalar") para que el autor lo sepa sin dudas.

### (1) Ambigüedades restantes

- Términos que admiten varias interpretaciones sin umbral ni definición.
- Criterios de aceptación no verificables o sin evidencia observable.
- Requisitos con dos ideas en una frase (un "y" que une dos comportamientos
  debería ser dos RF).
- Suposiciones implícitas que no están escritas como `[NECESITA ACLARACIÓN]`.

### (2) Contradicciones entre requisitos

- Dos (o más) RF que se comportan de forma incompatible entre sí.
- Un RF que contradice otro en el mismo caso, o un RF que contradice lo
  declarado en contexto, objetivo o historias de usuario.
- Requisitos que chocan con la sección "Fuera de alcance".

### (3) Casos límite no cubiertos

- Entradas vacías, inválidas, duplicadas o fuera de límites sin comportamiento
  definido.
- Estados iniciales, transiciones, reintentos, concurrencia o ejecuciones
  repetidas que puedan cambiar el resultado.
- Errores y fallos de dependencias sin comportamiento definido.
- Casos de permisos, compatibilidad, disponibilidad o datos inconsistentes
  cuando sean relevantes para la funcionalidad.

### (4) Conflictos con las reglas del proyecto

- Comprueba únicamente reglas encontradas en `AGENTS.md`,
  `docs/constitution.md` o documentación aplicable del proyecto.
- Señala requisitos que contradigan una restricción explícita del proyecto.
- Señala detalles técnicos incluidos en la spec cuando la convención del
  proyecto los reserve para el plan.
- Si no existen reglas aplicables, indica que este bloque no puede detectar
  conflictos de ese tipo; no inventes reglas.

## Reglas

- **Solo detecta.** Prohibido proponer soluciones, reescribir la spec o
  escribir código. Si se te escapa una solución, no la des todavía.
- **No escribas nombres de archivos ni detalles de implementación** en los
  hallazgos; son problemas de la spec, no del plan.
- No inventes requisitos ni rellenes huecos: señálalos y deja que el autor
  decida.
- Si se usa EARS, comprueba que cada RF siga un patrón coherente. Si el proyecto
  define otra convención, comprueba esa convención en su lugar.
- Idioma: el de la convención del proyecto; si no existe, el del usuario.
