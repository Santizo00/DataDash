// configOracle.js
import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
  user: process.env.DB_USER_Oracle,
  password: process.env.DB_PASS_Oracle,
  connectString: `${process.env.DB_HOST_Oracle}:${process.env.DB_PORT_Oracle}/${process.env.DB_SERVICE_Oracle}`,
  poolMin: 2,
  poolMax: 20,
  poolIncrement: 1,
  poolTimeout: 60,
  poolAlias: 'default'
};

let pool;

export const initOraclePool = async () => {
  if (!pool) {
    pool = await oracledb.createPool(poolConfig);
    console.log("✅ Pool de conexión Oracle creado.");
  }
};

export const closeOraclePool = async () => {
  if (pool) {
    await pool.close(10);
    console.log("✅ Pool Oracle cerrado.");
  }
};

// Exportar el pool directamente como default
export default {
  getConnection: async () => {
    if (!pool) {
      await initOraclePool();
    }
    return await pool.getConnection();
  }
};

// Función de prueba de conexión
export const testOracleConnection = async () => {
  let connection;
  try {
    // Usa la función getConnection del export por defecto
    const poolModule = await import('./ConfigOracle.js');
    connection = await poolModule.default.getConnection();
    console.log("✅ Conexión a Oracle verificada correctamente.");
    return true;
  } catch (error) {
    console.error("❌ Error en la prueba de conexión a Oracle:", error.message);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err.message);
      }
    }
  }
};
