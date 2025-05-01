// productsRoute.js
import express from 'express';
import { 
    obtenerRoles,
    crearRol,
    actualizarRol,
    eliminarRol
} from '../controllers/rolesController.js';

const router = express.Router();

// Rutas para el CRUD de roles
router.get('/', obtenerRoles);
router.post('/insert', crearRol);
router.put('/update:id', actualizarRol);
router.delete('/delete:id', eliminarRol);

export default router;