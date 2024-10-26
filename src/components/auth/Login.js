"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast, ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "@/utlis/firebase";
import { useAuth } from "@/utlis/context/AuthContext";
import { User, EyeOff, Eye } from "lucide-react";
import Image from "next/image";
import image from "@/components/assets/login/login.png";
import "@/components/styles/login.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.warn("Akun tidak terdaftar. Silakan periksa email Anda.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Flip,
        });
      } else if (error.code === "auth/wrong-password") {
        toast.warn("Kata sandi salah. Silakan coba lagi.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Flip,
        });
      } else if (error.code === "auth/invalid-email") {
        toast.warn("Format email tidak valid. Periksa kembali email Anda.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Flip,
        });
      } else {
        toast.warn("Terjadi kesalahan saat login. Silakan coba lagi.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Flip,
        });
      }
    } finally {
      setLoading(false);
      setEmail("");
      setPassword("");
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.warn("Masukan email untuk mereset password.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Flip,
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.warn(
        "Pesan reset ulang kata sandi telah terkirim. Periksa email Anda.",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Flip,
        }
      );
      setTimeout(() => {
        setIsResetPassword(false);
        router.push("/login");
      }, 2000);
    } catch (error) {
      toast.warn(`Password reset error: ${error.message}`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Flip,
      });
    }
  };

  return (
    <section className="login">
      <div className="login__container container grid">
        <div className="content">
          <div className="img">
            <Image src={image} quality={100} alt="image-login" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form__box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <User size={40} />
            </div>
            {!isResetPassword && (
              <div className="form__box">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button"
                >
                  {showPassword ? <Eye size={40} /> : <EyeOff size={40} />}
                </div>
              </div>
            )}
            <div className="btn">
              {!isResetPassword ? (
                <button type="submit" className="login__btn" disabled={loading}>
                  {loading ? "Loading..." : "Login"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="reset__btn"
                  disabled={loading}
                >
                  Lupa Password
                </button>
              )}
            </div>
            <div className="forgot-password">
              <div
                className="link"
                onClick={() => setIsResetPassword(!isResetPassword)}
              >
                {isResetPassword ? "Kembali Login" : "Lupa Password?"}
              </div>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        limit={1}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        theme="light"
        transition={Flip}
      />
    </section>
  );
}
