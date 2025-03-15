import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import nodemailer from "nodemailer";


export const checkUserExists = async (req, res) => {
    const { email, username } = req.body;

    try {
        if (!email || !username) {
            return res.status(400).json({ message: "Correo y usuario son requeridos" });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Consultar todos los usuarios en la base de datos
        const [users] = await pool.query("SELECT id_usuario, correo, nombre_usuario FROM usuarios");

        let emailExists = false;
        let usernameExists = false;

        // Desencriptar y comparar cada usuario en la base de datos
        for (const user of users) {
            const decryptedEmail = crypto.AES.decrypt(user.correo, process.env.SECRET_KEY).toString(crypto.enc.Utf8);
            const decryptedUsername = crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8);

            if (decryptedEmail === email) emailExists = true;
            if (decryptedUsername === username) usernameExists = true;

            if (emailExists || usernameExists) break; 
        }

        // Responder si existen en la base de datos
        res.json({
            exists: emailExists || usernameExists,
            emailExists,
            usernameExists
        });

    } catch (error) {
        console.error("❌ Error al verificar usuario:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
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

export const registerUser = async (req, res) => {
    const { nombres, apellidos, email, username, password } = req.body;

    try {
        if (!email || !username || !password || !nombres || !apellidos) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Encriptar email y usuario antes de hacer la consulta
        const encryptedEmail = crypto.AES.encrypt(email, process.env.SECRET_KEY).toString();
        const encryptedUsername = crypto.AES.encrypt(username, process.env.SECRET_KEY).toString();

        // Verificar si ya existe el usuario o correo en la base de datos
        const [emailExists] = await pool.query("SELECT id_usuario FROM usuarios WHERE correo = ?", [encryptedEmail]);
        const [userExists] = await pool.query("SELECT id_usuario FROM usuarios WHERE nombre_usuario = ?", [encryptedUsername]);

        if (emailExists.length > 0) return res.status(400).json({ message: "Correo ya registrado" });
        if (userExists.length > 0) return res.status(400).json({ message: "Usuario ya existe" });

        // Hashear la contraseña antes de insertarla en la base de datos
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario en la base de datos con datos encriptados y contraseña hasheada
        await pool.query(
            "INSERT INTO usuarios (nombres, apellidos, correo, nombre_usuario, contrasena, id_rol) VALUES (?, ?, ?, ?, ?, ?)",
            [nombres, apellidos, encryptedEmail, encryptedUsername, hashedPassword, 2]
        );

        res.status(201).json({ message: "Usuario registrado con éxito" });

    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};