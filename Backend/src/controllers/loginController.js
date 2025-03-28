import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import nodemailer from "nodemailer";

export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son obligatorios." });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Obtener todos los usuarios de la base de datos
        const [users] = await pool.query("SELECT * FROM usuarios");

        let foundUser = null;

        // 🔹 Buscar el usuario desencriptando el correo y nombre de usuario
        for (const user of users) {
            const decryptedEmail = crypto.AES.decrypt(user.correo, process.env.SECRET_KEY).toString(crypto.enc.Utf8);
            const decryptedUsername = crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8);

            if (decryptedEmail === username || decryptedUsername === username) {
                foundUser = { ...user, decryptedEmail };
                break;
            }
        }

        if (!foundUser) {
            return res.status(401).json({ message: "Usuario incorrecto. Verifica y vuelve a intentarlo." });
        }

        // 🔹 Verificar la contraseña con bcrypt
        const isPasswordValid = await bcrypt.compare(password, foundUser.contrasena);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Contraseña incorrecta. Verifica y vuelve a intentarlo." });
        }

        // 🔹 Si todo es correcto, enviar el correo desencriptado al frontend
        return res.status(200).json({ message: "Inicio de sesión exitoso", email: foundUser.decryptedEmail });

    } catch (error) {
        console.error("❌ Error en autenticación:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};


const verificationCodes = new Map(); 

export const sendVerificationCode = async (req, res) => {
    const { email, username } = req.body;

    try {
        if (!email || !username) {
            return res.status(400).json({ message: "Correo y usuario son requeridos" });
        }

        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar código con expiración de 2 minutos
        verificationCodes.set(email, { code, expiresAt: Date.now() + 2 * 60 * 1000 });

        // Configuración del servicio de correo
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Soporte" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Código de Verificación",
            text: `Tu código de verificación es: ${code}. Expira en 2 minutos.`,
        });

        res.json({ message: "Código enviado" });

    } catch (error) {
        console.error("❌ Error al enviar código:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

export const verifyCode = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: "Datos inválidos" });
    }

    const storedCode = verificationCodes.get(email);

    if (!storedCode) {
        return res.status(400).json({ message: "Código expirado o inválido" });
    }

    if (Date.now() > storedCode.expiresAt) {
        verificationCodes.delete(email);
        return res.status(400).json({ message: "Código expirado, solicita uno nuevo" });
    }

    if (storedCode.code !== code) {
        return res.status(400).json({ message: "Código incorrecto" });
    }

    verificationCodes.delete(email);
    return res.json({ message: "Código verificado" });
};
