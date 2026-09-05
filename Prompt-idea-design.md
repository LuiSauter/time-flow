# Time Flow

# PROMPT PARA AGENTE DE IA: DISEÑO PROTOTIPO / WIREFRAME WEB

Actúa como Diseñador de UX/UI Senior y Arquitecto Frontend. Tu objetivo es generar la propuesta completa de diseño prototipo y wireframes detallados en formato web (desktop y responsive) para una aplicación web de seguimiento de horas de trabajo en tiempo real, enfocada en la eliminación de horas muertas y gestión por empresas.

---

## 1. CONTEXTO Y TECNOLOGÍAS DEL PROYECTO

- **Propósito:** Registro preciso de tiempo de trabajo activo vs. descansos por empresa, previniendo horas muertas.

- **Stack Tecnológico:** NestJS (Backend), PostgreSQL + TypeORM/Prisma (DB), React + Tailwind CSS (Frontend), Google OAuth 2.0.

- **Enfoque de Usuarios:** Multitenant a nivel de usuario/cuenta. Cada usuario maneja sus propias empresas, registros y métricas de forma 100% aislada y privada.

---

## 2. ARQUITECTURA DE LA APLICACIÓN & PANTALLAS (LAYOUT BASE)

El diseño debe incluir una barra de navegación superior/lateral consistente con:

- Logotipo y selector activo de **Empresa Actual** (Dropdown: ej. "Nuxio", "Empresa.com", "+ Agregar Empresa").

- Menú de navegación principal: **Home (Tracker)** | **Historial** | **Detalle Diario** | **Dashboard & IA**

- Perfil del usuario (Avatar Google, Nombre, Correo y Botón de Cerrar Sesión).

---

## 3. ESPECIFICACIÓN DE PANTALLAS Y WIREFRAMES

### PANTALLA 1: Authentication / Login

- **Componentes:**

  - Card central minimalista con logo de la app.

  - Título: "Bienvenido a tu Time Tracker".

  - Botón principal de "Iniciar sesión con Google" (OAuth 2.0).

  - Leyenda de privacidad: "Tus registros de tiempo son totalmente privados y únicos para tu cuenta".

---

### PANTALLA 2: Home / Tracker Principal (Pantalla por defecto)

- **Sección Superior (Header Contextual & Filtro):**

  - Módulo con la fecha de hoy (Ej: *Martes, 1 de Septiembre de 2026*).

  - **Switch Toggle de Filtro de Días:** `[ Días Hábiles (L-V) ]` vs `[ Todos los días (L-D) ]`.

  - Selector de Empresa Activa (dropdown o pills horizontales para cambiar entre *Nuxio*, *Empresa.com*, etc.).

- **Sección Central (Resumen de Métricas - Grid de Cards):**

  - **Card 1:** Horas trabajadas ayer (Ej: `6h 45m`).

  - **Card 2:** Horas acumuladas hoy / en curso (Ej: `3h 15m`).

  - **Card 3:** Tiempo total de descanso hoy (Ej: `45m`).

  - **Card 4:** Límite diario de horas configurado (Ej: `8h 00m` con barra de progreso de cumplimiento).

- **Sección Principal (Módulo del Cronómetro / Timer en Tiempo Real):**

  - **Indicador de Estado:** Badges dinámicos (`[ DETENIDO ]`, `[ TRABAJANDO ]`, `[ EN DESCANSO ]`).

  - **Reloj Principal (Typography Extra Large):** Display de tiempo `00:00:00` (Horas:Minutos:Segundos).

  - **Botones de Control Dinámicos:**

    - *Estado Detenido:* Botón prominente verde `[ Comenzar a Trabajar ]`.

    - *Estado Trabajando:* Botón amarillo/naranja `[ Iniciar Descanso ]` + Botón rojo `[ Finalizar Jornada y Guardar ]`.

    - *Estado En Descanso:* Botón verde `[ Reanudar Trabajo ]` + Reloj secundario "Tiempo en descanso actual: 00:12:04".

  - **Tabla / Lista de Sesiones del Día:** Registro en tiempo real de los bloques creados en la sesión activa (Ej: Bloque 1: 09:00 - 11:30 | Descanso: 11:30 - 11:45 | Bloque 2: 11:45 - En curso).

  - **Acción Manual:** Botón de `[ + Registrar Horas Manualmente ]` (abre modal para ingresar fecha, hora inicio, hora fin y empresa sin límite de registros).

---

### PANTALLA 3: Historial de Horas por Día

- **Componentes de Filtro:**

  - Selector de rango de fechas (Filtro por Mes / Semana / Personalizado).

  - Checkbox / Toggle: `Filtrar solo Días Hábiles (L-V)`.

  - Filtro por Empresa (Todas, Nuxio, Empresa.com).

- **Vistas del Historial:**

  - **Vista Lista / Tabla:** Columna Fecha, Día de la semana, Empresa, Total Horas Activas, Total Descansos, Cumplimiento de Meta y Acciones (Ver detalle, Editar, Eliminar).

  - **Resumen al pie de tabla:** Total de horas acumuladas en el período filtrado.

---

### PANTALLA 4: Detalles de Horas y Descansos por Día (Vista Detallada)

- **Header:** Resumen del día seleccionado (Ej: *Detalle del Lunes 31 de Agosto - Empresa: Nuxio*).

- **Línea de Tiempo (Timeline Visual):**

  - Representación gráfica de las 24 horas del día contrastando bloques verdes (Trabajo Activo), bloques amarillos (Descansos) y bloques grises (Tiempo Inactivo).

- **Desglose Estructurado:**

  - Lista cronológica detallada de las entradas del día:

    - *Bloque 1:* 08:30 AM - 12:30 PM (4h 00m) - Trabajo

    - *Descanso 1:* 12:30 PM - 01:15 PM (0h 45m) - Almuerzo

    - *Bloque 2:* 01:15 PM - 05:00 PM (3h 45m) - Trabajo

  - Botón de edición rápida para ajustar minutos u horas en caso de error.

---

### PANTALLA 5: Dashboard de Productividad & Recomendaciones de IA

- **Panel de Métricas Clave (KPIs):**

  - Promedio de horas trabajadas por día hábil.

  - Ratio de trabajo vs. descanso (% de eficiencia).

  - Distribución de horas por Empresa (Gráfico de Torta / Pie Chart).

- **Gráficos Estadísticos:**

  - Gráfico de barras: Horas trabajadas por día durante el último mes (resaltando días hábiles vs fines de semana).

- **Sección Especial: "Insights & Recomendaciones de la IA":**

  - Card inteligente alimentado por IA que analice los patrones de registro e inactividad y genere recomendaciones personalizadas. Ejemplos de cards:

    - *Alerta de Fatiga:* "Estás tomando descansos muy cortos los días Miércoles después de las 4 PM."

    - *Análisis de Distribución:* "El 70% de tus horas trabajadas esta semana fueron para Nuxio."

    - *Optimización:* "Tu promedio de horas activas en días hábiles es de 7.2h. Estás manteniendo un ritmo constante."

---

## 4. ENTREGABLE REQUERIDO AL AGENTE

Por favor, genera:

1. El **esquema del Wireframe en UI Textual / ASCII Art o Maquetación HTML/Tailwind CSS** para cada una de las 5 pantallas descritas.

2. El **Modelo del Estado Frontend (React)** para controlar los estados del cronómetro (`IDLE`, `WORKING`, `PAUSED`) y la persistencia del tiempo en segundo plano.

3. El **Diagrama de Entidades Base de Datos (PostgreSQL)** para soportar la relación `User -> Company -> WorkSession -> BreakSession`.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
