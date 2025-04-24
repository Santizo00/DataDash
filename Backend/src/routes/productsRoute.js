import express from 'express';
import { 
    obtenerProductos,
    obtenerBasesDatos,
    insertarProducto
} from '../controllers/productsController.js';

const router = express.Router();

// Rutas para operaciones con productos
router.get('/basesdatos', obtenerBasesDatos); 
router.get('/', obtenerProductos); 
router.post('/insert', insertarProducto); 

export default router;