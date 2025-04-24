import React, { useState, useEffect } from "react";
import { Search, CirclePlus, Trash2, Edit } from "lucide-react";
import { showCustomSuccessAlert, showErrorAlert, showWarningAlert } from "../components/AlertService";
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

  useEffect(() => {
    cargarProductos();
    cargarBasesDatos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, filtroBaseDatos]);

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
      const coincideTexto = producto.CodigoProducto.toLowerCase().includes(termino) || producto.Descripcion.toLowerCase().includes(termino);
      const coincideBase = filtroBaseDatos === 1 || filtroBaseDatos === "" || producto.Id_Base === filtroBaseDatos;
      return coincideTexto && coincideBase;
    });
    setProductos(filtrados);
  };

  const calcularPorcentajeMargen = (costo: number, precio: number): number => {
    if (costo === 0) return 0;
    return ((precio - costo) / costo) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading("Guardando producto...");
  
    try {
      const response = await fetch(`${API_URL}/products/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      hideLoading();
  
      if (data.exito) {
        setModalAbierto(false);
      
        const basesInsertadas = (data.basesExito || []).map((b: string) => `✔️ ${b}`).join("<br>");
        const basesFallidas = (data.basesError || []).map((e: string) => `❌ ${e}`).join("<br>");
      
        let mensaje = `Producto insertado correctamente en:<br>${basesInsertadas}`;
        if (basesFallidas) {
          mensaje += `<br><br><strong>Errores al insertar:</strong><br>${basesFallidas}`;
        }
      
        showCustomSuccessAlert("Éxito", mensaje);
      
        const nuevasBases = formData.Id_Base === 1 ? (data.basesExito || []) : [
          basesDatos.find(b => b.Id_Base === formData.Id_Base)?.BaseDatos || "Desconocido"
        ];
        
        const nuevosProductos = nuevasBases.map((nombreBase: string) => ({
          ...formData,
          Margen: calcularPorcentajeMargen(formData.Costo, formData.Precio),
          Id_Producto: Math.floor(Math.random() * 1000000),
          UltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
          Activo: 1,
          BaseDatos: nombreBase
        }));
        
        setProductos(prev => [...prev, ...nuevosProductos]);
        setProductosCompletos(prev => [...prev, ...nuevosProductos]);
        
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error guardando producto:", error);
      showErrorAlert("Error", "No se pudo guardar el producto.");
    }
  };

  const handleEliminar = async (_id: number) => {
    showWarningAlert("Funcionalidad no implementada", "La eliminación de productos se implementará en una fase posterior");
  };

  const abrirEditarModal = (producto: Producto) => {
    setProductoEditando(producto);
    setFormData({ ...producto });
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
      header: "Acciones", id: "acciones", meta: { align: "center" },
      cell: ({ row }) => {
        const producto = row.original;
        return (
          <div className="flex justify-center space-x-2">
            <button onClick={() => abrirEditarModal(producto)} className="p-2 rounded bg-orange-400 text-white hover:bg-orange-500" title="Editar producto">
              <Edit size={18} />
            </button>
            <button onClick={() => handleEliminar(producto.Id_Producto)} className="p-2 rounded bg-red-500 text-white hover:bg-red-600" title="Eliminar producto">
              <Trash2 size={18} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 border border-black rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Productos (Multi-DB)</h1>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <input type="text" placeholder="Buscar por código o descripción..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-black placeholder-gray-500" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="min-w-[200px]">
          <select value={filtroBaseDatos} onChange={(e) => setFiltroBaseDatos(e.target.value === "" ? "" : parseInt(e.target.value))} className="px-3 py-2 border rounded-lg bg-white text-black w-full">
            {basesDatos.map(base => <option key={base.Id_Base} value={base.Id_Base}>{base.BaseDatos}</option>)}
          </select>
        </div>
        <button onClick={() => {
          setProductoEditando(null);
          setFormData({ CodigoProducto: "", Descripcion: "", Existencia: 0, Costo: 0, Precio: 0, Id_Base: 1 });
          setModalAbierto(true);
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
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
      />
    </div>
  );
};

export default Products;
