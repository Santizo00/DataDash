import React, { useState, useEffect } from "react";
// First install recharts: npm install recharts @types/recharts
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { showErrorAlert } from "../components/AlertService";
import { hideLoading, showLoading } from "../components/loadingService";
import { DollarSign, Package, Percent, AlertTriangle, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_URL_BACKEND;

// Tipos de datos
interface KPI {
  TotalProductos: number;
  TotalExistencia: number;
  PromedioCosto: number;
  PromedioPrecio: number;
  PromedioMargen: number;
  ValorInventario: number;
  ValorVenta: number;
  UtilidadPotencial: number;
  ProductosActivos: number;
  ProductosInactivos: number;
  DistribucionProductos?: DistribucionProducto[];
}

interface DistribucionProducto {
  id: number;
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface BaseDatos {
  Id_Base: number;
  BaseDatos: string;
}

const Home: React.FC = () => {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [basesDatos, setBasesDatos] = useState<BaseDatos[]>([]);
  const [baseSeleccionada, setBaseSeleccionada] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    cargarBasesDatos();
    cargarKPIs();
  }, [baseSeleccionada]);

  const cargarBasesDatos = async () => {
    try {
      const response = await fetch(`${API_URL}/products/basesdatos`);
      const data = await response.json();
      
      if (data.exito) {
        setBasesDatos([...data.datos]);
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      console.error("Error cargando bases de datos:", error);
      showErrorAlert("Error de conexión", "No se pudo cargar la lista de bases de datos.");
    }
  };

  const cargarKPIs = async () => {
    showLoading("Calculando KPIs...");
    try {
      const url = baseSeleccionada 
        ? `${API_URL}/kpis?baseId=${baseSeleccionada}` 
        : `${API_URL}/kpis`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.exito) {
        if (baseSeleccionada) {
          // Si hay base seleccionada, obtener los datos específicos
          const baseKey = baseSeleccionada === "1" ? "todas" :
                         baseSeleccionada === "2" ? "mysql" :
                         baseSeleccionada === "3" ? "sqlserver" :
                         baseSeleccionada === "4" ? "postgres" : "oracle";
                         
          const baseData = data.resultadosPorBase[baseKey];
          if (baseData && baseData.exito) {
            setKpis({
              ...baseData.datos,
              DistribucionProductos: [{
                id: parseInt(baseSeleccionada),
                nombre: basesDatos.find(b => b.Id_Base === parseInt(baseSeleccionada))?.BaseDatos || "",
                cantidad: baseData.datos.TotalProductos,
                porcentaje: 100
              }]
            });
          }
        } else {
          // Datos consolidados
          setKpis(data.datos);
        }
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      console.error("Error cargando KPIs:", error);
      showErrorAlert("Error de conexión", "No se pudo cargar la información de KPIs.");
    } finally {
      hideLoading();
      setCargando(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-GT', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num / 100);
  };

  // Preparar datos para gráficos
  const prepararDatosDistribucion = () => {
    if (!kpis?.DistribucionProductos) return [];
    
    return kpis.DistribucionProductos.map(item => ({
      name: item.nombre,
      value: item.cantidad
    }));
  };

  const prepararDatosEstado = () => {
    if (!kpis) return [];
    
    return [
      { name: "Activos", value: kpis.ProductosActivos },
      { name: "Inactivos", value: kpis.ProductosInactivos }
    ];
  };

  const prepararDatosPrecios = () => {
    if (!kpis) return [];
    
    return [
      { name: "Costo", valor: kpis.PromedioCosto },
      { name: "Precio", valor: kpis.PromedioPrecio },
      { name: "Margen", valor: kpis.PromedioMargen }
    ];
  };

  const getBaseName = () => {
    if (!baseSeleccionada || baseSeleccionada === "0") return "todas las bases";
    const base = basesDatos.find(b => b.Id_Base === parseInt(baseSeleccionada));
    return base ? base.BaseDatos.toLowerCase() : "la base seleccionada";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de KPIs</h1>
          
          <div className="w-48">
            <select
              value={baseSeleccionada}
              onChange={(e) => setBaseSeleccionada(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white  text-black"
            >
              {basesDatos.map((base) => (
                <option key={base.Id_Base} value={base.Id_Base}>
                  {base.BaseDatos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Cargando KPIs...</p>
          </div>
        ) : kpis ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tarjeta de Total Productos */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total de Productos</p>
                    <p className="text-2xl font-bold text-black">{kpis.TotalProductos}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Package className="text-blue-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Productos registrados en {getBaseName()}
                </p>
              </div>

              {/* Tarjeta de Existencias */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total de Existencias</p>
                    <p className="text-2xl font-bold text-black">{formatNumber(kpis.TotalExistencia)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Package className="text-green-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Unidades en inventario
                </p>
              </div>

              {/* Tarjeta de Valor Inventario */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Valor de Inventario</p>
                    <p className="text-2xl font-bold text-black">{formatCurrency(kpis.ValorInventario)}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <DollarSign className="text-purple-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Costo total de inventario
                </p>
              </div>

              {/* Tarjeta de Valor Venta */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Valor de Venta</p>
                    <p className="text-2xl font-bold text-black">{formatCurrency(kpis.ValorVenta)}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <DollarSign className="text-yellow-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Precio total de inventario
                </p>
              </div>

              {/* Tarjeta de Utilidad Potencial */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Utilidad Potencial</p>
                    <p className="text-2xl font-bold text-black">{formatCurrency(kpis.UtilidadPotencial)}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingUp className="text-red-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Ganancia esperada de inventario
                </p>
              </div>

              {/* Tarjeta de Margen Promedio */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Margen Promedio</p>
                    <p className="text-2xl font-bold text-black">{formatPercent(kpis.PromedioMargen)}</p>
                  </div>
                  <div className="bg-teal-100 p-3 rounded-full">
                    <Percent className="text-teal-500" size={24} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Ganancia promedio por producto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Gráfico de Distribución por Base */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-black">Distribución de Productos por Base de Datos</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepararDatosDistribucion()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepararDatosDistribucion().map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Cantidad']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Estado de Productos */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-black">Estado de Productos</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepararDatosEstado()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#F44336" />
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Cantidad']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-black">Relación de Costos y Precios</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepararDatosPrecios()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                      <Legend />
                      <Bar dataKey="valor" name="Valor Promedio" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={48} />
              <p className="text-gray-700">No se pudieron cargar los KPIs</p>
              <p className="text-gray-500 text-sm mt-2">
                Intente nuevamente o contacte al administrador del sistema
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;