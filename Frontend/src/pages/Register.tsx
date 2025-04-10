import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, CircleUserRound, UserRound, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackgroundGradient from "../components/BackgroundGradient";
import { showSuccessAlert, showErrorAlert, showCustomWarningAlert } from "../components/AlertService";
import { showLoading } from "../components/loadingService";

const RegisterPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    nombres: "",
    apellidos: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setErrors] = useState<{ [key: string]: string }>({});
  const [, setOtpSecret] = useState<string | null>(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_URL_BACKEND;

  const goToLogin = () => {
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const formErrors: { [key: string]: string } = {};
  
    if (!credentials.nombres.trim()) formErrors.nombres = "El nombre es obligatorio.";
    if (!credentials.apellidos.trim()) formErrors.apellidos = "El apellido es obligatorio.";
    if (!credentials.username.trim()) formErrors.username = "El nombre de usuario es obligatorio.";
    if (!credentials.password) formErrors.password = "La contraseña es obligatoria.";
    else if (credentials.password.length < 6) formErrors.password = "La contraseña debe tener al menos 6 caracteres.";
  
    if (!credentials.confirmPassword) formErrors.confirmPassword = "Debes confirmar tu contraseña.";
    else if (credentials.password !== credentials.confirmPassword) formErrors.confirmPassword = "Las contraseñas no coinciden.";
  
    setErrors(formErrors);
  
    if (Object.keys(formErrors).length > 0) {
      showErrorAlert(
        "Error en el formulario",
        "<b>Corrige los errores antes de continuar:</b><br>" +
          Object.values(formErrors).map((err) => `- ${err}`).join("<br>")
      );
      return;
    }
  
    try {
      // 1️⃣ Verificar si el usuario ya está en uso
      const checkResponse = await fetch(`${API_URL}/register/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: credentials.username }),
      });
  
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.message || "Error al verificar usuario");
  
      if (checkData.exists) {
        showErrorAlert("Registro no disponible", "El nombre de usuario ya está en uso.");
        return;
      }
  
      // 2️⃣ Generar secreto OTP y mostrar al usuario
      generateOtpSecret();
  
    } catch (error: any) {
      showErrorAlert("Error en la validación", error.message || "Ocurrió un problema al verificar el usuario.");
    }
  };

  const generateOtpSecret = async () => {
    try {
      showLoading("Generando código QR...");
  
      const response = await fetch(`${API_URL}/register/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: credentials.username }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al generar código OTP");
      
      setOtpSecret(data.secret);
  
      // Crear contenedor para mostrar el código QR y las instrucciones
      const qrContainer = document.createElement("div");
      qrContainer.className = "flex flex-col items-center p-2";
      
      const descElement = document.createElement("p");
      descElement.className = "text-sm text-center mb-3";
      descElement.innerHTML = "Escanea este código QR con tu aplicación de autenticador<br>(Google Authenticator, Microsoft Authenticator, Authy, etc.)";
      
      // Imagen del QR
      const qrImage = document.createElement("img");
      qrImage.src = data.qrCode;
      qrImage.alt = "Código QR para autenticación";
      qrImage.className = "w-44 h-44 mx-auto mb-2";
      
      // Código secreto (por si quieren ingresarlo manualmente)
      const secretElement = document.createElement("div");
      secretElement.className = "text-xs text-center mb-3 p-2 bg-gray-100 rounded-md";
      secretElement.innerHTML = `<span class="font-bold">Código secreto:</span><br>${data.secret}`;
      
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
        input.className = "w-10 h-12 text-center border border-gray-300 rounded-md text-lg font-bold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white text-black";
        input.inputMode = "numeric";
        input.pattern = "[0-9]";
        
        // Agregar event listeners
        input.addEventListener("input", handleInputChange(i));
        input.addEventListener("keydown", handleKeyDown(i));
        
        inputContainer.appendChild(input);
      }
      
      // Agregar todos los elementos al contenedor principal
      qrContainer.appendChild(descElement);
      qrContainer.appendChild(qrImage);
      qrContainer.appendChild(secretElement);
      qrContainer.appendChild(inputContainer);
  
      // Mostrar modal con el QR y el input para el código
      await showCustomWarningAlert(
        "Configura tu Autenticador",
        qrContainer,
        [
          { 
            text: "Verificar Código", 
            color: "#28a745", 
            callback: () => {
              // Recopilar los valores de los 6 inputs para formar el código completo
              let code = "";
              for (let i = 0; i < 6; i++) {
                const inputElement = document.getElementById(`otp-input-${i}`) as HTMLInputElement;
                code += inputElement.value || ""; // Agregamos el "" en caso de que el input esté vacío
              }
              verifyOtpCode(code, data.secret);
            } 
          },
          { 
            text: "Cancelar", 
            color: "#ff4f4f",
            callback: () => {
              // Función de cancelación
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
      showErrorAlert("Error en la generación OTP", error.message || "Ocurrió un problema al generar el código OTP.");
    }
  };
  
  const verifyOtpCode = async (code: string, secret: string) => {
    if (!code?.trim()) {
      showErrorAlert("Código requerido", "Por favor, ingresa el código de verificación.");
      return;
    }
  
    try {
      const verifyResponse = await fetch(`${API_URL}/register/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, secret }),
      });
  
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.message || "Código incorrecto");
  
      // Si la verificación es exitosa, registrar con OTP
      registerUser(secret);
  
    } catch (error: any) {
      showErrorAlert("Error en verificación", error.message || "Ocurrió un problema al verificar el código.");
    }
  };

  const registerUser = async (verifiedSecret: string | null) => {
    try {
      const registerData = {
        nombres: credentials.nombres,
        apellidos: credentials.apellidos,
        username: credentials.username,
        password: credentials.password,
        otpSecret: verifiedSecret // Puede ser null si el usuario omitió la verificación
      };
      
      const registerResponse = await fetch(`${API_URL}/register/createUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
  
      const responseData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(responseData.message || "Error en el registro");
  
      showSuccessAlert(
        "Registro exitoso", 
        verifiedSecret 
          ? "Tu cuenta ha sido creada con éxito." 
          : "Tu cuenta ha sido creada con éxito."
      );
  
      // Limpiar todos los campos del formulario
      setCredentials({
        nombres: "",
        apellidos: "",
        username: "",
        password: "",
        confirmPassword: ""
      });
      setOtpSecret(null);
  
      // Redirigir al usuario al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
  
    } catch (error: any) {
      showErrorAlert("Error en el registro", error.message || "Ocurrió un problema al registrar el usuario.");
    }
  };

  return (
    <BackgroundGradient>
      <div className="w-full max-w-[600px] px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="w-full flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-2xl flex items-center justify-center">
              <CircleUserRound className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Crear cuenta</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Fila: Nombres y Apellidos */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Campo de nombres */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <UserRound className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                  placeholder="Nombres"
                  value={credentials.nombres}
                  onChange={(e) => setCredentials({ ...credentials, nombres: e.target.value })}
                />
              </div>

              {/* Campo de apellidos */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <UserRound className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                  placeholder="Apellidos"
                  value={credentials.apellidos}
                  onChange={(e) => setCredentials({ ...credentials, apellidos: e.target.value })}
                />
              </div>
            </div>

            {/* Campo de nombre de usuario */}
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

            {/* Fila: Contraseña y Confirmar contraseña */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Campo de contraseña */}
              <div className="relative flex-1">
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
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                </button>
              </div>

              {/* Campo de confirmar contraseña */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                  placeholder="Confirmar contraseña"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none border-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            </div>

            {/* Botón de registrarse */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2 mt-2">
              <button 
                type="submit" 
                className="bg-green-600 text-white py-3 w-full rounded-lg flex items-center justify-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>Registrarse</span>
              </button>
            </div>
            
            {/* Texto de redirección a login */}
            <div className="text-center text-sm text-gray-600 mt-2 sm:mt-4">
              <span>¿Ya tienes una cuenta? </span>
              <button
                type="button"
                className="text-blue-600 hover:underline focus:outline-none border-none"
                onClick={goToLogin}
              >
                Iniciar sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </BackgroundGradient>
  );
};

export default RegisterPage;