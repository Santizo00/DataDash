import express from 'express';
import { 
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} from '../controllers/usuariosController.js';

const router = express.Router();

// Rutas para el CRUD de usuarios
router.get('/', obtenerUsuarios);
router.post('/insert', crearUsuario);
router.put('/update:id', actualizarUsuario);
router.delete('/delete:id', eliminarUsuario);

export default router;