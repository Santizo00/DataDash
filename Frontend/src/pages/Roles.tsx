import React, { useState, useEffect } from "react";
import { Search, CirclePlus, Trash2, Edit } from "lucide-react";
import { showCustomSuccessAlert, showErrorAlert, showConfirmAlert } from "../components/AlertService";
import { hideLoading, showLoading } from "../components/loadingService";
import { Table } from "../components/Table";
import type { ColumnDef } from "@tanstack/react-table";

const API_URL = import.meta.env.VITE_URL_BACKEND;

interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolesCompletos, setRolesCompletos] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolActual, setRolActual] = useState<Rol>({ id_rol: 0, nombre_rol: "", descripcion: "" });

  useEffect(() => {
    cargarRoles();
  }, []);

  useEffect(() => {
    filtrarRoles();
  }, [busqueda]);

  const cargarRoles = async () => {
    showLoading("Cargando roles...");
    try {
      const response = await fetch(`${API_URL}/roles/`);
      const data = await response.json();
      hideLoading();
      if (data.exito) {
        const rolesArray = Array.isArray(data.datos) ? data.datos : [];
        setRoles(rolesArray);
        setRolesCompletos(rolesArray);
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error cargando roles:", error);
      showErrorAlert("Error de conexión", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const filtrarRoles = () => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) {
      setRoles(rolesCompletos);
      return;
    }
    
    const filtrados = rolesCompletos.filter((rol) =>
      rol.nombre_rol.toLowerCase().includes(termino) || 
      (rol.descripcion && rol.descripcion.toLowerCase().includes(termino))
    );
    setRoles(filtrados);
  };

  const abrirModalCrear = () => {
    setRolActual({ id_rol: 0, nombre_rol: "", descripcion: "" });
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (rol: Rol) => {
    setRolActual({ ...rol });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRolActual(prev => ({ ...prev, [name]: value }));
  };

  const guardarRol = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rolActual.nombre_rol.trim()) {
      showErrorAlert("Error de validación", "El nombre del rol es obligatorio");
      return;
    }
    
    const esEdicion = modoEdicion;
    const metodo = esEdicion ? "PUT" : "POST";
    const url = esEdicion ? `${API_URL}/roles/update${rolActual.id_rol}` : `${API_URL}/roles/insert`;
    
    showLoading(esEdicion ? "Actualizando rol..." : "Creando rol...");
    
    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_rol: rolActual.nombre_rol.trim(),
          descripcion: rolActual.descripcion.trim()
        })
      });
      
      const data = await response.json();
      hideLoading();
      
      if (data.exito) {
        showCustomSuccessAlert(
          esEdicion ? "Rol actualizado" : "Rol creado",
          esEdicion
            ? `El rol <strong>${rolActual.nombre_rol}</strong> ha sido actualizado correctamente.`
            : `El rol <strong>${rolActual.nombre_rol}</strong> ha sido creado correctamente.`
        );
        
        cerrarModal();
        cargarRoles();
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error(`Error ${esEdicion ? "actualizando" : "creando"} rol:`, error);
      showErrorAlert(
        "Error de conexión",
        `No se pudo ${esEdicion ? "actualizar" : "crear"} el rol.`
      );
    }
  };

  const confirmarEliminarRol = (rol: Rol) => {
    showConfirmAlert(
      "Eliminar rol",
      `¿Está seguro que desea eliminar el rol <strong>${rol.nombre_rol}</strong>?`,
      async () => {
        await eliminarRol(rol.id_rol);
      }
    );
  };

  const eliminarRol = async (id: number) => {
    showLoading("Eliminando rol...");
    
    try {
      const response = await fetch(`${API_URL}/roles/delete${id}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      hideLoading();
      
      if (data.exito) {
        showCustomSuccessAlert(
          "Rol eliminado",
          "El rol ha sido eliminado correctamente."
        );
        
        cargarRoles();
      } else {
        showErrorAlert("Error", data.mensaje || "No se pudo eliminar el rol");
      }
    } catch (error) {
      hideLoading();
      console.error("Error eliminando rol:", error);
      showErrorAlert("Error de conexión", "No se pudo eliminar el rol.");
    }
  };

  const columns: ColumnDef<Rol>[] = [
    {
      header: "ID",
      accessorKey: "id_rol",
      cell: info => <div className="text-center">{String(info.getValue())}</div>,
      meta: { align: "center" }
    },
    {
      header: "Nombre",
      accessorKey: "nombre_rol",
      cell: info => <div className="text-left">{String(info.getValue())}</div>,
      meta: { align: "left" }
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
      cell: info => <div className="text-left">{String(info.getValue()) || "-"}</div>,
      meta: { align: "left" }
    },
    {
      header: "Acciones",
      id: "acciones",
      cell: info => {
        const rol = info.row.original;
        return (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => abrirModalEditar(rol)}
              className="p-2 rounded bg-orange-400 text-white hover:bg-orange-500"
              title="Editar rol"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => confirmarEliminarRol(rol)}
              className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
              title="Eliminar rol"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      },
      meta: { align: "center" }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 border border-black rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Roles</h1>
      
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-black placeholder-gray-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <button
          onClick={abrirModalCrear}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <CirclePlus className="mr-2" /> Nuevo Rol
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cargando ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron roles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              data={roles}
              columns={columns}
              className="bg-white rounded-lg shadow"
              emptyMessage="No se encontraron roles"
              pagination={true}
              pageSize={10}
            />
          </div>
        )}
      </div>
      
      {/* Modal de Crear/Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-black">
              {modoEdicion ? "Editar Rol" : "Nuevo Rol"}
            </h2>
            
            <form onSubmit={guardarRol}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre_rol">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre_rol"
                  name="nombre_rol"
                  value={rolActual.nombre_rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder="Ingrese el nombre del rol"
                  maxLength={50}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcion">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={rolActual.descripcion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder="Ingrese una descripción (opcional)"
                  rows={3}
                  maxLength={255}
                />
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {modoEdicion ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;