import express from 'express';
import { 
    obtenerProductosMySQL,
    crearProductoMySQL,
    actualizarProductoMySQL,
    eliminarProductoMySQL
} from '../controllers/productMySQLController.js';

const router = express.Router();

// Rutas para operaciones CRUD con MySQL
router.get('/', obtenerProductosMySQL);
router.post('/', crearProductoMySQL);
router.put('/:id', actualizarProductoMySQL);
router.delete('/:id', eliminarProductoMySQL);

export default router;