import express from 'express';
import { 
    obtenerProductos,
    obtenerBasesDatos
} from '../controllers/productsController.js';

const router = express.Router();

// Rutas para operaciones con productos
router.get('/basesdatos', obtenerBasesDatos); 
router.get('/', obtenerProductos); 

export default router;