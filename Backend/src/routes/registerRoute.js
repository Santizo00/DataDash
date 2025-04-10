import express from "express";
import { check } from "express-validator";
import { 
    checkUserExists, 
    generateOtpSecret, 
    verifyOtpCode, 
    registerUser 
} from "../controllers/registerController.js";

const router = express.Router();

router.post(
    "/check-user",
    [
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
    ],
    checkUserExists
);

router.post(
    "/generate-otp",
    [
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
    ],
    generateOtpSecret
);

router.post(
    "/verify-otp",
    [
        check("code").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 dígitos"),
        check("secret").notEmpty().withMessage("El secreto OTP es obligatorio"),
    ],
    verifyOtpCode
);

router.post(
    "/createUser",
    [
        check("nombres").notEmpty().withMessage("El nombre es obligatorio"),
        check("apellidos").notEmpty().withMessage("El apellido es obligatorio"),
        check("username").notEmpty().withMessage("El usuario es obligatorio"),
        check("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    ],
    registerUser
);

export default router;