import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import HomePage from "./pages/Home";
import AdminPage from "./pages/Home";
import EmployeePage from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

// Definir interface para el usuario
interface UserData {
  id?: number;
  nombre?: string;
  role?: number; // 1 = Admin, 2 = Empleado, etc.
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
    const userData = getUserData();
    setUser(userData);
    setIsLoading(false);
    
    const handleStorageChange = () => {
      setUser(getUserData());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-blue-600 text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Página de login y registro, redirigir si el usuario ya está autenticado */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />

        {/* Página principal, redirigir si no hay usuario */}
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace />} />

        {/* Rutas protegidas por roles */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[1]}>
            <AdminPage />
          </ProtectedRoute>
        } />
        
        <Route path="/employee" element={
          <ProtectedRoute allowedRoles={[2]}>
            <EmployeePage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <HomePage />
          </ProtectedRoute>
        } />

        {/* Redirigir cualquier otra ruta a login si no hay usuario */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
