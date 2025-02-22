import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Verificar las variables de entorno
console.log("🔍 Configuración de PostgreSQL:");
console.log("DB_HOST:", process.env.DB_HOST_PostgreSQL);
console.log("DB_USER:", process.env.DB_USER_PostgreSQL);
console.log("DB_PASS:", process.env.DB_PASS_PostgreSQL);
console.log("DB_NAME:", process.env.DB_NAME_PostgreSQL);
console.log("DB_PORT:", process.env.DB_PORT_PostgreSQL);

// Crear pool de conexión
const pool = new Pool({
  user: process.env.DB_USER_PostgreSQL,
  host: process.env.DB_HOST_PostgreSQL,
  database: process.env.DB_NAME_PostgreSQL,
  password: process.env.DB_PASS_PostgreSQL,
  port: process.env.DB_PORT_PostgreSQL,
});

// Función para probar la conexión
export const testPostgresConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conexión exitosa a PostgreSQL");
    client.release(); // Liberar conexión
  } catch (error) {
    console.error("❌ Error al conectar con PostgreSQL:", error.message);
  }
};

export default pool;
