import React, { useState } from "react";
import { User, Mail, Lock, LogIn, Eye, EyeOff, CircleUserRound } from "lucide-react";
import Swal from "sweetalert2";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BackgroundGradient from "../components/BackgroundGradient";

const RegisterPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const traducirErrorFirebase = (errorCode: string) => {
    const errores: { [key: string]: string } = {
      "auth/email-already-in-use": "El correo electrónico ya está registrado.",
      "auth/invalid-email": "El formato del correo electrónico es inválido.",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
      "auth/user-not-found": "El usuario no existe. Verifica los datos ingresados.",
      "auth/wrong-password": "La contraseña es incorrecta.",
      "auth/missing-password": "Debes ingresar una contraseña.",
      "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
      "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde.",
    };
  
    return errores[errorCode] || "Ocurrió un error inesperado. Inténtalo nuevamente.";
  };
  

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!credentials.username || !credentials.email || !credentials.password) {
      Swal.fire({ icon: "warning", title: "⚠️ Campos vacíos", text: "Por favor, complete todos los campos." });
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;

      // Guardar en Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: credentials.username,
        email: credentials.email,
        createdAt: new Date(),
      });

      Swal.fire({ icon: "success", title: "✅ Registro exitoso!", text: "Ahora puedes iniciar sesión." }).then(() => {
        navigate("/login");
      });
    } catch (error: any) {
        const mensajeError = traducirErrorFirebase(error.code);
        Swal.fire({ icon: "error", title: "Error", text: mensajeError });
      }      
  };

  return (
    <BackgroundGradient>
      <div className="w-[450px] p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6">
          <div className="w-full flex justify-center">
            <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center">
              <CircleUserRound className="h-16 w-16 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
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

            <div className="relative">
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
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
              </button>
            </div>

            <div className="flex flex-col space-y-4 px-12">
              <button type="submit" className="bg-green-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Registrarse</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </BackgroundGradient>
  );



};

export default RegisterPage;
