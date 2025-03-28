import express from "express";
import { check } from "express-validator";
import { loginUser, sendVerificationCode, verifyCode} from "../controllers/loginController.js";

const router = express.Router();

/**
 * 🆕 Ruta para iniciar sesión
 */
router.post("/login", loginUser);


router.post(
    "/send-code",
    [
        check("email").isEmail().withMessage("Correo inválido"),
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
    ],
    sendVerificationCode
);

router.post(
    "/verify-code",
    [
        check("email").isEmail().withMessage("Correo inválido"),
        check("code").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 dígitos"),
    ],
    verifyCode
);

export default router;
