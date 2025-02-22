import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

// Verificar las variables de entorno
console.log("🔍 Configuración de Oracle:");
console.log("DB_HOST:", process.env.DB_HOST_Oracle);
console.log("DB_USER:", process.env.DB_USER_Oracle);
console.log("DB_PASS:", process.env.DB_PASS_Oracle);
console.log("DB_SERVICE:", process.env.DB_SERVICE_Oracle);
console.log("DB_PORT:", process.env.DB_PORT_Oracle);

// Crear pool de conexión
const poolConfig = {
  user: process.env.DB_USER_Oracle,
  password: process.env.DB_PASS_Oracle,
  connectString: `${process.env.DB_HOST_Oracle}:${process.env.DB_PORT_Oracle}/${process.env.DB_SERVICE_Oracle}`,
};

// Función para probar la conexión
export const testOracleConnection = async () => {
  try {
    const connection = await oracledb.getConnection(poolConfig);
    console.log("✅ Conexión exitosa a Oracle");
    await connection.close();
  } catch (error) {
    console.error("❌ Error al conectar con Oracle:", error.message);
  }
};

export default poolConfig;
