import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import speakeasy from "speakeasy"; // Para verificar tokens OTP
import QRCode from "qrcode"; // Para generar códigos QR

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
        const requiresOtp = foundUser.otp_activado === 1;
        const userId = foundUser.id_usuario;

        // Verificar si el usuario tiene configuración OTP pero no está activada
        const needsOtpSetup = !requiresOtp && !foundUser.passotp;

        // Si el usuario necesita configurar OTP
        if (needsOtpSetup) {
            // Generar un nuevo secreto OTP
            const secret = speakeasy.generateSecret({
                name: `DataDash:${foundUser.decryptedUsername}`
            });
            
            // Encriptar el secreto antes de almacenarlo
            const encryptedSecret = crypto.AES.encrypt(secret.base32, process.env.SECRET_KEY).toString();
            
            // Generar el código QR
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            
            // Guardar el secreto en la base de datos (pero aún no activar OTP)
            await pool.query(
                "UPDATE usuarios SET passotp = ? WHERE id_usuario = ?",
                [encryptedSecret, userId]
            );
            
            // Enviar la información para configurar OTP
            return res.status(200).json({
                message: "Inicio de sesión exitoso, pero se requiere configurar 2FA",
                requireOtpSetup: true,
                userId,
                otpSecret: secret.base32,
                qrCode: qrCodeUrl,
                user: {
                    id: foundUser.id_usuario,
                    nombres: foundUser.nombres,
                    apellidos: foundUser.apellidos,
                    username: foundUser.decryptedUsername,
                    rol: foundUser.id_rol
                }
            });
        }

        // Si el usuario tiene OTP activado, solicitar verificación
        if (requiresOtp) {
            return res.status(200).json({ 
                message: "Credenciales correctas", 
                requiresOtp,
                userId
            });
        } 
        
        // Si el usuario no tiene OTP activado y ya tiene un secreto configurado
        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            user: {
                id: foundUser.id_usuario,
                nombres: foundUser.nombres,
                apellidos: foundUser.apellidos,
                username: foundUser.decryptedUsername,
                rol: foundUser.id_rol
            }
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

        // Verificar si el usuario tiene secret OTP
        if (!user.passotp) {
            return res.status(400).json({ message: "Este usuario no tiene configurado el secreto OTP" });
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

        // Si el OTP no estaba activado, activarlo ahora
        if (user.otp_activado !== 1) {
            await pool.query(
                "UPDATE usuarios SET otp_activado = 1 WHERE id_usuario = ?",
                [userId]
            );
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

// Ruta para confirmar y activar la configuración OTP
export const activateOtp = async (req, res) => {
    const { userId, otpCode } = req.body;

    try {
        if (!userId || !otpCode) {
            return res.status(400).json({ message: "ID de usuario y código OTP son requeridos" });
        }

        // Obtener el usuario
        const [users] = await pool.query("SELECT * FROM usuarios WHERE id_usuario = ?", [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const user = users[0];

        // Verificar que tenga un secreto OTP guardado pero no activado
        if (!user.passotp) {
            return res.status(400).json({ message: "No hay secreto OTP configurado" });
        }

        if (user.otp_activado === 1) {
            return res.status(400).json({ message: "OTP ya está activado para este usuario" });
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

        // Activar OTP para el usuario
        await pool.query(
            "UPDATE usuarios SET otp_activado = 1 WHERE id_usuario = ?",
            [userId]
        );

        return res.status(200).json({ 
            message: "Autenticación de dos factores activada correctamente",
            user: {
                id: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                username: crypto.AES.decrypt(user.nombre_usuario, process.env.SECRET_KEY).toString(crypto.enc.Utf8),
                rol: user.id_rol
            }
        });

    } catch (error) {
        console.error("❌ Error al activar OTP:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};