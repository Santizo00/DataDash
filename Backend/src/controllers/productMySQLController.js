import poolMySQL from '../config/ConfigMySQL.js';

// Obtener todos los productos
export const obtenerProductosMySQL = async (req, res) => {
    const connection = await poolMySQL.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                p.Id_Producto, p.CodigoProducto, p.Descripcion, 
                p.Existencia, p.Costo, p.Precio, p.Margen, 
                DATE_FORMAT(p.UltimaActualizacion, '%Y-%m-%d %H:%i:%s') as UltimaActualizacion,
                p.Activo, b.BaseDatos
            FROM Products p 
            LEFT JOIN basedatos b on p.BaseDatos = b.Id_Base
            WHERE p.Activo = 1`
        );
        
        res.status(200).json({
            exito: true,
            mensaje: 'Productos obtenidos correctamente de MySQL',
            datos: rows
        });
    } catch (error) {
        console.error('Error al obtener productos de MySQL:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener productos de MySQL',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Crear un nuevo producto
export const crearProductoMySQL = async (req, res) => {
    const connection = await poolMySQL.getConnection();
    try {
        const { CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen } = req.body;
        
        // Fecha actual para UltimaActualizacion
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const [result] = await connection.execute(
            `INSERT INTO Products (
                CodigoProducto, Descripcion, Existencia, 
                Costo, Precio, Margen, UltimaActualizacion, 
                Activo, BaseDatos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 2)`,
            [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, fechaActual]
        );
        
        res.status(201).json({
            exito: true,
            mensaje: 'Producto creado correctamente en MySQL',
            datos: {
                Id_Producto: result.insertId,
                CodigoProducto,
                Descripcion,
                Existencia,
                Costo,
                Precio,
                Margen,
                UltimaActualizacion: fechaActual,
                Activo: 1,
                BaseDatos: 2
            }
        });
    } catch (error) {
        console.error('Error al crear producto en MySQL:', error);
        
        // Manejar errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                exito: false,
                mensaje: 'Ya existe un producto con ese código en MySQL',
                error: error.message
            });
        }
        
        res.status(500).json({
            exito: false,
            mensaje: 'Error al crear producto en MySQL',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Actualizar un producto
export const actualizarProductoMySQL = async (req, res) => {
    const { id } = req.params;
    const connection = await poolMySQL.getConnection();
    
    try {
        const { CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen } = req.body;
        
        // Fecha actual para UltimaActualizacion
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Verificar si el producto existe
        const [existeProducto] = await connection.execute(
            'SELECT Id_Producto FROM Products WHERE Id_Producto = ? AND Activo = 1',
            [id]
        );
        
        if (existeProducto.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: `No se encontró el producto con ID ${id} en MySQL`
            });
        }
        
        // Actualizar el producto
        const [result] = await connection.execute(
            `UPDATE Products SET 
                CodigoProducto = ?, 
                Descripcion = ?, 
                Existencia = ?, 
                Costo = ?, 
                Precio = ?, 
                Margen = ?, 
                UltimaActualizacion = ?
            WHERE Id_Producto = ?`,
            [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, fechaActual, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(500).json({
                exito: false,
                mensaje: `No se pudo actualizar el producto con ID ${id} en MySQL`
            });
        }
        
        res.status(200).json({
            exito: true,
            mensaje: 'Producto actualizado correctamente en MySQL',
            datos: {
                Id_Producto: parseInt(id),
                CodigoProducto,
                Descripcion,
                Existencia,
                Costo,
                Precio,
                Margen,
                UltimaActualizacion: fechaActual,
                Activo: 1,
                BaseDatos: 2
            }
        });
    } catch (error) {
        console.error(`Error al actualizar producto con ID ${id} en MySQL:`, error);
        
        // Manejar errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                exito: false,
                mensaje: 'Ya existe un producto con ese código en MySQL',
                error: error.message
            });
        }
        
        res.status(500).json({
            exito: false,
            mensaje: `Error al actualizar producto con ID ${id} en MySQL`,
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Eliminar un producto (eliminación lógica)
export const eliminarProductoMySQL = async (req, res) => {
    const { id } = req.params;
    const connection = await poolMySQL.getConnection();
    
    try {
        // Verificar si el producto existe
        const [existeProducto] = await connection.execute(
            'SELECT Id_Producto FROM Products WHERE Id_Producto = ? AND Activo = 1',
            [id]
        );
        
        if (existeProducto.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: `No se encontró el producto con ID ${id} en MySQL`
            });
        }
        
        // Fecha actual para UltimaActualizacion
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Eliminación lógica (cambiar Activo a 0)
        const [result] = await connection.execute(
            'UPDATE Products SET Activo = 0, UltimaActualizacion = ? WHERE Id_Producto = ?',
            [fechaActual, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(500).json({
                exito: false,
                mensaje: `No se pudo eliminar el producto con ID ${id} en MySQL`
            });
        }
        
        res.status(200).json({
            exito: true,
            mensaje: `Producto con ID ${id} eliminado correctamente de MySQL`
        });
    } catch (error) {
        console.error(`Error al eliminar producto con ID ${id} de MySQL:`, error);
        res.status(500).json({
            exito: false,
            mensaje: `Error al eliminar producto con ID ${id} de MySQL`,
            error: error.message
        });
    } finally {
        connection.release();
    }
};