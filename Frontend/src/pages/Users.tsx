import React, { useState, useEffect } from "react";
import { Search, CirclePlus, Trash2, Edit, ShieldAlert, ShieldCheck, Key } from "lucide-react";
import { showCustomSuccessAlert, showErrorAlert, showConfirmAlert } from "../components/AlertService";
import { hideLoading, showLoading } from "../components/loadingService";
import { Table } from "../components/Table";
import type { ColumnDef } from "@tanstack/react-table";

const API_URL = import.meta.env.VITE_URL_BACKEND;

interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  nombre_usuario: string;
  otp_activado: number;
  id_rol: number;
  nombre_rol?: string;
  fecha_registro: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface FormDataUsuario {
  nombres: string;
  apellidos: string;
  nombre_usuario: string;
  contrasena?: string;
  id_rol: number;
  limpiar_2fa?: boolean;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosCompletos, setUsuariosCompletos] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<FormDataUsuario>({
    nombres: "",
    apellidos: "",
    nombre_usuario: "",
    contrasena: "",
    id_rol: 2, // Por defecto, rol usuario normal
    limpiar_2fa: false  // Cambiamos otp_activado por limpiar_2fa
  });
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [secretoOTP, setSecretoOTP] = useState<string | null>(null);
  const [qrCodeURL, setQrCodeURL] = useState<string | null>(null);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  useEffect(() => {
    filtrarUsuarios();
  }, [busqueda]);

  const cargarRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/roles/`);
      const data = await response.json();
      if (data.exito) {
        setRoles(data.datos);
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      console.error("Error cargando roles:", error);
      showErrorAlert("Error de conexión", "No se pudo cargar la lista de roles.");
    }
  };

  const cargarUsuarios = async () => {
    showLoading("Cargando usuarios...");
    try {
      const response = await fetch(`${API_URL}/users/`);
      const data = await response.json();
      hideLoading();
      if (data.exito) {
        const usuariosArray = Array.isArray(data.datos) ? data.datos : [];
        setUsuarios(usuariosArray);
        setUsuariosCompletos(usuariosArray);
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error("Error cargando usuarios:", error);
      showErrorAlert("Error de conexión", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const filtrarUsuarios = () => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) {
      setUsuarios(usuariosCompletos);
      return;
    }
    
    const filtrados = usuariosCompletos.filter((usuario) =>
      usuario.nombre_usuario.toLowerCase().includes(termino) || 
      usuario.nombres.toLowerCase().includes(termino) ||
      usuario.apellidos.toLowerCase().includes(termino) ||
      (usuario.nombre_rol && usuario.nombre_rol.toLowerCase().includes(termino))
    );
    setUsuarios(filtrados);
  };

  const abrirModalCrear = () => {
    setUsuarioActual({
      nombres: "",
      apellidos: "",
      nombre_usuario: "",
      contrasena: "",
      id_rol: 2,
    });
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioActual({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      nombre_usuario: usuario.nombre_usuario,
      contrasena: "", // No mostrar contraseña actual
      id_rol: usuario.id_rol,
      limpiar_2fa: false // Inicialmente no limpiamos el 2FA
    });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    // Si tenemos datos de QR, también cerramos el modal de QR
    if (qrCodeURL) {
      setMostrarModalQR(false);
      setQrCodeURL(null);
      setSecretoOTP(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Manejo especial para checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUsuarioActual(prev => ({ ...prev, [name]: checked }));
    } else {
      setUsuarioActual(prev => ({ ...prev, [name]: value }));
    }
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!usuarioActual.nombres || !usuarioActual.apellidos || !usuarioActual.nombre_usuario) {
      showErrorAlert("Error de validación", "Los campos nombres, apellidos y nombre de usuario son obligatorios");
      return;
    }
  
    // En modo creación, la contraseña es obligatoria
    if (!modoEdicion && !usuarioActual.contrasena) {
      showErrorAlert("Error de validación", "La contraseña es obligatoria para crear un usuario");
      return;
    }
    
    const esEdicion = modoEdicion;
    const metodo = esEdicion ? "PUT" : "POST";
    const id = esEdicion ? obtenerIdUsuarioEditando() : '';
    const url = esEdicion 
      ? `${API_URL}/users/update${id}` 
      : `${API_URL}/users/insert`;
    
    showLoading(esEdicion ? "Actualizando usuario..." : "Creando usuario...");
    
    try {
      // Si es edición y no se proporcionó contraseña, no la enviamos
      const datosEnviar = { ...usuarioActual };
      if (esEdicion && !datosEnviar.contrasena) {
        delete datosEnviar.contrasena;
      }
      
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnviar)
      });
      
      const data = await response.json();
      hideLoading();
      
      if (data.exito) {
        // Mostrar mensaje de éxito
        showCustomSuccessAlert(
          esEdicion ? "Usuario actualizado" : "Usuario creado",
          esEdicion
            ? `El usuario <strong>${usuarioActual.nombre_usuario}</strong> ha sido actualizado correctamente.`
            : `El usuario <strong>${usuarioActual.nombre_usuario}</strong> ha sido creado correctamente.`
        );
        
        cerrarModal();
        
        // Recargar lista de usuarios
        cargarUsuarios();
      } else {
        showErrorAlert("Error", data.mensaje);
      }
    } catch (error) {
      hideLoading();
      console.error(`Error ${esEdicion ? "actualizando" : "creando"} usuario:`, error);
      showErrorAlert(
        "Error de conexión",
        `No se pudo ${esEdicion ? "actualizar" : "crear"} el usuario.`
      );
    }
  };

  const obtenerIdUsuarioEditando = (): number => {
    const usuarioEncontrado = usuariosCompletos.find(
      u => u.nombre_usuario === usuarioActual.nombre_usuario
    );
    return usuarioEncontrado?.id_usuario || 0;
  };

  const confirmarEliminarUsuario = (usuario: Usuario) => {
    // No permitir eliminar al usuario administrador principal (ID 1)
    if (usuario.id_usuario === 1) {
      showErrorAlert(
        "Operación no permitida", 
        "No se puede eliminar al usuario administrador principal"
      );
      return;
    }
    
    showConfirmAlert(
      "Eliminar usuario",
      `¿Está seguro que desea eliminar al usuario <strong>${usuario.nombre_usuario}</strong>?`,
      async () => {
        await eliminarUsuario(usuario.id_usuario);
      }
    );
  };

  const eliminarUsuario = async (id: number) => {
    showLoading("Eliminando usuario...");
    
    try {
      const response = await fetch(`${API_URL}/users/delete${id}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      hideLoading();
      
      if (data.exito) {
        showCustomSuccessAlert(
          "Usuario eliminado",
          "El usuario ha sido eliminado correctamente."
        );
        
        cargarUsuarios();
      } else {
        showErrorAlert("Error", data.mensaje || "No se pudo eliminar el usuario");
      }
    } catch (error) {
      hideLoading();
      console.error("Error eliminando usuario:", error);
      showErrorAlert("Error de conexión", "No se pudo eliminar el usuario.");
    }
  };

  const cerrarModalQR = () => {
    setMostrarModalQR(false);
    setModalAbierto(false);
    
    // Mostrar mensaje de éxito
    showCustomSuccessAlert(
      modoEdicion ? "Usuario actualizado" : "Usuario creado",
      modoEdicion
        ? `El usuario <strong>${usuarioActual.nombre_usuario}</strong> ha sido actualizado correctamente.`
        : `El usuario <strong>${usuarioActual.nombre_usuario}</strong> ha sido creado correctamente.`
    );
  };

  const getNombreRol = (idRol: number): string => {
    const rol = roles.find(r => r.id_rol === idRol);
    return rol?.nombre_rol || "Desconocido";
  };

  const columns: ColumnDef<Usuario>[] = [
    {
      header: "ID",
      accessorKey: "id_usuario",
      cell: info => <div className="text-center">{String(info.getValue())}</div>,
      meta: { align: "center" }
    },
    {
      header: "Nombre Usuario",
      accessorKey: "nombre_usuario",
      cell: info => <div className="text-left">{String(info.getValue())}</div>,
      meta: { align: "left" }
    },
    {
      header: "Nombres",
      accessorKey: "nombres",
      cell: info => <div className="text-left">{String(info.getValue())}</div>,
      meta: { align: "left" }
    },
    {
      header: "Apellidos",
      accessorKey: "apellidos",
      cell: info => <div className="text-left">{String(info.getValue())}</div>,
      meta: { align: "left" }
    },
    {
      header: "Rol",
      accessorKey: "nombre_rol",
      cell: info => {
        const usuario = info.row.original;
        const nombreRol = info.getValue<string>() || getNombreRol(usuario.id_rol);
        
        // Estilo según el rol
        const esAdmin = usuario.id_rol === 1;
        const color = esAdmin
          ? "bg-purple-100 text-purple-800"
          : "bg-blue-100 text-blue-800";
        
        return (
          <div className="flex items-center justify-center">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
              {esAdmin ? <ShieldAlert size={14} className="inline mr-1" /> : null}
              {nombreRol}
            </span>
          </div>
        );
      },
      meta: { align: "center" }
    },
    {
      header: "2FA",
      accessorKey: "otp_activado",
      cell: info => {
        const valor = info.getValue<number>();
        const activado = valor === 1;
        
        return (
          <div className="flex items-center justify-center">
            {activado ? (
              <div title="2FA Activado">
                <ShieldCheck size={20} className="text-green-500" />
              </div>
            ) : (
              <div title="2FA Desactivado">
                <Key size={20} className="text-gray-400" />
              </div>
            )}
          </div>
        );
      },
      meta: { align: "center" }
    },
    {
      header: "Fecha Registro",
      accessorKey: "fecha_registro",
      cell: info => {
        const fecha = info.getValue<string>();
        // Formatear fecha si existe
        if (fecha) {
          const fechaObj = new Date(fecha);
          return <div className="text-center">{fechaObj.toLocaleDateString()}</div>;
        }
        return <div className="text-center">-</div>;
      },
      meta: { align: "center" }
    },
    {
      header: "Acciones",
      id: "acciones",
      cell: info => {
        const usuario = info.row.original;
        const esAdmin = usuario.id_usuario === 1;
        
        return (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => abrirModalEditar(usuario)}
              className="p-2 rounded bg-orange-400 text-white hover:bg-orange-500"
              title="Editar usuario"
            >
              <Edit size={18} />
            </button>
            
            {!esAdmin && (
              <button
                onClick={() => confirmarEliminarUsuario(usuario)}
                className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
                title="Eliminar usuario"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        );
      },
      meta: { align: "center" }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 border border-black rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h1>
      
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o usuario..."
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
          <CirclePlus className="mr-2" /> Nuevo Usuario
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cargando ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              data={usuarios}
              columns={columns}
              className="bg-white rounded-lg shadow"
              emptyMessage="No se encontraron usuarios"
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
              {modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            
            <form onSubmit={guardarUsuario}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre_usuario">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="nombre_usuario"
                  name="nombre_usuario"
                  value={usuarioActual.nombre_usuario}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder="Ingrese el nombre de usuario"
                  required
                  disabled={modoEdicion} // No permitir cambiar username en edición
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombres">
                  Nombres
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={usuarioActual.nombres}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder="Ingrese los nombres"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apellidos">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={usuarioActual.apellidos}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder="Ingrese los apellidos"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contrasena">
                  {modoEdicion ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  id="contrasena"
                  name="contrasena"
                  value={usuarioActual.contrasena || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  placeholder={modoEdicion ? "Dejar en blanco para mantener" : "Ingrese la contraseña"}
                  required={!modoEdicion}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="id_rol">
                  Rol
                </label>
                <select
                  id="id_rol"
                  name="id_rol"
                  value={usuarioActual.id_rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                  required
                >
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>
              
              {modoEdicion && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="limpiar_2fa"
                      name="limpiar_2fa"
                      checked={usuarioActual.limpiar_2fa || false}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label className="text-gray-700 text-sm font-bold" htmlFor="limpiar_2fa">
                      Limpiar configuración 2FA
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si marca esta opción, se eliminará la configuración actual de 2FA y el usuario deberá configurarla de nuevo al iniciar sesión.
                  </p>
                </div>
              )}
              
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
      
      {/* Modal para código QR */}
      {mostrarModalQR && qrCodeURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-black">
              Configuración de autenticación 2FA
            </h2>
            
            <div className="mb-4 text-center">
              <img src={qrCodeURL} alt="Código QR para 2FA" className="mx-auto" />
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Escanee este código QR con una aplicación de autenticación como Google Authenticator o Authy.
                </p>
                
                {secretoOTP && (
                  <div className="mt-2">
                    <p className="text-sm font-bold">Código manual:</p>
                    <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                      {secretoOTP}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Si no puede escanear el código QR, puede ingresar este código manualmente en su aplicación.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={cerrarModalQR}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;