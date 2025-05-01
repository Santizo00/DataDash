import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import pool from "../config/ConfigMySQL.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// Obtener todos los usuarios (solo para administradores)
export const obtenerUsuarios = async (req, res) => {
  try {
    if (!process.env.SECRET_KEY) {
      throw new Error("SECRET_KEY no está definida en el entorno.");
    }

    // Obtener todos los usuarios con nombre de rol
    const [usuarios] = await pool.query(`
      SELECT u.id_usuario, u.nombres, u.apellidos, u.nombre_usuario, 
      u.otp_activado, u.id_rol, r.nombre_rol, u.fecha_registro 
      FROM usuarios u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.id_usuario ASC
    `);

    // Desencriptar los nombres de usuario antes de enviarlos
    const usuariosDesencriptados = usuarios.map(usuario => {
      try {
        const nombreUsuarioDesencriptado = crypto.AES.decrypt(
          usuario.nombre_usuario, 
          process.env.SECRET_KEY
        ).toString(crypto.enc.Utf8);

        return {
          ...usuario,
          nombre_usuario: nombreUsuarioDesencriptado,
          // No enviamos contraseñas ni secretos OTP
          contrasena: undefined,
          passotp: undefined
        };
      } catch (error) {
        console.error(`Error al desencriptar usuario ${usuario.id_usuario}:`, error);
        return {
          ...usuario,
          nombre_usuario: "Error de desencriptación",
          contrasena: undefined,
          passotp: undefined
        };
      }
    });

    res.json({
      exito: true,
      mensaje: "Usuarios obtenidos correctamente",
      datos: usuariosDesencriptados
    });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al obtener usuarios",
      error: error.message
    });
  }
};

// Crear un nuevo usuario (desde panel de admin)
export const crearUsuario = async (req, res) => {
    const { nombres, apellidos, nombre_usuario, contrasena, id_rol } = req.body;

    try {
        if (!nombres || !apellidos || !nombre_usuario || !contrasena || !id_rol) {
        return res.status(400).json({
            exito: false,
            mensaje: "Todos los campos son obligatorios"
        });
        }

        if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY no está definida en el entorno.");
        }

        // Encriptar nombre de usuario
        const nombreUsuarioEncriptado = crypto.AES.encrypt(
        nombre_usuario, 
        process.env.SECRET_KEY
        ).toString();

        // Verificar si ya existe un usuario con ese nombre
        const [existeUsuario] = await pool.query(
        "SELECT id_usuario, nombre_usuario FROM usuarios"
        );
        
        // Verificar manualmente con el nombre desencriptado
        let usuarioExistente = false;
        for (const usuario of existeUsuario) {
        try {
            const nombreDesencriptado = crypto.AES.decrypt(
            usuario.nombre_usuario, 
            process.env.SECRET_KEY
            ).toString(crypto.enc.Utf8);
            
            if (nombreDesencriptado === nombre_usuario) {
            usuarioExistente = true;
            break;
            }
        } catch (error) {
            console.error("Error al desencriptar nombre durante verificación:", error);
        }
        }
        
        if (usuarioExistente) {
        return res.status(400).json({
            exito: false,
            mensaje: "Ya existe un usuario con ese nombre"
        });
        }

        // Hashear la contraseña
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        // Insertar el usuario en la base de datos
        // Nota: Al crear un usuario desde el admin, siempre otp_activado = 0
        // El usuario deberá configurar su 2FA en su primer inicio de sesión
        const [resultado] = await pool.query(
        "INSERT INTO usuarios (nombres, apellidos, nombre_usuario, contrasena, passotp, otp_activado, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombres, apellidos, nombreUsuarioEncriptado, contrasenaHash, null, 0, id_rol]
        );

        res.status(201).json({
        exito: true,
        mensaje: "Usuario creado correctamente",
        datos: {
            id_usuario: resultado.insertId
        }
        });
    } catch (error) {
        console.error("❌ Error al crear usuario:", error);
        res.status(500).json({
        exito: false,
        mensaje: "Error al crear usuario",
        error: error.message
        });
    }
};

// Actualizar un usuario existente
export const actualizarUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombres, apellidos, contrasena, id_rol, limpiar_2fa } = req.body;
  
      if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY no está definida en el entorno.");
      }
  
      // Verificar si existe el usuario
      const [existeUsuario] = await pool.query(
        "SELECT * FROM usuarios WHERE id_usuario = ?",
        [id]
      );
  
      if (existeUsuario.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: "Usuario no encontrado"
        });
      }
  
      // Preparar campos a actualizar
      const usuario = existeUsuario[0];
      const actualizaciones = {};
      let actualizarMensaje = [];
  
      // Actualizar nombres si se proporcionó
      if (nombres) {
        actualizaciones.nombres = nombres;
        actualizarMensaje.push("nombres");
      }
  
      // Actualizar apellidos si se proporcionó
      if (apellidos) {
        actualizaciones.apellidos = apellidos;
        actualizarMensaje.push("apellidos");
      }
  
      // Actualizar contraseña si se proporcionó
      if (contrasena) {
        actualizaciones.contrasena = await bcrypt.hash(contrasena, 10);
        actualizarMensaje.push("contraseña");
      }
  
      // Actualizar rol si se proporcionó
      if (id_rol) {
        actualizaciones.id_rol = id_rol;
        actualizarMensaje.push("rol");
      }
  
      // Limpiar configuración 2FA si se solicita
      if (limpiar_2fa) {
        actualizaciones.passotp = null;
        actualizaciones.otp_activado = 0;
        actualizarMensaje.push("configuración 2FA");
      }
  
      // Si no hay nada que actualizar
      if (Object.keys(actualizaciones).length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: "No se proporcionaron datos para actualizar"
        });
      }
  
      // Construir la consulta SQL dinámica para la actualización
      const campos = Object.keys(actualizaciones);
      const valores = Object.values(actualizaciones);
      
      const sqlQuery = `UPDATE usuarios SET ${campos.map(campo => `${campo} = ?`).join(', ')} WHERE id_usuario = ?`;
      valores.push(id); // Agregar el ID al final para la cláusula WHERE
      
      await pool.query(sqlQuery, valores);
  
      res.json({
        exito: true,
        mensaje: `Usuario actualizado correctamente (${actualizarMensaje.join(", ")})`,
        datos: {
          id_usuario: parseInt(id)
        }
      });
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al actualizar usuario",
        error: error.message
      });
    }
};

// Eliminar un usuario
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si existe el usuario
    const [existeUsuario] = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = ?",
      [id]
    );

    if (existeUsuario.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: "Usuario no encontrado"
      });
    }

    // No permitir eliminar al usuario admin (ID 1 típicamente)
    if (parseInt(id) === 1) {
      return res.status(403).json({
        exito: false,
        mensaje: "No se puede eliminar al usuario administrador principal"
      });
    }

    // Eliminar el usuario
    await pool.query("DELETE FROM usuarios WHERE id_usuario = ?", [id]);

    res.json({
      exito: true,
      mensaje: "Usuario eliminado correctamente",
      datos: {
        id_usuario: parseInt(id)
      }
    });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    
    // Verificar si es un error de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        exito: false,
        mensaje: "No se puede eliminar este usuario porque tiene registros asociados",
        error: "El usuario tiene relaciones con otras tablas"
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: "Error al eliminar usuario",
      error: error.message
    });
  }
};