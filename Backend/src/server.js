import app from "./app.js";
import { testDBConnection } from "./config/ConfigMySQL.js";
import { testSQLServerConnection } from "./config/ConfigSQLS.js";

const PORT = process.env.PORT || 5000;

// Probar ambas conexiones antes de iniciar el servidor
async function initializeServer() {
    await testSQLServerConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

initializeServer();