import poolMySQL from '../config/ConfigMySQL.js';
import poolPostgres from '../config/ConfigPostgres.js';
import poolSQLServer from '../config/ConfigSQLS.js';
import poolOracle from '../config/ConfigOracle.js';
import oracledb from 'oracledb';

// Obtener todas las bases de datos
export const obtenerBasesDatos = async (req, res) => {
    const connection = await poolMySQL.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT Id_Base, BaseDatos FROM basedatos WHERE Activo = 1'
        );
        
        res.status(200).json({
            exito: true,
            mensaje: 'Bases de datos obtenidas correctamente',
            datos: rows
        });
    } catch (error) {
        console.error('Error al obtener bases de datos:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener bases de datos',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Obtener todos los productos de todas las bases de datos
export const obtenerProductos = async (req, res) => {
    try {
      const resultados = {
        mysql: { exito: false, datos: [], mensaje: '' },
        sqlserver: { exito: false, datos: [], mensaje: '' },
        postgres: { exito: false, datos: [], mensaje: '' },
        oracle: { exito: false, datos: [], mensaje: '' }
      };
  
      // Obtener productos desde MySQL
      try {
        const conn = await poolMySQL.getConnection();
        const [rows] = await conn.execute(
          `SELECT Id_Producto, CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen,
                  DATE_FORMAT(UltimaActualizacion, '%Y-%m-%d %H:%i:%s') AS UltimaActualizacion,
                  Activo, BaseDatos AS Id_Base
           FROM Products WHERE Activo = 1`
        );
        conn.release();
        resultados.mysql = {
          exito: true,
          datos: rows,
          mensaje: 'Productos obtenidos correctamente de MySQL'
        };
      } catch (error) {
        console.error('MySQL:', error);
        resultados.mysql.mensaje = `Error MySQL: ${error.message}`;
      }
  
      // Obtener productos desde SQL Server
      try {
        await poolSQLServer.connect();
        const result = await poolSQLServer.request().query(
          `SELECT Id_Producto, CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen,
                  FORMAT(UltimaActualizacion, 'yyyy-MM-dd HH:mm:ss') AS UltimaActualizacion,
                  Activo, BaseDatos AS Id_Base
           FROM Products WHERE Activo = 1`
        );
        resultados.sqlserver = {
          exito: true,
          datos: result.recordset,
          mensaje: 'Productos obtenidos correctamente de SQL Server'
        };
      } catch (error) {
        console.error('SQL Server:', error);
        resultados.sqlserver.mensaje = `Error SQL Server: ${error.message}`;
      }
  
      // Obtener productos desde PostgreSQL
      try {
        const client = await poolPostgres.connect();
        const result = await client.query(
          `SELECT id_producto AS "Id_Producto", codigoproducto AS "CodigoProducto",
                  descripcion AS "Descripcion", existencia AS "Existencia", costo AS "Costo",
                  precio AS "Precio", margen AS "Margen", activo AS "Activo", basedatos AS "Id_Base",
                  to_char(ultimaactualizacion, 'YYYY-MM-DD HH24:MI:SS') AS "UltimaActualizacion"
           FROM products WHERE activo = 1`
        );
        client.release();
        resultados.postgres = {
          exito: true,
          datos: result.rows,
          mensaje: 'Productos obtenidos correctamente de PostgreSQL'
        };
      } catch (error) {
        console.error('PostgreSQL:', error);
        resultados.postgres.mensaje = `Error PostgreSQL: ${error.message}`;
      }
  
      // Obtener productos desde Oracle
      try {
        const conn = await poolOracle.getConnection();
        const result = await conn.execute(
            `SELECT 
                Id_Producto AS "Id_Producto",
                CodigoProducto AS "CodigoProducto",
                Descripcion AS "Descripcion",
                TO_CHAR(Existencia, 'FM9999999990.00') AS "Existencia",
                TO_CHAR(Costo, 'FM9999999990.00') AS "Costo",
                TO_CHAR(Precio, 'FM9999999990.00') AS "Precio",
                TO_CHAR(Margen, 'FM9999999990.00') AS "Margen",
                TO_CHAR(UltimaActualizacion, 'YYYY-MM-DD HH24:MI:SS') AS "UltimaActualizacion",
                Activo AS "Activo",
                BaseDatos AS "Id_Base"
             FROM Products
             WHERE Activo = 1`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
          
        await conn.close();
        resultados.oracle = {
          exito: true,
          datos: result.rows || [],
          mensaje: 'Productos obtenidos correctamente de Oracle'
        };
      } catch (error) {
        console.error('Oracle:', error);
        resultados.oracle.mensaje = `Error Oracle: ${error.message}`;
      }
  
      // Obtener tabla basedatos centralizada desde MySQL
      const conn = await poolMySQL.getConnection();
      const [bases] = await conn.execute(`SELECT Id_Base, BaseDatos FROM basedatos`);
      conn.release();
  
      const mapaBases = {};
      for (const base of bases) {
        mapaBases[base.Id_Base] = base.BaseDatos;
      }
  
      const mapear = (arr) => arr.map(p => ({ ...p, BaseDatos: mapaBases[p.Id_Base] || 'Desconocido' }));
      resultados.mysql.datos = mapear(resultados.mysql.datos);
      resultados.sqlserver.datos = mapear(resultados.sqlserver.datos);
      resultados.postgres.datos = mapear(resultados.postgres.datos);
      resultados.oracle.datos = mapear(resultados.oracle.datos);
  
      const todosLosProductos = [
        ...resultados.mysql.datos,
        ...resultados.sqlserver.datos,
        ...resultados.postgres.datos,
        ...resultados.oracle.datos
      ];
  
      const resumen = {
        totalProductos: todosLosProductos.length,
        basesDatos: {
          mysql: {
            exito: resultados.mysql.exito,
            cantidad: resultados.mysql.datos.length,
            mensaje: resultados.mysql.mensaje
          },
          sqlserver: {
            exito: resultados.sqlserver.exito,
            cantidad: resultados.sqlserver.datos.length,
            mensaje: resultados.sqlserver.mensaje
          },
          postgres: {
            exito: resultados.postgres.exito,
            cantidad: resultados.postgres.datos.length,
            mensaje: resultados.postgres.mensaje
          },
          oracle: {
            exito: resultados.oracle.exito,
            cantidad: resultados.oracle.datos.length,
            mensaje: resultados.oracle.mensaje
          }
        }
      };
  
      res.status(200).json({
        exito: true,
        mensaje: 'Consulta de productos completada',
        datos: todosLosProductos,
        resumen
      });
    } catch (error) {
      console.error('Error general:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener productos',
        error: error.message
      });
    }
  };
  