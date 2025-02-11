import { Router } from "express";

const router = Router();

// Ruta para probar la conexión con MySQL
router.get("/ping-mysql", async (req, res) => {
    try {
        await testDBConnection();
        res.status(200).json({ message: "Conexión a MySQL exitosa" });
    } catch (error) {
        res.status(500).json({ message: "Error al conectar con MySQL" });
    }
});

// Ruta para probar la conexión con SQL Server
router.get("/ping-sqlserver", async (req, res) => {
    try {
        const isConnected = await testSQLServerConnection();
        if (isConnected) {
            res.status(200).json({ message: "Conexión a SQL Server exitosa" });
        } else {
            res.status(500).json({ message: "Error al conectar con SQL Server" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al conectar con SQL Server" });
    }
});

export default router;