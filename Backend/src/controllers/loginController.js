import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import speakeasy from "speakeasy"; // Para verificar tokens OTP

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

        // Buscar el usuario desencriptando el nombre de usuario
        for (const user of users) {
            const decryptedUsername = crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8);

            if (decryptedUsername === username) {
                foundUser = { ...user, decryptedUsername };
                break;
            }
        }

        if (!foundUser) {
            return res.status(401).json({ message: "Usuario incorrecto. Verifica y vuelve a intentarlo." });
        }

        // Verificar la contraseña con bcrypt
        const isPasswordValid = await bcrypt.compare(password, foundUser.contrasena);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Contraseña incorrecta. Verifica y vuelve a intentarlo." });
        }

        // Verificar si el usuario tiene OTP activado
        const requiresOtp = foundUser.otp_activado || false;
        const userId = foundUser.id_usuario;

        // Si todo es correcto, enviar la información al frontend
        return res.status(200).json({ 
            message: "Credenciales correctas", 
            requiresOtp,
            userId
        });

    } catch (error) {
        console.error("❌ Error en autenticación:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

export const verifyOtp = async (req, res) => {
    const { userId, otpCode } = req.body;

    try {
        if (!userId || !otpCode) {
            return res.status(400).json({ message: "ID de usuario y código OTP son requeridos" });
        }

        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Obtener el usuario de la base de datos
        const [users] = await pool.query("SELECT * FROM usuarios WHERE id_usuario = ?", [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const user = users[0];

        // Verificar si el usuario tiene OTP activado
        if (!user.otp_activado || !user.passotp) {
            return res.status(400).json({ message: "Este usuario no tiene activada la autenticación OTP" });
        }

        // Desencriptar el secreto OTP
        const decryptedOtpSecret = crypto.AES.decrypt(user.passotp, process.env.SECRET_KEY).toString(crypto.enc.Utf8);

        // Verificar el código OTP
        const verified = speakeasy.totp.verify({
            secret: decryptedOtpSecret,
            encoding: 'base32',
            token: otpCode
        });

        if (!verified) {
            return res.status(401).json({ message: "Código OTP incorrecto" });
        }

        // Si todo es correcto, devolver información del usuario necesaria para la sesión
        return res.status(200).json({ 
            message: "Inicio de sesión exitoso",
            user: {
                id: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                username: crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8),
                rol: user.id_rol
            }
        });

    } catch (error) {
        console.error("❌ Error en verificación OTP:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};