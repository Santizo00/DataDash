import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Importar las rutas
import registerRoutes from "./routes/registerRoute.js";

// Configurar dotenv para variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(cors()); // Habilitar CORS


app.use("/register", registerRoutes); // Agregar la ruta de registro

// Configuración del puerto y arranque del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
