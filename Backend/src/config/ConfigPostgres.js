import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

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
