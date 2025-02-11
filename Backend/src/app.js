import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js"; // Importa las rutas

dotenv.config();

const app = express();

// Middlewares
app.use(express.json()); // Para manejar JSON en las peticiones
app.use(cors()); // Habilita CORS para la conexión con el frontend
app.use(morgan("dev")); // Logs de las peticiones

// Rutas
app.use("/api", routes);

import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);


export default app;
