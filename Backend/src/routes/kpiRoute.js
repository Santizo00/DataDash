import express from 'express';
import { obtenerKPIs } from '../controllers/kpiController.js';

const router = express.Router();

// Rutas para KPIs
router.get('/', obtenerKPIs);

export default router;