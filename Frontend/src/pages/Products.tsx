import React, { useState, useEffect } from "react";
import { Search, CirclePlus, Trash2, Edit } from "lucide-react";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showCustomWarningAlert } from "../components/AlertService";
import { hideLoading, showLoading } from "../components/loadingService";

const API_URL = import.meta.env.VITE_URL_BACKEND;

interface Producto {
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
}

interface FormDataType {
  CodigoProducto: string;
  Descripcion: string;
  Existencia: number;
  Costo: number;
  Precio: number;
  Margen?: number;
}

interface RespuestaAPI {
  exito: boolean;
  mensaje: string;
  datos: Producto[] | Producto;
  error?: string;
}

const ProductosMySQL: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosCompletos, setProductosCompletos] = useState<Producto[]>([]);
  const [, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState("");
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    CodigoProducto: "",
    Descripcion: "",
    Existencia: 0,
    Costo: 0,
    Precio: 0
  });

  // Cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Efecto para la búsqueda en tiempo real
  useEffect(() => {
    filtrarProductos();
  }, [busqueda]);

  const cargarProductos = async () => {
    showLoading("Cargando productos...");
    try {
      const response = await fetch(`${API_URL}/mysql/`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data: RespuestaAPI = await response.json();
      
      // Actualizar los productos
      if (data.exito) {
        const productosArray = Array.isArray(data.datos) ? data.datos : [];
        setProductos(productosArray);
        setProductosCompletos(productosArray); // Guardar copia completa para búsquedas
        
        hideLoading();
        // Mostrar mensaje de éxito si hay datos
        if (productosArray.length > 0) {
        } else {
          // Si no hay datos, mostrar advertencia
          showWarningAlert("Sin datos", "No se encontraron productos en MySQL");
        }
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      showErrorAlert("Error de conexión", "No se pudo conectar con el servidor. Verifique que el backend esté ejecutándose.");
    } finally {
      setCargando(false);
    }
  };
  
  // Búsqueda local en tiempo real
  const filtrarProductos = () => {
    if (!busqueda.trim()) {
      // Si la búsqueda está vacía, mostrar todos los productos
      setProductos(productosCompletos);
      return;
    }
    
    // Filtrar productos localmente
    const terminoBusqueda = busqueda.toLowerCase().trim();
    const productosFiltrados = productosCompletos.filter(producto => 
      producto.CodigoProducto.toLowerCase().includes(terminoBusqueda) || 
      producto.Descripcion.toLowerCase().includes(terminoBusqueda)
    );
    
    setProductos(productosFiltrados);
  };

  // Calcular margen en tiempo real como porcentaje
  const calcularPorcentajeMargen = (costo: number, precio: number): number => {
    if (costo === 0) return 0;
    const margenMonetario = precio - costo;
    return (margenMonetario / costo) * 100;
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Actualizar el campo en formData
    const newFormData = {
      ...formData,
      [name]: name === "Existencia" || name === "Costo" || name === "Precio" 
        ? parseFloat(value) || 0 
        : value
    };
    
    // Si el costo o precio cambian, recalcular el porcentaje de margen
    if (name === "Costo" || name === "Precio") {
      const porcentaje = calcularPorcentajeMargen(
        name === "Costo" ? parseFloat(value) || 0 : formData.Costo,
        name === "Precio" ? parseFloat(value) || 0 : formData.Precio
      );
      
      // Agregar el margen calculado al formData
      newFormData.Margen = porcentaje;
    }
    
    setFormData(newFormData);
  };

  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
  };

  // Enviar formulario (crear/editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.CodigoProducto.trim()) {
      showErrorAlert("Datos incompletos", "El código del producto es obligatorio");
      return;
    }
    
    if (!formData.Descripcion.trim()) {
      showErrorAlert("Datos incompletos", "La descripción del producto es obligatoria");
      return;
    }
    
    // Asegurar que el margen está calculado correctamente
    const dataToSend = {
      ...formData,
      Margen: calcularPorcentajeMargen(formData.Costo, formData.Precio)
    };
    
    showLoading(productoEditando ? "Actualizando producto..." : "Creando producto...");
    
    try {
      const url = productoEditando 
        ? `${API_URL}/mysql/${productoEditando.Id_Producto}` 
        : `${API_URL}/mysql/`;
      
      const method = productoEditando ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      const data = await response.json();
      
      if (data.exito) {
        showSuccessAlert(
          productoEditando ? "Producto actualizado" : "Producto creado", 
          data.mensaje
        );
        
        // Cerrar modal y reiniciar formulario
        setModalAbierto(false);
        setProductoEditando(null);
        
        // Recargar productos
        await cargarProductos();
      } else {
        showErrorAlert(
          productoEditando ? "Error al actualizar" : "Error al crear", 
          data.mensaje || data.error || "Ocurrió un error inesperado"
        );
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
      showErrorAlert("Error de conexión", "No se pudo conectar con el servidor");
    } 
  };

  // Eliminar producto
  const handleEliminar = async (id: number) => {
    const resultado = await showCustomWarningAlert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.",
      [
        { text: "Eliminar", color: "#dc3545" },
        { text: "Cancelar", color: "#6c757d" }
      ]
    );
    
    if (resultado.isConfirmed) {
      showLoading("Eliminando producto...");
      
      try {
        const response = await fetch(`${API_URL}/mysql/${id}`, {
          method: "DELETE"
        });
        
        const data = await response.json();
        
        if (data.exito) {
          await cargarProductos();
          
          // Esperar 1 segundo antes de recargar los productos
          setTimeout(async () => {
            
            showSuccessAlert("Producto eliminado", data.mensaje);
          }, 50);
          
        } else {
          showErrorAlert("Error al eliminar", data.mensaje || data.error || "Ocurrió un error inesperado");
        }
      } catch (error) {
        console.error("Error eliminando producto:", error);
        showErrorAlert("Error de conexión", "No se pudo conectar con el servidor");
      }
    }
  };

  // Abrir modal para editar
  const abrirEditarModal = (producto: Producto) => {
    setProductoEditando(producto);
    setFormData({
      CodigoProducto: producto.CodigoProducto,
      Descripcion: producto.Descripcion,
      Existencia: producto.Existencia,
      Costo: producto.Costo,
      Precio: producto.Precio,
      Margen: producto.Margen
    });
    setModalAbierto(true);
  };

  // Porcentaje de margen para mostrar en el modal
  const porcentajeMargen = calcularPorcentajeMargen(formData.Costo, formData.Precio);

  return (
    <div className="container mx-auto px-4 py-8 border border-black rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Productos (MySQL)</h1>
      
      {/* Barra de búsqueda y botón agregar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-1/2">
          <div className="flex">
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-black placeholder-gray-500"
              value={busqueda}
              onChange={handleSearchChange}
            />
          </div>
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          onClick={() => {
            setProductoEditando(null);
            setFormData({
              CodigoProducto: "",
              Descripcion: "",
              Existencia: 0,
              Costo: 0,
              Precio: 0
            });
            setModalAbierto(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <CirclePlus className="mr-2" /> Nuevo Producto
        </button>
      </div>
      
      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {productos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Existencia</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">BaseDatos</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.map((producto) => (
                  <tr key={producto.Id_Producto}>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{producto.CodigoProducto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{producto.Descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black text-right">{(producto.Existencia)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black text-right">Q. {(producto.Costo)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black text-right">Q. {(producto.Precio)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black text-right">{(producto.Margen)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black text-right">{(producto.BaseDatos)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => abrirEditarModal(producto)}
                          className="p-2 rounded bg-orange-400 text-white hover:bg-orange-500"
                          title="Editar producto"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleEliminar(producto.Id_Producto)}
                          className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
                          title="Eliminar producto"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-black">
              {productoEditando ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Código</label>
                <input
                  type="text"
                  name="CodigoProducto"
                  placeholder="Código del producto"
                  value={formData.CodigoProducto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  name="Descripcion"
                  placeholder="Descripción del producto"
                  value={formData.Descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Existencia</label>
                  <input
                    type="number"
                    name="Existencia"
                    value={formData.Existencia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Costo</label>
                  <input
                    type="number"
                    name="Costo"
                    value={formData.Costo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Precio</label>
                  <input
                    type="number"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              {/* Mostrar cálculo de margen */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Porcentaje de Margen:</span>
                  <span className={`font-semibold ${porcentajeMargen < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {porcentajeMargen.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {productoEditando ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosMySQL;