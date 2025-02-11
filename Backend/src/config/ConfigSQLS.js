import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Verificar las variables de entorno
console.log("🔍 Configuración de SQL Server:");
console.log("DB_HOST:", process.env.DB_HOST_SQLServer);
console.log("DB_USER:", process.env.DB_USER_SQLServer);
console.log("DB_PASS:", process.env.DB_PASS_SQLServer);
console.log("DB_NAME:", process.env.DB_NAME_SQLServer);
console.log("DB_PORT:", process.env.DB_PORT_SQLServer);

const configSQLServer = {
    user: process.env.DB_USER_SQLServer,
    password: process.env.DB_PASS_SQLServer,
    server: process.env.DB_HOST_SQLServer, // localhost
    database: process.env.DB_NAME_SQLServer,
    port: parseInt(process.env.DB_PORT_SQLServer) || 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // Cambiado a false para conexión local
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000,
        // Quitamos instanceName ya que usas la instancia predeterminada
    }
};

// Crear pool de conexión
const pool = new sql.ConnectionPool(configSQLServer);

// Función para probar la conexión con más detalles de error
export const testSQLServerConnection = async () => {
    try {
        console.log("Intentando conectar a SQL Server...");
        await pool.connect();
        console.log("✅ Conexión a SQL Server exitosa");
        return true;
    } catch (error) {
        console.error("❌ Error al conectar con SQL Server:", error.message);
        console.error("Stack de error:", error.stack);
        return false;
    }
};

export default pool;