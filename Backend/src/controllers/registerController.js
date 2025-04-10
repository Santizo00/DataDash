import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import speakeasy from "speakeasy"; // Para generar secretos y verificar códigos OTP
import QRCode from "qrcode"; // Para generar códigos QR

export const checkUserExists = async (req, res) => {
    const { username } = req.body;

    try {
        if (!username) {
            return res.status(400).json({ message: "El nombre de usuario es requerido" });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Consultar todos los usuarios en la base de datos
        const [users] = await pool.query("SELECT id_usuario, nombre_usuario FROM usuarios");

        let usernameExists = false;

        // Desencriptar y comparar cada usuario en la base de datos
        for (const user of users) {
            const decryptedUsername = crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8);

            if (decryptedUsername === username) {
                usernameExists = true;
                break;
            }
        }

        // Responder si existe en la base de datos
        res.json({
            exists: usernameExists,
            usernameExists
        });

    } catch (error) {
        console.error("❌ Error al verificar usuario:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

export const generateOtpSecret = async (req, res) => {
    const { username } = req.body;

    try {
        if (!username) {
            return res.status(400).json({ message: "El nombre de usuario es requerido" });
        }

        // Generar un secreto único para la autenticación OTP
        const secret = speakeasy.generateSecret({
            name: `DataDash` // Etiqueta que aparecerá en la app de autenticación
        });

        // Generar URL para código QR
        const otpauth_url = secret.otpauth_url;
        
        // Generar código QR como una URL de datos (data URL)
        const qrCodeUrl = await QRCode.toDataURL(otpauth_url);

        // Devolver la información al cliente
        res.json({
            secret: secret.base32, // Secreto en formato base32 para guardar
            qrCode: qrCodeUrl // URL de datos del código QR para mostrar al usuario
        });

    } catch (error) {
        console.error("❌ Error al generar secreto OTP:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

export const verifyOtpCode = (req, res) => {
    const { code, secret } = req.body;

    if (!code || !secret) {
        return res.status(400).json({ message: "Código y secreto son requeridos" });
    }

    try {
        // Verificar el código OTP usando el secreto
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: code
        });

        if (!verified) {
            return res.status(400).json({ message: "Código incorrecto" });
        }

        return res.json({ message: "Código verificado correctamente" });
    } catch (error) {
        console.error("❌ Error al verificar código OTP:", error);
        return res.status(500).json({ message: "Error en la verificación", error: error.message });
    }
};

export const registerUser = async (req, res) => {
    const { nombres, apellidos, username, password, otpSecret } = req.body;

    try {
        if (!username || !password || !nombres || !apellidos) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Encriptar username antes de hacer la consulta
        const encryptedUsername = crypto.AES.encrypt(username, process.env.SECRET_KEY).toString();

        // Verificar si ya existe el usuario en la base de datos
        const [userExists] = await pool.query("SELECT id_usuario FROM usuarios WHERE nombre_usuario = ?", [encryptedUsername]);

        if (userExists.length > 0) return res.status(400).json({ message: "Usuario ya existe" });

        // Hashear la contraseña antes de insertarla en la base de datos
        const hashedPassword = await bcrypt.hash(password, 10);

        // Encriptar el secreto OTP si está presente
        let encryptedOtpSecret = null;
        let otpActivado = false;
        
        if (otpSecret) {
            encryptedOtpSecret = crypto.AES.encrypt(otpSecret, process.env.SECRET_KEY).toString();
            otpActivado = true;
        }

        // Insertar usuario en la base de datos con datos encriptados
        await pool.query(
            "INSERT INTO usuarios (nombres, apellidos, nombre_usuario, contrasena, passotp, otp_activado, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nombres, apellidos, encryptedUsername, hashedPassword, encryptedOtpSecret, otpActivado, 2]
        );

        res.status(201).json({ message: "Usuario registrado con éxito" });

    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};