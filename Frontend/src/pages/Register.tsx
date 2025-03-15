import React, { useState } from "react";
import { User, Mail, Lock, LogIn, Eye, EyeOff, CircleUserRound, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackgroundGradient from "../components/BackgroundGradient";
import { showSuccessAlert,  showErrorAlert, showCustomWarningAlert} from "../components/AlertService";
import { showLoading } from "../components/loadingService";

const RegisterPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_URL_BACKEND;

  const goToLogin = () => {
    navigate('/login');
  };

  // Modificación en handleSubmit para utilizar showCustomWarningAlert
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const formErrors: { [key: string]: string } = {};
  
    if (!credentials.nombres.trim()) formErrors.nombres = "El nombre es obligatorio.";
    if (!credentials.apellidos.trim()) formErrors.apellidos = "El apellido es obligatorio.";
    if (!credentials.email.trim()) {
      formErrors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      formErrors.email = "Ingrese un correo válido.";
    }
  
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
      // 1️⃣ Verificar si el usuario y/o correo ya están en uso antes de enviar código
      const checkResponse = await fetch(`${API_URL}/register/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email, username: credentials.username }),
      });
  
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.message || "Error al verificar usuario/correo");
  
      if (checkData.exists) {
        let errorMessage = "<b>No se pudo completar el registro debido a:</b><br>";
  
        if (checkData.emailExists) errorMessage += "- El correo ya está en uso.<br>";
        if (checkData.usernameExists) errorMessage += "- El usuario ya está en uso.<br>";
  
        showErrorAlert("Registro no disponible", errorMessage);
        return;
      }
  
      sendVerificationCode();
  
    } catch (error: any) {
      showErrorAlert("Error en la validación", error.message || "Ocurrió un problema al verificar el usuario/correo.");
    }
  };

  const sendVerificationCode = async () => {
    try {
      showLoading("Cargando...");
  
      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email, username: credentials.username }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al enviar código de verificación");
  
      // ✅ Mostrar alerta con input para ingresar el código
      const inputContainer = document.createElement("div");
      inputContainer.className = "mt-3 text-center flex flex-col items-center";
  
      const codeInput = document.createElement("input");
      codeInput.id = "verification-code";
      codeInput.type = "text";
      codeInput.className = "block pl-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none mx-auto w-3/4 max-w-xs";
      codeInput.placeholder = "Código de verificación";
  
      const textElement = document.createElement("div");
      textElement.innerHTML = `Se ha enviado un código a <b>${credentials.email}</b>. Ingresa el código para continuar.`;
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
              confirmVerification(code);
            } 
          },
          { text: "Cancelar", color: "#dc3545" }
        ]
      );
  
    } catch (error: any) {
      showErrorAlert("Error en el envío", error.message || "Ocurrió un problema al enviar el código.");
    }
  };
  
  const confirmVerification = async (codigoIngresado: string) => {
    if (!codigoIngresado?.trim()) {
      showErrorAlert("Código requerido", "Por favor, ingresa el código de verificación.");
      return;
    }
  
    try {
      const verifyResponse = await fetch(`${API_URL}/register/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email, code: codigoIngresado }),
      });
  
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.message || "Código incorrecto");
  
      await registerUser();
  
    } catch (error: any) {
      showErrorAlert("Error en verificación", error.message || "Ocurrió un problema al verificar el código.");
    }
  };

  const registerUser = async () => {
    try {
      const registerResponse = await fetch(`${API_URL}/register/createUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials), // Enviamos los datos sin encriptar (el backend los encripta)
      });
  
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData.message || "Error en el registro");
  
      showSuccessAlert("Registro exitoso", "Tu cuenta ha sido creada con éxito.");
  
      // ✅ Limpiar todos los campos del formulario
      setCredentials({
        nombres: "",
        apellidos: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
      });
  
      // ✅ Redirigir al usuario al login después de 2 segundos
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

            {/* Fila: Correo y Usuario */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Campo de correo electrónico */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                  placeholder="Correo electrónico"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>

              {/* Campo de nombre de usuario */}
              <div className="relative flex-1">
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

            {/* Botón de registrarse (solo uno) */}
            <div className="mt-4 sm:mt-6">
              <button 
                type="submit" 
                className="bg-green-600 text-white py-3 w-full rounded-lg flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Registrarse</span>
              </button>
            </div>
            
            {/* Texto de redirección a login (funcional) */}
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