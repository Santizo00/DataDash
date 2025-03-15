import express from "express";
import { check } from "express-validator";
import { sendVerificationCode, verifyCode, registerUser , checkUserExists} from "../controllers/registerController.js";

const router = express.Router();


router.post(
    "/check-user",
    [
        check("email").isEmail().withMessage("Correo inválido"),
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
    ],
    checkUserExists
);

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

router.post(
    "/createUser",
    [
        check("nombres").notEmpty().withMessage("El nombre es obligatorio"),
        check("apellidos").notEmpty().withMessage("El apellido es obligatorio"),
        check("email").isEmail().withMessage("Correo inválido"),
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
        check("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    ],
    registerUser
);

export default router;
