import app from "./app.js";
import { testMySQLConnection } from "./config/ConfigMySQL.js";
import { testSQLServerConnection } from "./config/ConfigSQLS.js";
import { testPostgresConnection } from "./config/ConfigPostgres.js";
import { testOracleConnection } from "./config/ConfigOracle.js";

const PORT = process.env.PORT || 5000;

// Probar todas las conexiones antes de iniciar el servidor
async function initializeServer() {
    await testMySQLConnection();
    await testSQLServerConnection();
    await testPostgresConnection();
    await testOracleConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

initializeServer();
