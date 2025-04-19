import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Home from "./pages/Home";
import Productos from "./pages/Products";
import Usuarios from "./pages/Users";
import Roles from "./pages/Roles";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Definir interface para el usuario
interface UserData {
  id?: number;
  nombres?: string;
  apellidos?: string;
  username?: string;
  rol?: number; // 1 = Admin, 2 = Empleado, etc.
  [key: string]: any;
}

// Función para obtener datos del usuario del localStorage
const getUserData = (): UserData | null => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Error al analizar datos del usuario:", e);
    return null;
  }
};

function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = getUserData();
      // Verificar que el objeto usuario tenga la estructura esperada
      if (!userData || typeof userData !== 'object' || !userData.rol) {
        console.log("Datos de usuario inválidos o incompletos");
        localStorage.removeItem("user");
        setUser(null);
      } else {
        setUser(userData);
      }
    } catch (e) {
      console.error("Error al obtener datos del usuario:", e);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user" || event.key === null) {
        const newUserData = getUserData();
        setUser(newUserData);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-blue-600 text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />

        {/* Ruta principal siempre redirige */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

        {/* Rutas protegidas con Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[1, 2]}>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/productos" element={
            <ProtectedRoute allowedRoles={[1, 2]}>
              <Productos />
            </ProtectedRoute>
          } />

          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={[1]}>
              <Usuarios />
            </ProtectedRoute>
          } />

          <Route path="/roles" element={
            <ProtectedRoute allowedRoles={[1]}>
              <Roles />
            </ProtectedRoute>
          } />
        </Route>

        {/* Cualquier otra ruta redirige a home o login */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;