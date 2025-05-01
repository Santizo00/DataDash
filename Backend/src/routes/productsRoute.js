// productsRoute.js
import express from 'express';
import { 
    obtenerProductos,
    obtenerBasesDatos,
    insertarProducto,
    actualizarProducto,
    cambiarEstadoProducto // Nueva función
} from '../controllers/productsController.js';

const router = express.Router();

// Rutas para operaciones con productos
router.get('/basesdatos', obtenerBasesDatos); 
router.get('/', obtenerProductos); 
router.post('/insert', insertarProducto); 
router.put('/update', actualizarProducto);
router.put('/cambiar-estado', cambiarEstadoProducto); // Nueva ruta

export default router;