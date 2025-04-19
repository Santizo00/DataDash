import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const configSQLServer = {
  user: process.env.DB_USER_SQLServer,
  password: process.env.DB_PASS_SQLServer,
  server: process.env.DB_HOST_SQLServer,
  database: process.env.DB_NAME_SQLServer,
  port: parseInt(process.env.DB_PORT_SQLServer, 10) || 1433,
  
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // para localhost / desarrollo
    trustServerCertificate: true,
    enableArithAbort: true
  }
  
};

const pool = new sql.ConnectionPool(configSQLServer);

export const testSQLServerConnection = async () => {
  try {
    await pool.connect();
    console.log("✅ Conexión exitosa a SQL Server");
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con SQL Server:", error.message);
    console.error("Stack:", error.stack);
    return false;
  }
};

export default pool;
