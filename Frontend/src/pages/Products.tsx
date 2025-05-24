import React, { useState, useEffect } from "react";
import { Search, CirclePlus, CircleX, Edit } from "lucide-react";
import { showCustomSuccessAlert, showErrorAlert, showConfirmWithCheckboxAlert } from "../components/AlertService";
import { hideLoading, showLoading } from "../components/loadingService";
import { Table } from "../components/Table";
import { ModalProduct } from "../components/ModalProduct";
import type { ColumnDef } from "@tanstack/react-table";

const API_URL = import.meta.env.VITE_URL_BACKEND;

export interface Producto {
  Id_Producto: number;
  CodigoProducto: string;
  Descripcion: string;
  Existencia: number;
  Costo: number;
  Precio: number;
  Margen: number;
  UltimaActualizacion: string;
  Activo: number;
  BaseDatos: string;
  Id_Base: number;
  EstadoDescripcion?: string;
}

export interface FormDataType {
  CodigoProducto: string;
  Descripcion: string;
  Existencia: number;
  Costo: number;
  Precio: number;
  Margen?: number;
  Id_Base: number;
}

export interface BaseDatos {
  Id_Base: number;
  BaseDatos: string;
}

interface RespuestaAPI {
  exito: boolean;
  mensaje: string;
  datos: Producto[] | Producto;
  error?: string;
  resumen?: {
    totalProductos: number;
    basesDatos: {
      mysql: { exito: boolean; cantidad: number; mensaje: string };
      sqlserver: { exito: boolean; cantidad: number; mensaje: string };
      postgres: { exito: boolean; cantidad: number; mensaje: string };
      oracle: { exito: boolean; cantidad: number; mensaje: string };
    };
  };
}

const Products: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosCompletos, setProductosCompletos] = useState<Producto[]>([]);
  const [, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState("");
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [basesDatos, setBasesDatos] = useState<BaseDatos[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    CodigoProducto: "",
    Descripcion: "",
    Existencia: 0,
    Costo: 0,
    Precio: 0,
    Id_Base: 0
  });
  const [filtroBaseDatos, setFiltroBaseDatos] = useState<number | "">("");
  const [baseOriginal, setBaseOriginal] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    cargarProductos();
    cargarBasesDatos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, filtroBaseDatos, filtroEstado]);

  const cargarBasesDatos = async () => {
    try {
      const response = await fetch(`${API_URL}/products/basesdatos`);
      const data = await response.json();
      if (data.exito) setBasesDatos(data.datos);
      else showErrorAlert("Error", data.mensaje);
    } catch (error) {
      console.error("Error cargando bases de datos:", error);
      showErrorAlert("Error de conexión", "No se pudo cargar la lista de bases de datos.");
    }
  };

  const cargarProductos = async () => {
    showLoading("Cargando productos de múltiples bases de datos...");
    try {
      const response = await fetch(`${API_URL}/products/`);
      const data: RespuestaAPI = await response.json();
      hideLoading();
      if (data.exito) {
        const productosArray = Array.isArray(data.datos) ? data.datos : [];
        setProductos(productosArray);
        setProductosCompletos(productosArray);
        if (data.resumen) mostrarResumenCarga(data.resumen);
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error cargando productos:", error);
      showErrorAlert("Error de conexión", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const mostrarResumenCarga = (resumen: RespuestaAPI['resumen']) => {
    if (!resumen) return;
    const basesConProductos: string[] = [];
    const basesSinProductos: string[] = [];
    const errores: string[] = [];
    const nombresBases: Record<string, string> = {
      mysql: "MySQL",
      sqlserver: "SQL Server",
      postgres: "PostgreSQL",
      oracle: "Oracle"
    };
    for (const key in resumen.basesDatos) {
      const base = resumen.basesDatos[key as keyof typeof resumen.basesDatos];
      const nombre = nombresBases[key];
      if (base.exito) {
        base.cantidad > 0 ? basesConProductos.push(`${nombre} (${base.cantidad} productos)`) : basesSinProductos.push(nombre);
      } else {
        errores.push(`<strong>${nombre}</strong>: ${base.mensaje}`);
      }
    }
    let mensajeHTML = "";
    if (basesConProductos.length) mensajeHTML += `<strong>Se cargaron productos correctamente desde:</strong><br>- ${basesConProductos.join("<br>- ")}`;
    if (basesSinProductos.length) mensajeHTML += `<br><br><strong>Las siguientes bases de datos no contienen productos:</strong><br>- ${basesSinProductos.join(", ")}`;
    if (mensajeHTML) showCustomSuccessAlert("Resumen de carga", mensajeHTML);
    if (errores.length) showErrorAlert("Errores en bases de datos", errores.map(e => `❌ ${e}`).join("<br>"));
  };

  const filtrarProductos = () => {
    const termino = busqueda.toLowerCase().trim();
    const filtrados = productosCompletos.filter((producto) => {
      // Filtro por texto (código o descripción)
      const coincideTexto = producto.CodigoProducto.toLowerCase().includes(termino) || 
                            producto.Descripcion.toLowerCase().includes(termino);
      
      // Filtro por base de datos
      const coincideBase = filtroBaseDatos === 1 || 
                           filtroBaseDatos === "" || 
                           producto.Id_Base === filtroBaseDatos;
      
      // Filtro por estado (activo/inactivo)
      const coincideEstado = filtroEstado === "todos" || 
                            (filtroEstado === "activos" && producto.Activo === 1) || 
                            (filtroEstado === "inactivos" && producto.Activo === 2);
      
      return coincideTexto && coincideBase && coincideEstado;
    });
    
    setProductos(filtrados);
  };

  const calcularPorcentajeMargen = (costo: number, precio: number): number => {
    if (costo === 0) return 0;
    return ((precio - costo) / costo) * 100;
  };

  // CORREGIDO: Manejo visual adecuado de los 3 casos en la actualización
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(productoEditando ? "Actualizando producto..." : "Guardando producto...");

    const isEditando = productoEditando !== null;

    // Validar y convertir explícitamente a los tipos correctos
    const validatedFormData = {
      ...formData,
      CodigoProducto: String(formData.CodigoProducto || ''),
      Descripcion: String(formData.Descripcion || ''),
      Existencia: Number(formData.Existencia) || 0,
      Costo: Number(formData.Costo) || 0,
      Precio: Number(formData.Precio) || 0,
      Margen: Number(formData.Margen) || 0,
      Id_Base: Number(formData.Id_Base) || 1
    };

    // Validación básica
    if (!validatedFormData.CodigoProducto || !validatedFormData.Descripcion) {
      hideLoading();
      showErrorAlert("Error de validación", "El código y la descripción del producto son obligatorios");
      return;
    }

    const endpoint = isEditando ? `${API_URL}/products/update` : `${API_URL}/products/insert`;
    const payload = isEditando
      ? { ...validatedFormData, Id_Producto: productoEditando.Id_Producto, productoOriginal: { Id_Base: baseOriginal } }
      : validatedFormData;

    try {
      const response = await fetch(endpoint, {
        method: isEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      hideLoading();

      if (data.exito) {
        setModalAbierto(false);

        const basesInsertadas = (data.basesExito || []).map((b: string) => `✔️ ${b}`).join("<br>");
        const basesFallidas = (data.basesError || []).map((e: string) => `❌ ${e}`).join("<br>");

        let mensaje = isEditando
          ? `Producto actualizado correctamente en:<br>${basesInsertadas}`
          : `Producto insertado correctamente en:<br>${basesInsertadas}`;

        if (basesFallidas) {
          mensaje += `<br><br><strong>Errores:</strong><br>${basesFallidas}`;
        }

        showCustomSuccessAlert("Éxito", mensaje);

        if (isEditando) {
          // Preparamos la actualización visual basada en los casos
          
          // CASO 1: Actualización simple sin cambio de base
          if (validatedFormData.Id_Base === baseOriginal && baseOriginal !== 1) {
            // Actualizamos el producto en la misma base
            const productosFinal = productos.map(p => {
              if (p.CodigoProducto === productoEditando.CodigoProducto && p.Id_Base === baseOriginal) {
                return {
                  ...p,
                  ...validatedFormData,
                  Margen: calcularPorcentajeMargen(validatedFormData.Costo, validatedFormData.Precio),
                  UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " ")
                };
              }
              return p;
            });
            
            setProductos(productosFinal);
            setProductosCompletos(productosFinal);
          }
          
          // CASO 2: Cambio a una base específica (no a "Todas las Bases")
          else if (validatedFormData.Id_Base !== 1 && baseOriginal !== 1) {
            // Filtramos el producto de la base original
            let productosFinal = productos.filter(p => 
              !(p.CodigoProducto === productoEditando.CodigoProducto && p.Id_Base === baseOriginal)
            );
            
            // Añadimos el producto en la nueva base
            const nuevaBase = basesDatos.find(b => b.Id_Base === validatedFormData.Id_Base);
            if (nuevaBase) {
              const nuevoProducto = {
                ...validatedFormData,
                Id_Producto: Math.floor(Math.random() * 1000000),
                Margen: calcularPorcentajeMargen(validatedFormData.Costo, validatedFormData.Precio),
                UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
                Activo: 1,
                BaseDatos: nuevaBase.BaseDatos
              };
              
              productosFinal = [...productosFinal, nuevoProducto];
            }
            
            setProductos(productosFinal);
            setProductosCompletos(productosFinal);
          }
          
          // CASO 3: Actualización a "Todas las Bases"
          else if (validatedFormData.Id_Base === 1) {
            // Primero actualizamos los productos existentes con el mismo código en todas las bases
            let productosFinal = productos.map(p => {
              if (p.CodigoProducto === productoEditando.CodigoProducto) {
                return {
                  ...p,
                  Descripcion: validatedFormData.Descripcion,
                  Existencia: validatedFormData.Existencia,
                  Costo: validatedFormData.Costo,
                  Precio: validatedFormData.Precio,
                  Margen: calcularPorcentajeMargen(validatedFormData.Costo, validatedFormData.Precio),
                  UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " ")
                };
              }
              return p;
            });
            
            // Después verificamos las bases donde no existe el producto y lo agregamos
            const basesConProducto = new Set(
              productosFinal
                .filter(p => p.CodigoProducto === productoEditando.CodigoProducto)
                .map(p => p.Id_Base)
            );
            
            // Creamos nuevos productos para las bases donde no existen
            const nuevosProductos = [];
            for (const base of basesDatos) {
              // Ignoramos "Todas las Bases" (Id_Base = 1)
              if (base.Id_Base !== 1 && !basesConProducto.has(base.Id_Base)) {
                nuevosProductos.push({
                  ...validatedFormData,
                  Id_Producto: Math.floor(Math.random() * 1000000),
                  Margen: calcularPorcentajeMargen(validatedFormData.Costo, validatedFormData.Precio),
                  UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
                  Activo: 1,
                  Id_Base: base.Id_Base,
                  BaseDatos: base.BaseDatos
                });
              }
            }
            
            // Unimos los productos actualizados con los nuevos
            productosFinal = [...productosFinal, ...nuevosProductos];
            
            setProductos(productosFinal);
            setProductosCompletos(productosFinal);
          }
        } else {
          // 🆕 Inserción (sin cambios)
          const nuevasBases = validatedFormData.Id_Base === 1 ? (data.basesExito || []) : [
            basesDatos.find(b => b.Id_Base === validatedFormData.Id_Base)?.BaseDatos || "Desconocido"
          ];

          const nuevosProductos = nuevasBases.map((nombreBase: string) => ({
            ...validatedFormData,
            Margen: calcularPorcentajeMargen(validatedFormData.Costo, validatedFormData.Precio),
            Id_Producto: Math.floor(Math.random() * 1000000),
            UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
            Activo: 1,
            BaseDatos: nombreBase
          }));

          setProductos(prev => [...prev, ...nuevosProductos]);
          setProductosCompletos(prev => [...prev, ...nuevosProductos]);
        }
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error en envío de datos:", error);
      showErrorAlert("Error", "No se pudo guardar el producto.");
    }
  };

  const handleCambiarEstado = async (producto: Producto) => {
    const accion = producto.Activo === 1 ? "desactivar" : "activar";
    
    // Mostrar alerta con opciones
    const { isConfirmed, value } = await showConfirmWithCheckboxAlert(
      `${accion.charAt(0).toUpperCase() + accion.slice(1)} Producto`,
      `¿Está seguro que desea ${accion} el producto <strong>${producto.CodigoProducto}</strong>?`,
      [
        {
          id: 'todasLasBases',
          label: 'Aplicar cambio en todas las bases de datos donde exista este producto'
        }
      ]
    );
    
    if (!isConfirmed) return;
    
    const todasLasBases = value && value.todasLasBases;
    
    showLoading(`${accion.charAt(0).toUpperCase() + accion.slice(1)}ando producto...`);
    
    try {
      const response = await fetch(`${API_URL}/products/cambiar-estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CodigoProducto: producto.CodigoProducto,
          Activo: producto.Activo,
          Id_Base: producto.Id_Base,
          todasLasBases
        })
      });
      
      const data = await response.json();
      hideLoading();
      
      if (data.exito) {
        const basesActualizadas = (data.basesExito || []).map((b: string) => `✔️ ${b}`).join("<br>");
        const basesFallidas = (data.basesError || []).map((e: string) => `❌ ${e}`).join("<br>");
        
        let mensaje = `Producto ${accion}do correctamente en:<br>${basesActualizadas}`;
        
        if (basesFallidas) {
          mensaje += `<br><br><strong>Errores:</strong><br>${basesFallidas}`;
        }
        
        showCustomSuccessAlert("Éxito", mensaje);
        
        // Actualizar estado local de los productos
        const nuevoEstado = data.nuevoEstado;
        const nuevoEstadoDesc = nuevoEstado === 1 ? 'Activo' : 'Inactivo';
        
        // Si se actualizó en todas las bases, actualizar todos los productos con ese código
        if (todasLasBases) {
          const productosActualizados = productos.map(p => {
            if (p.CodigoProducto === producto.CodigoProducto && data.basesExito.includes(getNombreBase(p.Id_Base))) {
              return {
                ...p,
                Activo: nuevoEstado,
                EstadoDescripcion: nuevoEstadoDesc
              };
            }
            return p;
          });
          
          setProductos(productosActualizados);
          setProductosCompletos(productosActualizados);
        } 
        // Si solo se actualizó en una base, actualizar solo ese producto
        else {
          const productosActualizados = productos.map(p => {
            if (p.CodigoProducto === producto.CodigoProducto && p.Id_Base === producto.Id_Base) {
              return {
                ...p,
                Activo: nuevoEstado,
                EstadoDescripcion: nuevoEstadoDesc
              };
            }
            return p;
          });
          
          setProductos(productosActualizados);
          setProductosCompletos(productosActualizados);
        }
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error al cambiar estado:", error);
      showErrorAlert("Error", "No se pudo cambiar el estado del producto.");
    }
  };
  
  // Función auxiliar para obtener el nombre de la base a partir del Id_Base
  const getNombreBase = (idBase: number): string => {
    switch (idBase) {
      case 2: return 'MySQL';
      case 3: return 'SQL Server';
      case 4: return 'PostgreSQL';
      case 5: return 'Oracle';
      default: return 'Desconocido';
    }
  };

  const abrirEditarModal = (producto: Producto) => {
    setProductoEditando(producto);
    setFormData({ 
      CodigoProducto: producto.CodigoProducto,
      Descripcion: producto.Descripcion,
      Existencia: Number(producto.Existencia),
      Costo: Number(producto.Costo),
      Precio: Number(producto.Precio),
      Margen: Number(producto.Margen),
      Id_Base: Number(producto.Id_Base)
    });
    setBaseOriginal(producto.Id_Base);
    setModalAbierto(true);
  };

  const columns: ColumnDef<Producto>[] = [
    { header: "Código", accessorKey: "CodigoProducto", meta: { align: "left" } },
    { header: "Descripción", accessorKey: "Descripcion", meta: { align: "left" } },
    { header: "Existencia", accessorKey: "Existencia", meta: { align: "right" } },
    { header: "Costo", accessorKey: "Costo", cell: info => `Q. ${info.getValue()}`, meta: { align: "right" } },
    { header: "Precio", accessorKey: "Precio", cell: info => `Q. ${info.getValue()}`, meta: { align: "right" } },
    { header: "Margen", accessorKey: "Margen", cell: info => `${info.getValue()}%`, meta: { align: "right" } },
    {
      header: "Estado",
      accessorKey: "EstadoDescripcion",
      cell: info => {
        const val = info.getValue<string>();
        const esActivo = val === 'Activo' || info.row.original.Activo === 1;
        const color = esActivo 
          ? "bg-green-100 text-green-800" 
          : "bg-red-100 text-red-800";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
            {val}
          </span>
        );
      },
      meta: { align: "center" },
    },
    {
      header: "Base Datos",
      accessorKey: "BaseDatos",
      cell: info => {
        const val = info.getValue<string>();
        const db = val.toLowerCase();
        const color =
          db.includes("mysql")
            ? "bg-green-100 text-green-800"
            : db.includes("postgres")
            ? "bg-blue-100 text-blue-800"
            : db.includes("oracle")
            ? "bg-red-100 text-red-800"
            : db.includes("sqlserver") || db.includes("sql server")
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-100 text-gray-700";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
            {val}
          </span>
        );
      },
      meta: { align: "center" },
    },
    {
      header: "Acciones",
      accessorKey: "EstadoDescripcion",
      cell: info => {
        const producto = info.row.original;
        const esActivo = producto.Activo === 1;
        
        return (
          <div className="flex items-center space-x-2">
            <button onClick={() => abrirEditarModal(producto)} className="p-2 rounded bg-orange-400 text-white hover:bg-orange-500" title="Editar producto">
              <Edit size={18} />
            </button>

            <button 
              onClick={() => handleCambiarEstado(producto)} 
              className={`p-2 rounded  ${esActivo ? "bg-red-500" : "bg-green-500"} text-white`}
              title={esActivo ? "Desactivar" : "Activar"}
            >
              {esActivo ? <CircleX size={18} /> : <CirclePlus size={18} />}
            </button>
          </div>
        );
      },
      meta: { align: "center" },
    },
    
  ];

  return (
    <div className="container mx-auto px-4 py-8 border rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Productos (Multi-DB)</h1>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <input 
            type="text" 
            placeholder="Buscar por código o descripción..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-black placeholder-gray-500" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Selector de Base de Datos */}
          <div className="min-w-[200px]">
            <select 
              value={filtroBaseDatos} 
              onChange={(e) => setFiltroBaseDatos(e.target.value === "" ? "" : parseInt(e.target.value))} 
              className="px-3 py-2 border rounded-lg bg-white text-black w-full"
            >
              {basesDatos.map(base => (
                <option key={base.Id_Base} value={base.Id_Base}>{base.BaseDatos}</option>
              ))}
            </select>
          </div>
          
          {/* Selector de Estado (Activo/Inactivo) */}
          <div className="min-w-[150px]">
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)} 
              className="px-3 py-2 border rounded-lg bg-white text-black w-full"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setProductoEditando(null);
            setFormData({ CodigoProducto: "", Descripcion: "", Existencia: 0, Costo: 0, Precio: 0, Id_Base: 1 });
            setModalAbierto(true);
          }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <CirclePlus className="mr-2" /> Nuevo Producto
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {productos.length === 0 ? <div className="text-center py-8"><p className="text-gray-500">No se encontraron productos</p></div>
          : <div className="overflow-x-auto">
              <Table data={productos} columns={columns} className="bg-white rounded-lg shadow" emptyMessage="No se encontraron productos" pagination={false} pageSize={2} />
            </div>}
      </div>
      <ModalProduct
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        basesDatos={basesDatos}
        productoEditando={productoEditando}
        calcularPorcentajeMargen={calcularPorcentajeMargen}
        baseOriginal={baseOriginal}
      />
    </div>
  );
};

export default Products;