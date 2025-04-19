import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST_MySQL,
  user: process.env.DB_USER_MySQL,
  password: process.env.DB_PASS_MySQL,
  database: process.env.DB_NAME_MySQL,
});

// Función para probar la conexión
export const testMySQLConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión exitosa a MySQL");
    connection.release(); // Liberar conexión
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
  }
};

export default pool;
