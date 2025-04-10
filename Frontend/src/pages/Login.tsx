import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Eye, EyeOff, CircleUserRound } from "lucide-react";
import BackgroundGradient from "../components/BackgroundGradient";
import { showErrorAlert, showCustomWarningAlert } from "../components/AlertService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [, setUserId] = useState<number | null>(null);

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

      // Guardar el ID del usuario para usarlo en la verificación OTP
      setUserId(data.userId);

      // Verificar si el usuario requiere autenticación OTP
      if (data.requiresOtp) {
        // Mostrar el modal para ingresar el código OTP
        showOtpVerification(data.userId);
      } else {
        // Si no requiere OTP, procesar el inicio de sesión directamente
        processLoginSuccess(data);
      }

    } catch (error: any) {
      showErrorAlert("Error en autenticación", error.message || "No se pudo iniciar sesión.");
    }
  };

  // Procesar el inicio de sesión exitoso
  const processLoginSuccess = (data: any) => {
    // Guardar el token JWT
    if (data.token) {
      localStorage.setItem("token", data.token);
      
      // Establecer el token como header por defecto para futuras peticiones
      // Esto se puede hacer desde un interceptor en un servicio centralizado
    }
    
    // Guardar la información del usuario
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    
    navigate('/dashboard');
  };

  const showOtpVerification = async (userId: number) => {
    try {
      // Crear contenedor para el sistema de 6 inputs
      const otpContainer = document.createElement("div");
      otpContainer.className = "flex flex-col items-center p-2";
      
      const descElement = document.createElement("p");
      descElement.className = "text-sm text-center mb-3";
      descElement.innerHTML = "Ingresa el código de 6 dígitos<br>de tu aplicación de autenticación";
      
      // Sistema de 6 inputs individuales
      const inputContainer = document.createElement("div");
      inputContainer.className = "flex justify-center space-x-2 mb-4";
      
      // Función para manejar la entrada de dígitos (para DOM nativo)
      const handleInputChange = (index: number) => (e: Event) => {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        
        // Si es un dígito, avanzar al siguiente input
        if (/^\d$/.test(value) && index < 5) {
          const nextInput = document.getElementById(`otp-input-${index + 1}`);
          if (nextInput) nextInput.focus();
        }
      };
      
      // Función para manejar teclas especiales (borrar, pegar) (para DOM nativo)
      const handleKeyDown = (index: number) => (e: KeyboardEvent) => {
        const input = e.target as HTMLInputElement;
        
        // Si presiona Backspace en un input vacío, retroceder al anterior
        if (e.key === "Backspace" && input.value === "" && index > 0) {
          const prevInput = document.getElementById(`otp-input-${index - 1}`);
          if (prevInput) prevInput.focus();
        }
        
        // Si presiona la tecla V con Ctrl (pegar)
        if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          
          // Leer del portapapeles
          navigator.clipboard.readText().then(pastedText => {
            // Limpiar cualquier carácter no numérico
            const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
            
            // Distribuir los dígitos en los inputs
            for (let i = 0; i < digits.length; i++) {
              const inputElement = document.getElementById(`otp-input-${i}`);
              if (inputElement) {
                (inputElement as HTMLInputElement).value = digits[i];
              }
            }
            
            // Enfocar el siguiente input vacío o el último si todos están llenos
            if (digits.length < 6) {
              const nextInput = document.getElementById(`otp-input-${digits.length}`);
              if (nextInput) nextInput.focus();
            } else {
              const lastInput = document.getElementById(`otp-input-5`);
              if (lastInput) lastInput.focus();
            }
          });
        }
      };
      
      // Limpiar el contenedor para asegurarnos que no haya inputs previos
      inputContainer.innerHTML = '';
      
      // Crear solo 6 inputs con color de fondo blanco
      for (let i = 0; i < 6; i++) {
        const input = document.createElement("input");
        input.id = `otp-input-${i}`;
        input.type = "text";
        input.maxLength = 1;
        input.className = "w-10 h-12 text-center border border-gray-300 rounded-md text-lg font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-black";
        input.inputMode = "numeric";
        input.pattern = "[0-9]";
        
        // Agregar event listeners
        input.addEventListener("input", handleInputChange(i));
        input.addEventListener("keydown", handleKeyDown(i));
        
        inputContainer.appendChild(input);
      }
      
      otpContainer.appendChild(descElement);
      otpContainer.appendChild(inputContainer);

      // Mostrar el modal con los inputs para el código OTP
      await showCustomWarningAlert(
        "Verificación de Seguridad",
        otpContainer,
        [
          { 
            text: "Verificar", 
            color: "#28a745", 
            callback: () => {
              // Recopilar los valores de los 6 inputs para formar el código completo
              let code = "";
              for (let i = 0; i < 6; i++) {
                const inputElement = document.getElementById(`otp-input-${i}`) as HTMLInputElement;
                code += inputElement.value || "";
              }
              verifyOtpCode(userId, code);
            } 
          },
          { 
            text: "Cancelar", 
            color: "#ff4f4f",
            callback: () => {
              // No hace nada, solo cierra el modal
            }
          }
        ]
      );

      // Enfocar el primer input automáticamente
      setTimeout(() => {
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
      }, 300);

    } catch (error: any) {
      showErrorAlert("Error", error.message || "Ocurrió un problema al mostrar la verificación.");
    }
  };

  const verifyOtpCode = async (userId: number, otpCode: string) => {
    if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      showErrorAlert("Código inválido", "Por favor, ingresa un código de 6 dígitos.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otpCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Código incorrecto");

      // Si la verificación OTP es exitosa, procesar el inicio de sesión
      processLoginSuccess(data);

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
            {/* Campo de usuario */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                placeholder="Nombre de usuario"
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