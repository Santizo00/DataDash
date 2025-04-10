import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, Home, Package, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Verificar si una ruta está activa
  const isActive = (path: string) => location.pathname === path;

  // Definir menú con información de roles
  const menuItems = [
    { 
      path: "/dashboard", 
      name: "Menu", 
      icon: <Home className="w-6 h-6 text-white" />,
      roles: [1, 2] // Todos los roles
    },
    { 
      path: "/productos", 
      name: "Productos", 
      icon: <Package className="w-6 h-6 text-white" />,
      roles: [1, 2] // Todos los roles
    },
    { 
      path: "/usuarios", 
      name: "Usuarios", 
      icon: <User className="w-6 h-6 text-white" />,
      roles: [1] // Solo admin
    },
    { 
      path: "/roles", 
      name: "Roles", 
      icon: <Settings className="w-6 h-6 text-white" />,
      roles: [1] // Solo admin
    }
  ];

  // Filtrar el menú según el rol del usuario
  const filteredMenu = menuItems.filter(item => 
    user?.rol ? item.roles.includes(user.rol) : false
  );

  // Ajustar el sidebar al tamaño de la pantalla en la carga inicial
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    // Ejecutar al montar el componente
    handleResize();

    // Agregar listener para redimensionamiento
    window.addEventListener('resize', handleResize);
    
    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-blue-800 to-blue-700 text-white h-screen flex flex-col transition-all duration-300 shadow-xl`}
    >
      {/* Header del Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-white-600/30">
        <span className={`${isOpen ? "block" : "hidden"} text-xl font-semibold`}>
          Mi Aplicación
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-blue-600/20 rounded-full transition-colors duration-200"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Opciones del Sidebar filtradas por rol */}
      <nav className="flex-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-4 hover:bg-blue-600/20 transition-all duration-200 ${
              isActive(item.path) ? "bg-blue-600/30" : ""
            }`}
          >
            {item.icon}
            {isOpen && (
              <span className="text-sm font-medium text-white">
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Sección del Usuario y Logout */}
      <div className="p-4 border-t border-white-600/30">
        <div className="flex items-center justify-between space-x-2">
          {isOpen && (
            <div className="flex items-center space-x-2 min-w-0">
              <User className="w-6 h-6 text-white flex-shrink-0" />
              <span className="text-sm font-medium text-white break-words line-clamp-2">
                {user?.nombres || "Usuario"}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center p-2 hover:bg-blue-600/20 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <LogOut className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </aside>
  );
}