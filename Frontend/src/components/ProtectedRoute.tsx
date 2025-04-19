import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: number[];
}

interface UserData {
  id?: number;
  nombres?: string;
  apellidos?: string;
  rol?: number;
  [key: string]: any;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          // Asegurarse de limpiar el localStorage por completo para evitar datos corruptos
          localStorage.removeItem("user");
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
        
        let user: UserData;
        try {
          user = JSON.parse(userStr) as UserData;
          // Verificar que el objeto usuario tenga la estructura esperada
          if (!user || typeof user !== 'object' || user.rol === undefined) {
            localStorage.removeItem("user");
            setHasAccess(false);
            setIsChecking(false);
            return;
          }
        } catch (e) {
          console.error("Error al analizar JSON del usuario:", e);
          localStorage.removeItem("user");
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
        
        // Si no se especifican roles, cualquier usuario autenticado tiene acceso
        if (!allowedRoles || allowedRoles.length === 0) {
          setHasAccess(true);
          setIsChecking(false);
          return;
        }
        
        // Verificar si el usuario tiene el rol permitido
        const userHasAccess = user.rol !== undefined && allowedRoles.includes(user.rol);
        
        setHasAccess(userHasAccess);
        setIsChecking(false);
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        localStorage.removeItem("user");
        setHasAccess(false);
        setIsChecking(false);
      }
    };
    
    checkAccess();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user" || event.key === null) {
        checkAccess();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [allowedRoles]);
  
  if (isChecking) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-blue-600 text-xl">Verificando acceso...</p>
      </div>
    );
  }
  
  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;