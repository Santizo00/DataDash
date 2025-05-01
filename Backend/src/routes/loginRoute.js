import express from "express";
import { check } from "express-validator";
import { loginUser, verifyOtp, activateOtp } from "../controllers/loginController.js";

const router = express.Router();

/**
 * Ruta para validar credenciales de inicio de sesión
 */
router.post("/login", loginUser);

/**
 * Ruta para verificar el código OTP
 */
router.post(
    "/verify-otp",
    [
        check("userId").isNumeric().withMessage("ID de usuario inválido"),
        check("otpCode").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 dígitos"),
    ],
    verifyOtp
);

/**
 * Ruta para activar la autenticación OTP después de configurarla
 */
router.post(
    "/activate-otp",
    [
        check("userId").isNumeric().withMessage("ID de usuario inválido"),
        check("otpCode").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 dígitos"),
    ],
    activateOtp
);

export default router;