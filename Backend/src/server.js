import app from "./app.js";
import { testDBConnection } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Probar la conexión a la base de datos antes de iniciar el servidor
testDBConnection();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
