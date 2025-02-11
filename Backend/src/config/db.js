import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
// Verificar las variables de entorno
console.log("🔍 Configuración de la base de datos:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS); 
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

// Crear pool de conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Función para probar la conexión
export const testDBConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a la base de datos exitosa");
    connection.release(); // Liberar conexión
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
  }
};

export default pool;
