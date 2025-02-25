import React, { useState } from "react";
import { User, Lock, LogIn, Eye, EyeOff, CircleUserRound } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import BackgroundGradient from "../components/BackgroundGradient";
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      Swal.fire({ icon: "warning", title: "⚠️ Campos vacíos", text: "Por favor, complete todos los campos." });
      return;
    }

    try {
      let email = credentials.username;

      if (!credentials.username.includes("@")) {
        const q = query(collection(db, "users"), where("username", "==", credentials.username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Swal.fire({ icon: "error", title: "❌ Error", text: "Usuario no encontrado." });
          return;
        }

        email = querySnapshot.docs[0].data().email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      Swal.fire({ icon: "success", title: "✅ Bienvenido!", text: "Inicio de sesión exitoso" }).then(() => {
        localStorage.setItem("user", JSON.stringify(userCredential.user));
        navigate("/");
      });

    } catch (error: any) {
      Swal.fire({ icon: "error", title: "❌ Error", text: "Usuario o contraseña incorrectos." });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      Swal.fire({ icon: "success", title: "✅ Bienvenido!", text: "Inicio de sesión con Google exitoso" }).then(() => {
        localStorage.setItem("user", JSON.stringify(result.user));
        navigate("/");
      });
    } catch (error: any) {}
  };

  return (
    <BackgroundGradient>
      <div className="w-[450px] p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6">
          <div className="w-full flex justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
              <CircleUserRound className="h-16 w-16 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex items-center space-x-2">
              {/* Botón de Ingresar */}
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 flex-grow rounded-lg flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Ingresar</span>
              </button>

              {/* Botón de Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="bg-white text-white py-3 px-5 rounded-lg flex items-center justify-center border border-black"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
              </button>
            </div>

            {/* Enlaces de registro y recuperación */}
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="hover:underline"
              >
                Registrarse
              </button>
              <button
                type="button"
                onClick={() => Swal.fire("Funcionalidad en desarrollo", "Próximamente podrás recuperar tu contraseña", "info")}
                className="hover:underline"
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
