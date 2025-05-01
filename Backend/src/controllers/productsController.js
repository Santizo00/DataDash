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
  
// Insertar producto con tipos de datos correctos
export const insertarProducto = async (req, res) => {
  // Convertimos explícitamente a los tipos correctos
  const CodigoProducto = String(req.body.CodigoProducto || '');
  const Descripcion = String(req.body.Descripcion || '');
  const Existencia = Number(req.body.Existencia || 0);
  const Costo = Number(req.body.Costo || 0);
  const Precio = Number(req.body.Precio || 0);
  const Margen = Number(req.body.Margen || 0);
  const Id_Base = Number(req.body.Id_Base || 2);

  // Validación básica
  if (!CodigoProducto || !Descripcion) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Código de producto y descripción son obligatorios'
    });
  }

  const basesExito = [];
  const basesError = [];

  const tryInsert = async (fn, nombre) => {
    try {
      await fn();
      basesExito.push(nombre);
    } catch (err) {
      console.error(`${nombre}:`, err.message);
      basesError.push(`${nombre}: ${err.message}`);
    }
  };

  try {
    switch (Id_Base) {
      case 1: // Insertar en todas
        await Promise.all([
          tryInsert(async () => {
            const conn = await poolMySQL.getConnection();
            await conn.execute(
              `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
               VALUES (?, ?, ?, ?, ?, ?, NOW(), 1, ?)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, 2]
            );
            conn.release();
          }, "MySQL"),

          tryInsert(async () => {
            await poolSQLServer.connect();
            await poolSQLServer.request()
              .input("CodigoProducto", CodigoProducto)
              .input("Descripcion", Descripcion)
              .input("Existencia", Existencia)
              .input("Costo", Costo)
              .input("Precio", Precio)
              .input("Margen", Margen)
              .query(`INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
                     VALUES (@CodigoProducto, @Descripcion, @Existencia, @Costo, @Precio, @Margen, GETDATE(), 1, 3)`);
          }, "SQL Server"),

          tryInsert(async () => {
            const client = await poolPostgres.connect();
            await client.query(
              `INSERT INTO Products (codigoproducto, descripcion, existencia, costo, precio, margen, ultimaactualizacion, activo, basedatos) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1, 4)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen]
            );
            client.release();
          }, "PostgreSQL"),

          tryInsert(async () => {
            const conn = await poolOracle.getConnection();
            await conn.execute(
              `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
               VALUES (:1, :2, :3, :4, :5, :6, SYSDATE, 1, 5)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen],
              { autoCommit: true }
            );
            await conn.close();
          }, "Oracle"),
        ]);
        break;

      case 2: // MySQL
        await tryInsert(async () => {
          const conn = await poolMySQL.getConnection();
          await conn.execute(
            `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
             VALUES (?, ?, ?, ?, ?, ?, NOW(), 1, ?)`,
            [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, 2]
          );
          conn.release();
        }, "MySQL");
        break;

      case 3: // SQL Server
        await tryInsert(async () => {
          await poolSQLServer.connect();
          await poolSQLServer.request()
            .input("CodigoProducto", CodigoProducto)
            .input("Descripcion", Descripcion)
            .input("Existencia", Existencia)
            .input("Costo", Costo)
            .input("Precio", Precio)
            .input("Margen", Margen)
            .query(`INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
                   VALUES (@CodigoProducto, @Descripcion, @Existencia, @Costo, @Precio, @Margen, GETDATE(), 1, 3)`);
        }, "SQL Server");
        break;

      case 4: // PostgreSQL
        await tryInsert(async () => {
          const client = await poolPostgres.connect();
          await client.query(
            `INSERT INTO Products (codigoproducto, descripcion, existencia, costo, precio, margen, ultimaactualizacion, activo, basedatos) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1, 4)`,
            [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen]
          );
          client.release();
        }, "PostgreSQL");
        break;

      case 5: // Oracle
        await tryInsert(async () => {
          const conn = await poolOracle.getConnection();
          await conn.execute(
            `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos) 
             VALUES (:1, :2, :3, :4, :5, :6, SYSDATE, 1, 5)`,
            [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen],
            { autoCommit: true }
          );
          await conn.close();
        }, "Oracle");
        break;

      default:
        return res.status(400).json({ exito: false, mensaje: 'Id_Base inválido' });
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'Producto insertado correctamente.',
      basesExito,
      basesError
    });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al insertar producto',
      error: error.message
    });
  }
};
  
// Actualizar producto con manejo correcto de los 3 casos
export const actualizarProducto = async (req, res) => {
  // Convertimos explícitamente a los tipos correctos
  const Id_Producto = Number(req.body.Id_Producto || 0);
  const CodigoProducto = String(req.body.CodigoProducto || '');
  const Descripcion = String(req.body.Descripcion || '');
  const Existencia = Number(req.body.Existencia || 0);
  const Costo = Number(req.body.Costo || 0);
  const Precio = Number(req.body.Precio || 0);
  const Margen = Number(req.body.Margen || 0);
  const nuevaBase = Number(req.body.Id_Base || 0);

  const productoOriginal = req.body.productoOriginal;

  // Validación básica
  if (!CodigoProducto || !Descripcion) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Código de producto y descripción son obligatorios'
    });
  }

  const resultados = {
    exitosos: [],
    errores: []
  };

  const queryUpdate = `
    UPDATE Products 
    SET Descripcion = ?, Existencia = ?, Costo = ?, Precio = ?, Margen = ?
    WHERE CodigoProducto = ?
  `;

  const queryExiste = `
    SELECT * FROM Products WHERE CodigoProducto = ?
  `;

  const queryDelete = `
    DELETE FROM Products WHERE Id_Producto = ?
  `;

  const tryQuery = async (label, fn) => {
    try {
      await fn();
      resultados.exitosos.push(label);
    } catch (err) {
      resultados.errores.push(`${label}: ${err.message}`);
      console.error(`${label}:`, err.message);
    }
  };

  const updateEnBase = async (baseId, label) => {
    switch (baseId) {
      case 2: // MySQL
        await tryQuery(label, async () => {
          const conn = await poolMySQL.getConnection();
          const [existe] = await conn.execute(queryExiste, [CodigoProducto]);
          if (existe.length) {
            await conn.execute(queryUpdate, [
              Descripcion, Existencia, Costo, Precio, Margen, CodigoProducto
            ]);
          } else {
            await conn.execute(
              `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos)
              VALUES (?, ?, ?, ?, ?, ?, NOW(), 1, ?)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, baseId]
            );
          }
          conn.release();
        });
        break;
      case 3: // SQL Server
        await tryQuery(label, async () => {
          await poolSQLServer.connect();
          const exist = await poolSQLServer.request()
            .input("CodigoProducto", CodigoProducto)
            .query("SELECT * FROM Products WHERE CodigoProducto = @CodigoProducto");
          if (exist.recordset.length) {
            await poolSQLServer.request()
              .input("Descripcion", Descripcion)
              .input("Existencia", Existencia)
              .input("Costo", Costo)
              .input("Precio", Precio)
              .input("Margen", Margen)
              .input("CodigoProducto", CodigoProducto)
              .query(`
                UPDATE Products SET 
                Descripcion = @Descripcion, 
                Existencia = @Existencia, 
                Costo = @Costo, 
                Precio = @Precio, 
                Margen = @Margen 
                WHERE CodigoProducto = @CodigoProducto`);
          } else {
            await poolSQLServer.request()
              .input("CodigoProducto", CodigoProducto)
              .input("Descripcion", Descripcion)
              .input("Existencia", Existencia)
              .input("Costo", Costo)
              .input("Precio", Precio)
              .input("Margen", Margen)
              .input("BaseDatos", baseId)
              .query(`
                INSERT INTO Products 
                (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos)
                VALUES (@CodigoProducto, @Descripcion, @Existencia, @Costo, @Precio, @Margen, GETDATE(), 1, @BaseDatos)`);
          }
        });
        break;
      case 4: // PostgreSQL
        await tryQuery(label, async () => {
          const client = await poolPostgres.connect();
          const exist = await client.query("SELECT * FROM Products WHERE codigoproducto = $1", [CodigoProducto]);
          if (exist.rows.length) {
            await client.query(
              `UPDATE Products SET descripcion = $1, existencia = $2, costo = $3, precio = $4, margen = $5 WHERE codigoproducto = $6`,
              [Descripcion, Existencia, Costo, Precio, Margen, CodigoProducto]
            );
          } else {
            await client.query(
              `INSERT INTO Products (codigoproducto, descripcion, existencia, costo, precio, margen, ultimaactualizacion, activo, basedatos)
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1, $7)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, baseId]
            );
          }
          client.release();
        });
        break;
      case 5: // Oracle
        await tryQuery(label, async () => {
          const conn = await poolOracle.getConnection();
          const result = await conn.execute(
            `SELECT * FROM Products WHERE CodigoProducto = :1`, [CodigoProducto],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (result.rows.length) {
            await conn.execute(
              `UPDATE Products SET Descripcion = :1, Existencia = :2, Costo = :3, Precio = :4, Margen = :5 WHERE CodigoProducto = :6`,
              [Descripcion, Existencia, Costo, Precio, Margen, CodigoProducto],
              { autoCommit: true }
            );
          } else {
            await conn.execute(
              `INSERT INTO Products (CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, UltimaActualizacion, Activo, BaseDatos)
               VALUES (:1, :2, :3, :4, :5, :6, SYSDATE, 1, :7)`,
              [CodigoProducto, Descripcion, Existencia, Costo, Precio, Margen, baseId],
              { autoCommit: true }
            );
          }
          await conn.close();
        });
        break;
    }
  };

  // Lógica central por caso
  const bases = nuevaBase === 1 ? [2, 3, 4, 5] : [nuevaBase];
  for (const baseId of bases) {
    const nombre = baseId === 2 ? 'MySQL'
                  : baseId === 3 ? 'SQL Server'
                  : baseId === 4 ? 'PostgreSQL'
                  : 'Oracle';
    await updateEnBase(baseId, nombre);
  }

  // CASO 2: Eliminar de base original solo si se cambia a una base específica (no a "Todas las Bases")
  if (productoOriginal && productoOriginal.Id_Base !== nuevaBase && productoOriginal.Id_Base !== 1 && nuevaBase !== 1) {
    switch (productoOriginal.Id_Base) {
      case 2:
        const conn = await poolMySQL.getConnection();
        await conn.execute(queryDelete, [Id_Producto]);
        conn.release();
        break;
      case 3:
        await poolSQLServer.connect();
        await poolSQLServer.request()
          .input("Id_Producto", Id_Producto)
          .query("DELETE FROM Products WHERE Id_Producto = @Id_Producto");
        break;
      case 4:
        const client = await poolPostgres.connect();
        await client.query("DELETE FROM Products WHERE id_producto = $1", [Id_Producto]);
        client.release();
        break;
      case 5:
        const ora = await poolOracle.getConnection();
        await ora.execute("DELETE FROM Products WHERE Id_Producto = :1", [Id_Producto], { autoCommit: true });
        await ora.close();
        break;
    }
  }

  return res.status(200).json({
    exito: true,
    mensaje: 'Producto actualizado',
    basesExito: resultados.exitosos,
    basesError: resultados.errores
  });
};