# DataDash
DataDash is a secure web application for visualizing and analyzing key performance indicators (KPIs). It features encrypted login, two-factor authentication, and supports connections to Oracle, SQL Server, and Google Cloud SQL PostgreSQL. The app provides an intuitive interface for data entry and detailed KPI metrics visualization.

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
│   │   │   └── productsController.js
│   │   ├── middleware/   → Manejo de errores u otros middlewares
│   │   │   └── errorHandler.js
│   │   ├── routes/       → Definición de rutas REST
│   │   │   ├── loginRoute.js
│   │   │   ├── registerRoute.js
│   │   │   └── productsRoute.js
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
Dentro de Backend/src/config/ tienes archivos dedicados para conectarte a cuatro motores distintos:

ConfigMySQL.js → Crea una conexión a MySQL usando mysql2/promise.

ConfigSQLS.js → Conecta a SQL Server usando mssql.

ConfigPostgres.js → Conexión con PostgreSQL vía pg.

ConfigOracle.js → Usa oracledb para conectar con Oracle.

Cada archivo exporta una instancia de conexión que luego se puede usar para hacer query() o execute() dependiendo del motor.

🧠 Funcionamiento del Módulo de Productos
🎛️ Componente: Products.tsx
El frontend carga los productos haciendo una sola petición a /products/, que los obtiene desde todas las bases configuradas.

Se usa un filtro (select) para cambiar entre bases o mostrar “Todas las Bases”.

Se integra una tabla (Table.tsx) con paginación y ordenamiento.

Se abre un modal (ModalProduct.tsx) para agregar/editar productos.

El formulario incluye un selector de base de datos (Id_Base) que determina hacia qué base o bases se insertará el nuevo producto.

⚙️ Backend: productsController.js
En la función de inserción (pendiente de implementar), se evalúa el Id_Base recibido.

Se usa un switch-case:

2 → Inserta en MySQL.

3 → Inserta en SQL Server.

4 → Inserta en PostgreSQL.

5 → Inserta en Oracle.

1 → Inserta en todas las bases a la vez (con manejo de errores independientes).

🛠️ Tecnologías Usadas
Backend:
Node.js + Express

Conectores SQL:

mysql2

mssql

pg

oracledb

dotenv para manejo de entorno

Arquitectura MVC simplificada

Frontend:
React + TypeScript + Vite

@tanstack/react-table para la tabla dinámica

lucide-react para íconos

Tailwind CSS para estilos

React Hooks (useState, useEffect)

Comunicación con backend vía fetch

🔍 ¿Qué hace este proyecto?
DataDash es un sistema de gestión de productos que permite mostrar, buscar y (próximamente) insertar productos en múltiples bases de datos desde una sola interfaz unificada. Soporta integración con cuatro motores SQL distintos y facilita el análisis de inventarios centralizados.