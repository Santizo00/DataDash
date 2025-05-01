import poolMySQL from '../config/ConfigMySQL.js';
import poolPostgres from '../config/ConfigPostgres.js';
import poolSQLServer from '../config/ConfigSQLS.js';
import poolOracle from '../config/ConfigOracle.js';
import oracledb from 'oracledb';

// Obtener KPIs de todas las bases de datos o una específica
export const obtenerKPIs = async (req, res) => {
  const { baseId } = req.query;
  
  try {
    const resultados = {
      mysql: { exito: false, datos: null, mensaje: '' },
      sqlserver: { exito: false, datos: null, mensaje: '' },
      postgres: { exito: false, datos: null, mensaje: '' },
      oracle: { exito: false, datos: null, mensaje: '' }
    };

    const basesConsultar = baseId ? [parseInt(baseId)] : [2, 3, 4, 5];
    
    // Consulta a MySQL
    if (basesConsultar.includes(2)) {
      try {
        const conn = await poolMySQL.getConnection();
        const [rows] = await conn.execute(`
          SELECT 
            COUNT(*) AS TotalProductos,
            SUM(Existencia) AS TotalExistencia,
            AVG(Costo) AS PromedioCosto,
            AVG(Precio) AS PromedioPrecio,
            AVG(Margen) AS PromedioMargen,
            SUM(Existencia * Costo) AS ValorInventario,
            SUM(Existencia * Precio) AS ValorVenta,
            SUM(Existencia * (Precio - Costo)) AS UtilidadPotencial,
            SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) AS ProductosActivos,
            SUM(CASE WHEN Activo = 2 THEN 1 ELSE 0 END) AS ProductosInactivos
          FROM Products
        `);
        conn.release();
        
        resultados.mysql = {
          exito: true,
          datos: rows[0],
          mensaje: 'KPIs calculados correctamente para MySQL'
        };
      } catch (error) {
        console.error('MySQL:', error);
        resultados.mysql.mensaje = `Error MySQL: ${error.message}`;
      }
    }
    
    // Consulta a SQL Server
    if (basesConsultar.includes(3)) {
      try {
        await poolSQLServer.connect();
        const result = await poolSQLServer.request().query(`
          SELECT 
            COUNT(*) AS TotalProductos,
            SUM(Existencia) AS TotalExistencia,
            AVG(Costo) AS PromedioCosto,
            AVG(Precio) AS PromedioPrecio,
            AVG(Margen) AS PromedioMargen,
            SUM(Existencia * Costo) AS ValorInventario,
            SUM(Existencia * Precio) AS ValorVenta,
            SUM(Existencia * (Precio - Costo)) AS UtilidadPotencial,
            SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) AS ProductosActivos,
            SUM(CASE WHEN Activo = 2 THEN 1 ELSE 0 END) AS ProductosInactivos
          FROM Products
        `);
        
        resultados.sqlserver = {
          exito: true,
          datos: result.recordset[0],
          mensaje: 'KPIs calculados correctamente para SQL Server'
        };
      } catch (error) {
        console.error('SQL Server:', error);
        resultados.sqlserver.mensaje = `Error SQL Server: ${error.message}`;
      }
    }
    
    // Consulta a PostgreSQL
    if (basesConsultar.includes(4)) {
      try {
        const client = await poolPostgres.connect();
        const result = await client.query(`
          SELECT 
            COUNT(*) AS "TotalProductos",
            SUM(existencia) AS "TotalExistencia",
            AVG(costo) AS "PromedioCosto",
            AVG(precio) AS "PromedioPrecio",
            AVG(margen) AS "PromedioMargen",
            SUM(existencia * costo) AS "ValorInventario",
            SUM(existencia * precio) AS "ValorVenta",
            SUM(existencia * (precio - costo)) AS "UtilidadPotencial",
            SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS "ProductosActivos",
            SUM(CASE WHEN activo = 2 THEN 1 ELSE 0 END) AS "ProductosInactivos"
          FROM products
        `);
        client.release();
        
        resultados.postgres = {
          exito: true,
          datos: result.rows[0],
          mensaje: 'KPIs calculados correctamente para PostgreSQL'
        };
      } catch (error) {
        console.error('PostgreSQL:', error);
        resultados.postgres.mensaje = `Error PostgreSQL: ${error.message}`;
      }
    }
    
    // Consulta a Oracle
    if (basesConsultar.includes(5)) {
      try {
        const conn = await poolOracle.getConnection();
        const result = await conn.execute(
          `SELECT 
            COUNT(*) AS "TotalProductos",
            SUM(Existencia) AS "TotalExistencia",
            AVG(Costo) AS "PromedioCosto",
            AVG(Precio) AS "PromedioPrecio",
            AVG(Margen) AS "PromedioMargen",
            SUM(Existencia * Costo) AS "ValorInventario",
            SUM(Existencia * Precio) AS "ValorVenta",
            SUM(Existencia * (Precio - Costo)) AS "UtilidadPotencial",
            SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) AS "ProductosActivos",
            SUM(CASE WHEN Activo = 2 THEN 1 ELSE 0 END) AS "ProductosInactivos"
          FROM Products`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        await conn.close();
        
        resultados.oracle = {
          exito: true,
          datos: result.rows[0],
          mensaje: 'KPIs calculados correctamente para Oracle'
        };
      } catch (error) {
        console.error('Oracle:', error);
        resultados.oracle.mensaje = `Error Oracle: ${error.message}`;
      }
    }
    
    // Obtener tabla basedatos centralizada desde MySQL
    const conn = await poolMySQL.getConnection();
    const [bases] = await conn.execute(`SELECT Id_Base, BaseDatos FROM basedatos WHERE Activo = 1`);
    conn.release();
    
    const mapaBases = {};
    for (const base of bases) {
      mapaBases[base.Id_Base] = base.BaseDatos;
    }
    
    // Consolidar resultados para visión general
    const consolidado = {
      TotalProductos: 0,
      TotalExistencia: 0,
      PromedioCosto: 0,
      PromedioPrecio: 0,
      PromedioMargen: 0,
      ValorInventario: 0,
      ValorVenta: 0,
      UtilidadPotencial: 0,
      ProductosActivos: 0,
      ProductosInactivos: 0,
      DistribucionProductos: []
    };
    
    let basesDatosValidas = 0;
    let totalPromedioCosto = 0;
    let totalPromedioPrecio = 0;
    let totalPromedioMargen = 0;
    
    // Procesar cada base de datos y consolidar
    for (const key in resultados) {
      const resultado = resultados[key];
      if (resultado.exito && resultado.datos) {
        const datos = resultado.datos;
        
        // Añadir al consolidado
        consolidado.TotalProductos += parseInt(datos.TotalProductos || 0);
        consolidado.TotalExistencia += parseFloat(datos.TotalExistencia || 0);
        consolidado.ValorInventario += parseFloat(datos.ValorInventario || 0);
        consolidado.ValorVenta += parseFloat(datos.ValorVenta || 0);
        consolidado.UtilidadPotencial += parseFloat(datos.UtilidadPotencial || 0);
        consolidado.ProductosActivos += parseInt(datos.ProductosActivos || 0);
        consolidado.ProductosInactivos += parseInt(datos.ProductosInactivos || 0);
        
        // Recopilación para promedios generales
        if (parseFloat(datos.PromedioCosto || 0) > 0) {
          totalPromedioCosto += parseFloat(datos.PromedioCosto || 0);
          basesDatosValidas++;
        }
        
        if (parseFloat(datos.PromedioPrecio || 0) > 0) {
          totalPromedioPrecio += parseFloat(datos.PromedioPrecio || 0);
        }
        
        if (parseFloat(datos.PromedioMargen || 0) > 0) {
          totalPromedioMargen += parseFloat(datos.PromedioMargen || 0);
        }
        
        // Añadir a la distribución de productos por base
        const baseId = key === 'mysql' ? 2 : 
                       key === 'sqlserver' ? 3 : 
                       key === 'postgres' ? 4 : 5;
                       
        consolidado.DistribucionProductos.push({
          id: baseId,
          nombre: mapaBases[baseId] || key,
          cantidad: parseInt(datos.TotalProductos || 0),
          porcentaje: 0 // Calculado después
        });
      }
    }
    
    // Calcular promedios generales
    if (basesDatosValidas > 0) {
      consolidado.PromedioCosto = totalPromedioCosto / basesDatosValidas;
      consolidado.PromedioPrecio = totalPromedioPrecio / basesDatosValidas;
      consolidado.PromedioMargen = totalPromedioMargen / basesDatosValidas;
    }
    
    // Calcular porcentajes para la distribución
    if (consolidado.TotalProductos > 0) {
      for (let i = 0; i < consolidado.DistribucionProductos.length; i++) {
        consolidado.DistribucionProductos[i].porcentaje = 
          (consolidado.DistribucionProductos[i].cantidad / consolidado.TotalProductos) * 100;
      }
    }
    
    res.status(200).json({
      exito: true,
      mensaje: 'KPIs calculados correctamente',
      datos: baseId ? resultados : consolidado,
      resultadosPorBase: resultados
    });
    
  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener KPIs',
      error: error.message
    });
  }
};