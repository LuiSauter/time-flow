---
name: plan-generator
description: Usa esta skill cuando el usuario pida generar un plan de implementación para una especificación existente y aprobada. No la uses para crear o revisar specs, descomponer tareas, implementar código ni validar una implementación.
---

# Generador de planes

Convierte una spec aprobada en un plan de implementación verificable. El plan
traduce el qué de la spec a decisiones técnicas, superficies afectadas y una
estrategia de verificación. No contiene código de implementación.

## Proceso

1. **Resuelve la entrada.** Usa la spec y la ruta indicadas por el usuario. Si
   la ubicación del plan no está definida, descubre la convención existente en
   el repositorio y su documentación. Si hay varias opciones, pregunta antes
   de escribir.
2. **Lee el contexto aplicable.** Consulta `AGENTS.md` y
   `docs/constitution.md` únicamente si existen. Lee documentación, manifests,
   configuración y código solo de las áreas que la spec afecte. No cargues
   specs anteriores salvo que la spec o el proyecto las referencien.
3. **Comprueba que la spec está lista.** Si contiene
   `[NECESITA ACLARACIÓN]`, decisiones pendientes o contradicciones evidentes,
   detente, describe el bloqueo y solicita que se resuelva. No invoques otra
   skill ni decidas por el autor.
4. **Identifica el alcance técnico.** Determina qué paquetes, componentes,
   servicios, contratos, datos, integraciones o superficies del repositorio
   están implicados. Si no puede determinarse, pide aclaración.
5. **Genera** el `plan.md` en la ubicación acordada. Incluye solo las secciones
   aplicables de la estructura siguiente y asocia cada parte a los RF que
   cubra.
6. **Verifica la cobertura.** Cierra con una tabla de trazabilidad
   `RF → implementación → verificación`. Todos los RF deben tener una fila y
   una forma concreta de comprobarse.

## Estructura del plan

Las secciones siguientes son un menú. Incluye las que aporten información para
esta funcionalidad y omite las que no apliquen. No fuerces una arquitectura ni
un tipo de interfaz.

### Alcance y superficies afectadas

Indica qué áreas del repositorio se verán afectadas y qué queda fuera del plan.
Usa nombres reales del proyecto solo después de descubrirlos en el contexto.
Asocia los RF relevantes.

### Estructura y responsabilidades

Describe los componentes, módulos, capas o paquetes que deban cambiar y la
responsabilidad de cada uno. Incluye dependencias entre ellos cuando sean
relevantes. No impongas una separación que el proyecto no use.

### Contratos, datos y estados

Incluye únicamente lo aplicable: contratos externos, modelos, esquemas,
eventos, estados, persistencia, migraciones, compatibilidad o reglas de
validación. Describe cambios y riesgos sin inventar formatos no definidos.

### Flujos y comportamiento técnico

Describe secuencias, transiciones, algoritmos, manejo de errores, concurrencia
o idempotencia cuando sean necesarios para implementar los RF. Usa pseudocódigo
solo si aclara una decisión y no escribas el código final.

### Integraciones y compatibilidad

Incluye dependencias externas, contratos entre componentes, migraciones,
versionado, despliegue, seguridad, rendimiento o compatibilidad solo cuando la
spec o el contexto del proyecto los hagan relevantes.

### Decisiones técnicas

Tabla recomendada: `Decisión | Motivo | Alternativas consideradas | RF`. Basa
las decisiones en el código y las reglas reales del proyecto. Si falta una
decisión necesaria, márcala como bloqueo en vez de inventarla.

### Estrategia de verificación

Indica verificaciones automatizadas y manuales, su alcance y los RF que cubren.
Usa los comandos definidos por el proyecto cuando estén disponibles; no
inventes comandos universales. Incluye casos positivos, errores y límites
relevantes.

### Trazabilidad RF → implementación → verificación

Tabla mínima: `RF | Superficie de implementación | Verificación | Evidencia
esperada`. No cierres el plan mientras algún RF carezca de implementación o
verificación prevista.

## Reglas

- No escribas código de implementación. Puedes mencionar archivos, símbolos,
  contratos o comandos existentes como referencias del plan.
- No inventes stack, arquitectura, comandos, convenciones ni restricciones.
- Trata las reglas encontradas en el proyecto como contexto aplicable, no como
  reglas universales para otros proyectos.
- Cubre todos los RF de la spec y conserva sus identificadores.
- Mantén separadas la implementación prevista y la evidencia que la verificará.
- Escribe el plan en el idioma de la documentación del proyecto; si no existe
  una convención, usa el idioma del usuario.
- Si falta información o detectas un conflicto, reporta el bloqueo y detente.
- No invoques `spec-reviewer` ni ninguna otra skill.
