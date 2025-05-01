import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Importar las rutas
import registerRoutes from "./routes/registerRoute.js";
import loginRoutes from "./routes/loginRoute.js";
import productsRoute from './routes/productsRoute.js';
import rolesRoute from './routes/rolesRoute.js';
import usersRoute from './routes/usuariosRoute.js';
import kpiRouter from './routes/kpiRoute.js';

// Importar las funciones de test de conexión
import { testMySQLConnection } from "./config/ConfigMySQL.js";
import { testOracleConnection } from "./config/ConfigOracle.js";
import { testPostgresConnection } from "./config/ConfigPostgres.js";
import { testSQLServerConnection } from "./config/ConfigSQLS.js";

// Configurar dotenv para variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(cors()); // Habilitar CORS

// Testear todas las conexiones a bases de datos
const testDatabaseConnections = async () => {
  console.log("🔌 Probando conexiones a bases de datos...");
  await testMySQLConnection();
  await testOracleConnection();
  await testPostgresConnection();
  await testSQLServerConnection();
  
  console.log("✅ Pruebas de conexión completadas");
};

// Ruta de prueba para verificar conexiones manualmente
app.get("/test-connections", async (req, res) => {
  try {
    await testDatabaseConnections();
    res.json({ message: "Pruebas de conexión completadas. Revisa los logs del servidor." });
  } catch (error) {
    res.status(500).json({ error: "Error al probar conexiones" });
  }
});

app.use("/register", registerRoutes); // Agregar la ruta de registro
app.use("/auth", loginRoutes); // Agregar la ruta de autenticación
app.use('/products', productsRoute); // Agregar la ruta de productos
app.use('/roles', rolesRoute); // Agregar la ruta de roles
app.use('/users', usersRoute); // Agregar la ruta de usuarios
app.use('/kpis', kpiRouter); // Agregar la ruta de KPIs

// Configuración del puerto y arranque del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
  // Probar conexiones al iniciar el servidor
  await testDatabaseConnections();
});