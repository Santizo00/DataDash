import poolMySQL from '../config/ConfigMySQL.js';
// Obtener todos los roles
export const obtenerRoles = async (req, res) => {
  try {
    const connection = await poolMySQL.getConnection();
    const query = 'SELECT id_rol, nombre_rol, descripcion FROM roles ORDER BY id_rol ASC';
    const [roles] = await connection.query(query);
    
    connection.release();
    
    res.json({
      exito: true,
      mensaje: 'Roles obtenidos correctamente',
      datos: roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener roles',
      error: error.message
    });
  }
};


// Crear un nuevo rol
export const crearRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion } = req.body;
    
    if (!nombre_rol) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre del rol es obligatorio'
      });
    }
    
    const connection = await poolMySQL.getConnection();
    
    // Verificar si ya existe un rol con el mismo nombre
    const [existente] = await connection.query(
      'SELECT id_rol FROM roles WHERE nombre_rol = ?',
      [nombre_rol]
    );
    
    if (existente.length > 0) {
      connection.release();
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un rol con este nombre'
      });
    }
    
    // Insertar el nuevo rol
    const query = 'INSERT INTO roles (nombre_rol, descripcion) VALUES (?, ?)';
    const [resultado] = await connection.query(query, [nombre_rol, descripcion || '']);
    
    connection.release();
    
    res.status(201).json({
      exito: true,
      mensaje: 'Rol creado correctamente',
      datos: {
        id_rol: resultado.insertId,
        nombre_rol,
        descripcion
      }
    });
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear rol',
      error: error.message
    });
  }
};

// Actualizar un rol existente
export const actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_rol, descripcion } = req.body;
    
    if (!nombre_rol) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre del rol es obligatorio'
      });
    }
    
    const connection = await poolMySQL.getConnection();
    
    // Verificar si existe el rol
    const [existeRol] = await connection.query(
      'SELECT id_rol FROM roles WHERE id_rol = ?',
      [id]
    );
    
    if (existeRol.length === 0) {
      connection.release();
      return res.status(404).json({
        exito: false,
        mensaje: 'Rol no encontrado'
      });
    }
    
    // Verificar si ya existe otro rol con el mismo nombre
    const [existeNombre] = await connection.query(
      'SELECT id_rol FROM roles WHERE nombre_rol = ? AND id_rol != ?',
      [nombre_rol, id]
    );
    
    if (existeNombre.length > 0) {
      connection.release();
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe otro rol con este nombre'
      });
    }
    
    // Actualizar el rol
    const query = 'UPDATE roles SET nombre_rol = ?, descripcion = ? WHERE id_rol = ?';
    await connection.query(query, [nombre_rol, descripcion || '', id]);
    
    connection.release();
    
    res.json({
      exito: true,
      mensaje: 'Rol actualizado correctamente',
      datos: {
        id_rol: parseInt(id),
        nombre_rol,
        descripcion
      }
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar rol',
      error: error.message
    });
  }
};

// Eliminar un rol
export const eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await poolMySQL.getConnection();
    
    // Verificar si existe el rol
    const [existeRol] = await connection.query(
      'SELECT id_rol FROM roles WHERE id_rol = ?',
      [id]
    );
    
    if (existeRol.length === 0) {
      connection.release();
      return res.status(404).json({
        exito: false,
        mensaje: 'Rol no encontrado'
      });
    }
    
    // Eliminar el rol
    const query = 'DELETE FROM roles WHERE id_rol = ?';
    await connection.query(query, [id]);
    
    connection.release();
    
    res.json({
      exito: true,
      mensaje: 'Rol eliminado correctamente',
      datos: {
        id_rol: parseInt(id)
      }
    });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    
    // Verificar si es un error de restricción de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede eliminar este rol porque está en uso',
        error: 'El rol está asignado a uno o más usuarios'
      });
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar rol',
      error: error.message
    });
  }
};
