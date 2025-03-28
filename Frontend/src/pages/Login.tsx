import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Eye, EyeOff, CircleUserRound } from "lucide-react";
import BackgroundGradient from "../components/BackgroundGradient";
import { showSuccessAlert,  showErrorAlert, showCustomWarningAlert} from "../components/AlertService";
import { showLoading } from "../components/loadingService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_URL_BACKEND;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error en autenticación");

        // ✅ Si las credenciales son correctas, procedemos a enviar el código de verificación
        sendVerificationCode(data.email, credentials.username);

    } catch (error: any) {
        showErrorAlert("Error en autenticación", error.message || "No se pudo iniciar sesión.");
    }
  };

  const sendVerificationCode = async (email: string, username: string) => {
    try {
        showLoading("Cargando...");

        const response = await fetch(`${API_URL}/auth/send-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al enviar código de verificación");

        // ✅ Mostrar alerta con input para ingresar el código de verificación
        const inputContainer = document.createElement("div");
        inputContainer.className = "mt-3 text-center flex flex-col items-center";

        const codeInput = document.createElement("input");
        codeInput.id = "verification-code";
        codeInput.type = "text";
        codeInput.className = "block pl-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none mx-auto w-3/4 max-w-xs";
        codeInput.placeholder = "Código de verificación";

        const textElement = document.createElement("div");
        textElement.innerHTML = `Se ha enviado un código a <b>${email}</b>. Ingresa el código para continuar.`;
        textElement.className = "mb-4";

        inputContainer.appendChild(textElement);
        inputContainer.appendChild(codeInput);

        await showCustomWarningAlert(
            "Verificación de Correo",
            inputContainer,
            [
                { 
                    text: "Confirmar", 
                    color: "#28a745", 
                    callback: () => {
                        const code = (document.getElementById("verification-code") as HTMLInputElement).value;
                        confirmVerification(code, email);
                    } 
                },
                { text: "Cancelar", color: "#dc3545" }
            ]
        );

    } catch (error: any) {
        showErrorAlert("Error en el envío", error.message || "Ocurrió un problema al enviar el código.");
    }
  };

  const confirmVerification = async (codigoIngresado: string, email: string) => {
    if (!codigoIngresado?.trim()) {
        showErrorAlert("Código requerido", "Por favor, ingresa el código de verificación.");
        return;
    }

    try {
        showLoading("Verificando código...");

        const verifyResponse = await fetch(`${API_URL}/auth/verify-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: codigoIngresado }),
        });

        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) throw new Error(verifyData.message || "Código incorrecto");

        showSuccessAlert("Inicio de sesión exitoso", "Bienvenido de nuevo.");
        
        // ✅ Redirigir después de 2 segundos
        showSuccessAlert("","Bienvenido");

    } catch (error: any) {
        showErrorAlert("Error en verificación", error.message || "Código incorrecto.");
    }
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
                className="text-blue-600 hover:underline focus:outline-none border-none"
                onClick={goToRegister}
              >
                Registrarse
              </button>
              <button
                type="button"
                className="text-blue-600 hover:underline focus:outline-none border-none"
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