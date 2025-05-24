# DataDash
DataDash es una aplicación web segura para visualizar y analizar indicadores clave de rendimiento (KPIs). Cuenta con inicio de sesión encriptado, autenticación de dos factores y soporte conexiones a Oracle, SQL Server, PostgreSQL y MySQL. La aplicación proporciona una interfaz intuitiva para la entrada de datos y la visualización detallada de métricas KPI.

📦 Estructura General del Proyecto: DataDash

```text
DataDash/
│
├── Backend/              → Backend Node.js con múltiples configuraciones de base de datos
│   ├── src/
│   │   ├── config/       → Archivos de configuración de conexión a bases de datos
│   │   │   ├── ConfigMySQL.js
│   │   │   ├── ConfigSQLS.js      (SQL Server)
│   │   │   ├── ConfigPostgres.js
│   │   │   └── ConfigOracle.js
│   │   ├── controllers/  → Lógica para manejo de rutas y peticiones HTTP
│   │   │   ├── loginController.js
│   │   │   ├── registerController.js
│   │   │   ├── productsController.js
│   │   │   ├── kpiController.js    → Controlador para cálculo de KPIs
│   │   │   ├── rolesController.js
│   │   │   └── usuariosController.js 
│   │   ├── middleware/   → Manejo de errores u otros middlewares
│   │   │   └── errorHandler.js
│   │   ├── routes/       → Definición de rutas REST
│   │   │   ├── loginRoute.js
│   │   │   ├── registerRoute.js
│   │   │   ├── productsRoute.js
│   │   │   ├── kpiRoute.js        → Rutas para acceso a KPIs
│   │   │   ├── rolesRoute.js
│   │   │   └── usuariosRoute.js 
│   │   ├── app.js        → Configuración global de la app Express
│   │   └── server.js     → Arranque del servidor
│   ├── .env              → Variables de entorno (puertos, credenciales)
│   └── package.json      → Dependencias y scripts del backend
│
├── Frontend/             → Aplicación React con Vite
│   ├── public/           → Archivos estáticos
│   ├── src/
│   │   ├── components/   → Componentes reutilizables
│   │   │   ├── AlertService.tsx
│   │   │   ├── loadingService.tsx
│   │   │   ├── Table.tsx            → Tabla reutilizable con paginación y ordenamiento
│   │   │   ├── ModalProduct.tsx     → Modal para creación y edición de productos
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/        → Vistas principales del sistema
│   │   │   ├── Products.tsx       
│   │   │   ├── Users.tsx           
│   │   │   ├── Roles.tsx            
│   │   │   ├── Login.tsx          
│   │   │   └── Home.tsx            → Dashboard con visualizaciones KPI
│   │   ├── App.tsx       → Configuración de rutas
│   │   ├── main.tsx      → Punto de entrada de la app React
│   │   └── vite-env.d.ts
│   ├── index.html
│   └── package.json      → Dependencias y scripts del frontend
│
├── main.js               → Punto de entrada general del proyecto (opcional)
└── package.json          → Si se usa monorepo o scripts conjuntos
```

⚙️ Configuración de Bases de Datos
Dentro de Backend/src/config/tienes archivos dedicados para conectarte a cuatro motores distintos:

- ConfigMySQL.js → Crea una conexión a MySQL usando mysql2/promise.
- ConfigSQLS.js → Conecta a SQL Server usando mssql.
- ConfigPostgres.js → Conexión con PostgreSQL vía pg.
- ConfigOracle.js → Usa oracledb para conectar con Oracle.

Cada archivo exporta una instalación de conexión que luego se puede usar para hacer query() o ejecutar() dependiendo del motor.

# 🧠 Módulo de Productos Multi-DB

## 🔍 Descripción Extendida
Este módulo permite la inserción y actualización de productos en una o múltiplos bases de datos desde una interfaz React. En realidad soporta MySQL, SQL Server, PostgreSQL y Oracle. Desde el frontend se selecciona la base deseada (o todas), y el backend ejecuta la lógica necesaria para operar sobre cada una de ellas de forma desacoplada, reportando errores específicos si ocurren.

---

## ➕ Inserción de Productos

### 🔄 Flujo de Inserción
1. El usuario abre el modal de productos (`ModalProduct.tsx`) y llena los campos necesarios.
2. Selecciona una base desde el campo `Id_Base`. Las opciones son específicas (MySQL, SQL Server, etc.) o "Todas las Bases" (`Id_Base = 1`).
3. Se realiza un `POST` a `/products/insert`, enviando los datos del formulario.
4. El backend evalúa el `Id_Base` y ejecuta inserciones:
   - Si `Id_Base = 1`: se intenta insertar en las 4 bases con manejo individual de errores.
   - Si `Id_Base = X`: se inserta solamente en la base correspondiente (según `switch`).
5. El frontend muestra un resumen:
   - Bases donde fue exitoso ✅
   - Bases donde falló ❌ con su mensaje

### 🟢 Resultado UI
Los productos insertados se agregan visualmente a la tabla (`Table.tsx`), mostrando la base de datos de origen. Si se insertó en varias, se agregan tantas filas como bases involucradas.

---

## ✏️ Actualización de Productos

### ⚙️ Lógica General del Update
La función `handleSubmit` distingue entre inserción y actualización basándose en si `productoEditando` es `null`. Para la actualización se manejan 3 casos:

### 🧩 Caso 1: Cambio solo de datos (misma base)
- Se detecta que `Id_Base` no ha cambiado.
- Se actualiza el producto directamente en esa base.
- Se actualiza la fila en el estado (`productos[]`) con los nuevos valores.
- No se realiza ninguna operación de eliminación.

### 🔀 Caso 2: Cambio de base
- Si el usuario edita el producto y cambia la base:
  - Se elimina el producto de la base original.
  - Se verifica si el producto (mismo `CodigoProducto`) ya existe en la nueva base:
    - Si existe: se actualiza.
    - Si no existe: se inserta uno nuevo.
- En el frontend:
  - Se elimina el producto visualmente del `productos[]` por `CodigoProducto + base original`
  - Se agrega uno nuevo con base actualizada

### 🌐 Caso 3: "Todas las Bases"
- Se replica el comportamiento del caso 2 pero aplicado a **todas** las bases.
- Se actualiza en cada base si el producto existe.
- Se inserta si no existe.
- No se elimina el producto de la base original.

---

## 🔄 Activación/Desactivación de Productos

### 🔄 Flujo de Activación/Desactivación
1. El usuario hace clic en el botón de activar/desactivar en la columna de acciones.
2. Se muestra una alerta de confirmación con un checkbox para elegir el alcance:
   - Cambiar estado solo en la base actual
   - Cambiar estado en todas las bases donde exista el producto
3. Se realiza un PUT a /products/cambiar-estado, enviando el código, estado actual y alcance.
4. El backend ejecuta la actualización del campo Activo en las bases seleccionadas.
5. El frontend actualiza la interfaz de manera dinámica y muestra un resumen detallado.

### 🎨 Visualización en Frontend
- Productos con diferentes estados se muestran con indicadores visuales (verde/rojo)
- Los botones de acción cambian según el estado actual
- Filtro dropdown para mostrar todos los productos, solo activos o solo inactivos

---

# 📊 Módulo de KPIs y Dashboard

## 🔍 Descripción
Este módulo proporciona visualizaciones y análisis de indicadores clave de rendimiento (KPIs) para los productos almacenados en todas las bases de datos. Permite ver métricas consolidadas o filtrar por base de datos específica.

## 📋 Características principales
- **Visualización multi-base**: Capacidad para cambiar entre diferentes bases de datos
- **Métricas clave**: Monitoreo de inventario, precios, costos y márgenes
- **Gráficos interactivos**: Distribución de productos, estado de actividad y análisis por producto
- **Filtrado dinámico**: Selector para cambiar entre vistas consolidadas o por base específica

## 🛠️ Funcionalidades implementadas

### Backend (kpiController.js)
1. **Cálculo de KPIs consolidados**:
   - Recopilación de datos desde todas las bases configuradas
   - Cálculo de indicadores como:
     - Total de productos y existencias
     - Valor de inventario (costo) y venta (precio)
     - Utilidad potencial y márgenes
     - Distribución por base de datos
     - Estado de productos (activos/inactivos)

2. **Filtrado por base específica**:
   - Endpoint que acepta parámetro de filtro por base
   - Cálculo de métricas específicas para la base seleccionada

### Frontend (Home.tsx)
1. **Panel de tarjetas de indicadores**:
   - Visualización clara de métricas numéricas principales
   - Iconos descriptivos y formato profesional

2. **Gráficos interactivos**:
   - Gráfico circular de distribución por base de datos
   - Gráfico circular de estado de productos (activos/inactivos)
   - Gráficos de barras con detalle de precios, costos y márgenes por producto

3. **Selector de base de datos**:
   - Opción para ver datos consolidados o filtrar por base específica
   - Actualización dinámica de todos los gráficos al cambiar la selección

---

# 🧠 Módulo de Roles

## 🔍 Descripción
Este módulo permite la gestión completa de roles en el sistema, implementado como un CRUD (Crear, Leer, Actualizar, Eliminar) básico. Gestiona los roles de usuario a nivel de sistema, conectándose únicamente a la base de datos MySQL donde se almacena la tabla de roles.

## 📋 Estructura de datos
La tabla de roles tiene una estructura sencilla:
- `id_rol` (INT): Identificador único del rol
- `nombre_rol` (VARCHAR[50]): Nombre descriptivo del rol
- `descripcion` (VARCHAR[255]): Descripción detallada de las funciones del rol

## 🛠️ Funcionalidades implementadas

### Backend (rolesController.js)
1. **Obtener roles**: Endpoint GET para listar todos los roles disponibles
   - Ruta: `/roles/`
   - Realiza ordenamiento por ID del rol
   
2. **Crear rol**: Endpoint POST para crear nuevos roles
   - Ruta: `/roles/insert`
   - Validación para evitar nombres duplicados
   
3. **Actualizar rol**: Endpoint PUT para modificar roles existentes
   - Ruta: `/roles/update:id`
   - Verificación de existencia del rol
   
4. **Eliminar rol**: Endpoint DELETE para eliminar roles
   - Ruta: `/roles/delete:id`
   - Protección contra eliminación de roles en uso

### Frontend (Roles.tsx)
1. **Listado de roles**: Tabla con paginación y ordenamiento
2. **Filtrado**: Búsqueda por nombre o descripción
3. **Formulario de edición/creación**: Modal con validación de campos
4. **Eliminación**: Confirmación antes de eliminar

---

# 🔐 Módulo de Usuarios y Autenticación

## 🔍 Descripción
Este módulo permite la gestión completa de usuarios y su seguridad, implementando un sistema CRUD completo con características avanzadas de seguridad. Gestiona los usuarios del sistema almacenados en MySQL con soporte para encriptación de datos sensibles y autenticación de dos factores (2FA).

## 📋 Estructura de datos
La tabla de usuarios tiene la siguiente estructura:
- `id_usuario` (INT): Identificador único del usuario
- `nombres` (VARCHAR): Nombres del usuario
- `apellidos` (VARCHAR): Apellidos del usuario
- `nombre_usuario` (TEXT): Nombre de usuario encriptado
- `contrasena` (VARCHAR): Contraseña hasheada con bcrypt
- `passotp` (TEXT): Secreto OTP encriptado para 2FA
- `otp_activado` (TINYINT): Estado de activación del 2FA
- `id_rol` (INT): Rol asignado al usuario
- `fecha_registro` (TIMESTAMP): Fecha de creación del usuario

## 🔐 Características de Seguridad
- **Encriptación AES**: Los nombres de usuario y secretos OTP se almacenan encriptados
- **Hash de contraseñas**: Se utiliza bcrypt para almacenar contraseñas de forma segura
- **Autenticación de dos factores (2FA)**: Implementación completa con QR y verificación
- **Flujo de configuración obligatoria de 2FA**: Los usuarios deben configurar 2FA en su primer inicio de sesión

## 🛠️ Funcionalidades implementadas

### Backend (usuariosController.js)
1. **Gestión de usuarios**:
   - CRUD completo de usuarios (obtener, crear, actualizar, eliminar)
   - Validaciones para prevenir duplicados y manejar datos encriptados
   - Protección para el usuario administrador principal

2. **Autenticación**:
   - Verificación segura de credenciales con desencriptado de nombres de usuario
   - Validación de contraseñas utilizando bcrypt
   - Flujo completo de verificación OTP para 2FA
   - Configuración inicial de 2FA para nuevos usuarios

### Frontend
1. **Usuarios.tsx**:
   - Tabla completa con filtrado y paginación
   - Modal para creación/edición de usuarios
   - Gestión de permisos por roles
   - Funcionalidad para limpiar la configuración 2FA de usuarios

2. **Login.tsx**:
   - Interfaz de inicio de sesión con validación de credenciales
   - Flujo de configuración de 2FA para usuarios nuevos
   - Verificación de códigos OTP para usuarios con 2FA activado
   - Generación y visualización de códigos QR para configuración

## 🔄 Flujos de usuario
1. **Primer inicio de sesión**:
   - Validación de credenciales
   - Generación de código QR para configuración de app de autenticación
   - Verificación de código OTP para activar 2FA
   - Inicio de sesión completo

2. **Inicio de sesión normal**:
   - Validación de credenciales
   - Solicitud y verificación de código OTP
   - Acceso al sistema

3. **Gestión de usuarios (administrador)**:
   - Creación de nuevos usuarios (sin configuración 2FA inicial)
   - Edición de información de usuarios existentes
   - Posibilidad de limpiar la configuración 2FA cuando sea necesario

## 🔗 Integración con otros módulos
El módulo de Usuarios y Autenticación se integra con:
- **Módulo de Roles**: Asignación de permisos basados en roles
- **Sistema de Protección de Rutas**: Control de acceso basado en autenticación y roles
- **Módulos de Negocio**: Asignación de operaciones según permisos de usuario

---

## ✅ Conclusión
DataDash implementa una aplicación completa y segura para la gestión de productos en múltiples bases de datos, con un sistema robusto de usuarios y roles. La seguridad es prioritaria con características como encriptación de datos sensibles, hash de contraseñas y autenticación de dos factores obligatoria. El sistema ofrece una interfaz intuitiva y proporciona retroalimentación clara al usuario sobre el resultado de todas las operaciones. El nuevo módulo de KPIs proporciona capacidades de análisis avanzadas para la toma de decisiones basada en datos.