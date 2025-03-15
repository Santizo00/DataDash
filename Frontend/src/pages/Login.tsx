import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Eye, EyeOff, CircleUserRound } from "lucide-react";
import BackgroundGradient from "../components/BackgroundGradient";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Intentando iniciar sesión con:", credentials);
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <BackgroundGradient>
      <div className="w-full max-w-[600px] px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="w-full flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
              <CircleUserRound className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo de usuario/correo */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                placeholder="Usuario o correo electrónico"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              />
            </div>

            {/* Campo de contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                placeholder="Contraseña"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none border-none"
                onClick={() => setShowPassword(!showPassword)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
              </button>
            </div>

            {/* Botones de login */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2 mt-2">
              {/* Botón de Ingresar */}
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 w-full sm:flex-grow rounded-lg flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Ingresar</span>
              </button>

              {/* Botón de Google */}
              <button
                type="button"
                className="bg-white text-white py-3 w-full sm:w-auto sm:px-5 rounded-lg flex items-center justify-center border border-black"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
              </button>
            </div>

            {/* Enlaces de registro y recuperación */}
            <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600 mt-1 space-y-2 sm:space-y-0">
              <button
                type="button"
                className="hover:underline focus:outline-none border-none"
                onClick={goToRegister}
              >
                Registrarse
              </button>
              <button
                type="button"
                className="hover:underline focus:outline-none border-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>
      </div>
    </BackgroundGradient>
  );
};

export default LoginPage;