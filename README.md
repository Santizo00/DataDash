# DataDash
DataDash es una aplicación web segura para visualizar y analizar indicadores clave de rendimiento (KPIs). Cuenta con inicio de sesión encriptado, autenticación de dos factores y soporte conexiones a Oracle, SQL Server, PostgreSQL y MySQL. La aplicación proporciona una interfaz intuitiva para la entrada de datos y la visualización detallada de métricas KPI.

📦 Estructura General del Proyecto: DataDash
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
│   │   │   └── rolesController.js   
│   │   ├── middleware/   → Manejo de errores u otros middlewares
│   │   │   └── errorHandler.js
│   │   ├── routes/       → Definición de rutas REST
│   │   │   ├── loginRoute.js
│   │   │   ├── registerRoute.js
│   │   │   ├── productsRoute.js
│   │   │   └── rolesRoute.js    
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
│   │   │   ├── Products.tsx         → Vista principal con tabla y modal
│   │   │   ├── Users.tsx
│   │   │   ├── Roles.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Home.tsx
│   │   ├── App.tsx       → Configuración de rutas
│   │   ├── main.tsx      → Punto de entrada de la app React
│   │   └── vite-env.d.ts
│   ├── index.html
│   └── package.json      → Dependencias y scripts del frontend
│
├── main.js               → Punto de entrada general del proyecto (opcional)
└── package.json          → Si se usa monorepo o scripts conjuntos

⚙️ Configuración de Bases de Datos
Dentro de Backend/src/config/tienes archivos dedicados para conectarte a cuatro motores distintos:

- ConfigMySQL.js → Crea una conexión a MySQL usando mysql2/promise.
- ConfigSQLS.js → Conecta a SQL Server usando mssql.
- ConfigPostgres.js → Conexión con PostgreSQL vía pg.
- ConfigOracle.js → Usa oracledb para conectar con Oracle.

Cada archivo exporta una instalación de conexión que luego se puede usar para hacer query() o ejecutar() dependiendo del motor.

🧠 Funcionamiento del Módulo de Productos
🎛️ Componente: Productos.tsx
El frontend carga los productos haciendo una sola película a /products/, que los obtiene desde todas las bases configuradas.

- Se usa un filtro (select) para cambiar entre bases o mostrar "Todas las Bases".
- Se integra una tabla (Table.tsx) con paginación y ordenamiento.
- Se abre un modal (ModalProduct.tsx) para agregar/editar productos.
- El formulario incluye un selector de base de datos (Id_Base) que determina hacia qué base o bases se inserta el nuevo producto.

⚙️ Backend: productsController.js
En la función de inserción (pendiente de implementar), se evalúa el Id_Base recibido.

Se usa un switch-case:

1 → Inserta en todas las bases a la vez (con manejo de errores independientes).
2 → Inserta en MySQL.
3 → Inserta en SQL Server.
4 → Inserta en PostgreSQL.
5 → Inserta en Oracle.

🛠️ Tecnologías Usadas
Backend:
Node.js + Express
Conectores SQL:
- mysql2
- mssql
- pg
- oracledb

dotenv para manejo de entorno

Arquitectura MVC simplificada

Frontend:
React + TypeScript + Vite

@tanstack/react-table para la tabla dinámica

lucide-react para íconos

Tailwind CSS para estilos

React Hooks (useState, useEffect)

Comunicación con backend vía fetch

🔍  ¿Qué hace este proyecto?
DataDash es un sistema de gestión de productos que permiten mostrar, buscar, insertar y actualizar productos en múltiplos bases de datos desde una sola interfaz unificada. Soporta integración con cuatro motores SQL distintos y facilita el análisis de inventarios centralizados.


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

En el frontend:
- Se actualizan todos los productos existentes con el mismo código.
- Se agregan nuevos productos en las bases donde no existe previamente.


Se muestra advertencia al usuario indicando que el producto se actualiza/insertará en todas las bases sin eliminación.

### Mejores Implementadas
- Corrección de tipos de datos para evitar errores en las operaciones SQL.
- Manejo explícito de conversación de tipos en frontend y backend.
- Mensajes de publicidad específicos para cada caso de actualización.
- Manejo visual correcto de los 3 casos de actualización con actualización dinámica de la tabla.
- Prevención de pérdida de datos en el caso "Todas las Bases".

### 📦 Resultado UI
- Se muestra un `SweetAlert` con resumen de bases actualizadas y errores.
- La tabla se actualiza dinámicamente sin necesidad de recargar.

---

🔄 Activación/Desactivación de Productos
🔄 Flujo de Activación/Desactivación

1. El usuario hace clic en el botón de activar/desactivar en la columna de acciones.
2. Se muestra una alerta de confirmación con un checkbox para elegir el alcance:

- Cambiar estado solo en la base actual
- Cambiar estado en todas las bases donde exista el producto

3. Se realiza un PUT a /products/cambiar-estado, enviando el código, estado actual y alcance.
4. El backend ejecuta la actualización del campo Activo en las bases seleccionadas.
5. El frontend actualiza la interfaz de manera dinámica y muestra un resumen detallado.

⚙️ Lógica en Backend
1. La ruta /products/cambiar-estado procesa:
- El código del producto a modificar
- El estado actual (para invertirlo)
- La opción "todasLasBases" (booleano)

2. Para cada base aplicable:
- Ejecuta una actualización SQL del campo Activo
- Lleva registro de éxitos y errores por base
- Retorna un resumen detallado al cliente

🎨 Visualización en Frontend
Productos con diferentes estados se muestran con indicadores visuales:
- Verde para activos
- Rojo para inactivos

Los botones de acción cambian según el estado:
- Botón de "Desactivar" (rojo) para productos activos
- Botón de "Activar" (verde) para productos inactivos

Filtro dropdown para mostrar:
- Todos los productos
- Solo productos activos
- Solo productos inactivos

🔍 Implementación Técnica
La función handleCambiarEstado maneja:
- Lógica de confirmación con checkbox
- Comunicación con el backend
- Actualización del estado local
- Procesamiento del resumen de bases

📊 Beneficios
- Facilita la gestión de inventario sin eliminación física
- Permite control granular por base o global
- Ofrece feedback detallado del resultado
- Mantiene consistencia visual en tiempo real

🧠 Módulo de Roles
🔍 Descripción
Este módulo permite la gestión completa de roles en el sistema, implementado como un CRUD (Crear, Leer, Actualizar, Eliminar) básico. Gestiona los roles de usuario a nivel de sistema, conectándose únicamente a la base de datos MySQL donde se almacena la tabla de roles.
📋 Estructura de datos
La tabla de roles tiene una estructura sencilla:

- id_rol (INT): Identificador único del rol
- nombre_rol (VARCHAR[50]): Nombre descriptivo del rol
- descripcion (VARCHAR[255]): Descripción detallada de las funciones del rol

🛠️ Funcionalidades implementadas
Backend (rolesController.js)
1. Obtener roles: Endpoint GET para listar todos los roles disponibles
- Ruta: /roles/
- Realiza ordenamiento por ID del rol

2. Crear rol: Endpoint POST para crear nuevos roles
- Ruta: /roles/insert
- Validación para evitar nombres duplicados
- Manejo adecuado de campos obligatorios

3. Actualizar rol: Endpoint PUT para modificar roles existentes
- Ruta: /roles/update:id
- Verificación de existencia del rol
- Validación para evitar colisiones de nombres

4. Eliminar rol: Endpoint DELETE para eliminar roles
- Ruta: /roles/delete:id
- Validación de existencia del rol
- Protección contra eliminación de roles en uso (restricción de clave foránea)

Frontend (Roles.tsx)

1. Listado de roles:
- Tabla con paginación usando el componente Table.tsx
- Columnas para ID, nombre y descripción

2. Filtrado:
- Búsqueda por nombre o descripción

3. Formulario de edición/creación:
- Modal para crear o editar roles
- Validación de campos obligatorios
- Retroalimentación visual sobre éxito/error

4. Eliminación:
- Confirmación antes de eliminar
- Manejo de errores si el rol está en uso

💼 Caso de uso
Este módulo está diseñado para permitir a los administradores del sistema gestionar los diferentes niveles de acceso y permisos disponibles en la aplicación. Los roles creados aquí serán posteriormente asignados a usuarios, determinando qué funcionalidades pueden acceder y qué operaciones pueden realizar.


## ✅ Conclusión
La funcionalidad completa de productos multi-DB (inserción, actualización, activación/desactivación) y gestión de roles está implementada con soporte para todos los casos de uso comunes. El sistema es robusto visualmente y funcionalmente, mostrando errores detallados y resultados adecuados al usuario.

