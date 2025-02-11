import { Router } from "express";
import { testDBConnection } from "../config/db.js";

const router = Router();

// Ruta para probar la conexión con la BD
router.get("/ping", async (req, res) => {
  try {
    await testDBConnection();
    res.status(200).json({ message: "Conexión a la base de datos exitosa" });
  } catch (error) {
    res.status(500).json({ message: "Error al conectar con la base de datos" });
  }
});

export default router;
