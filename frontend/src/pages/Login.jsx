import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null);
  const innerBtnRef = useRef(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    }
  };

  const handleGoogleLogin = async (res) => {
    if (!res?.credential) return;
    try {
      await loginWithGoogle(res.credential);
      navigate("/");
      toast.success("Logged in with Google");
    } catch {
      setError("Google login failed");
    }
  };

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
    });

    const inner = googleBtnRef.current.querySelector("div[role='button']");
    if (inner) {
      innerBtnRef.current = inner;
      inner.style.background = "transparent";
      inner.style.width = "100%";
    }
  }, []);

  const handleOuterClick = () => {
    if (innerBtnRef.current) innerBtnRef.current.click();
  };

  // Autofill fix
  useEffect(() => {
    const inputs = document.querySelectorAll(".auto-floating input");
    const updateFilledState = () => {
      inputs.forEach((input) => {
        if (input.value.trim() !== "") input.dataset.filled = "true";
        else delete input.dataset.filled;
      });
    };
    updateFilledState();

    const observer = new MutationObserver(updateFilledState);
    inputs.forEach((input) => {
      observer.observe(input, { attributes: true, attributeFilter: ["value"] });
      input.addEventListener("input", updateFilledState);
    });

    const timeout = setTimeout(updateFilledState, 500);
    return () => {
      observer.disconnect();
      inputs.forEach((input) =>
        input.removeEventListener("input", updateFilledState)
      );
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-black/5 rounded-2xl shadow-sm px-8 py-10">
          {/* Title */}
          <h1 className="text-[26px] font-semibold mb-2 text-center tracking-[0.2em] uppercase text-black">
            Sign In
          </h1>
          <p className="text-xs text-center text-gray-500 mb-6">
            Enter your details to access your account
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Google Login */}
          <div className="mb-6">
            <div
              onClick={handleOuterClick}
              className="w-full flex items-center justify-center gap-2 border border-black rounded-full cursor-pointer py-2.5 px-4 relative
                         bg-white hover:bg-black hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              <img
                src="/images/icons8-google-logo-100.png"
                className="w-4 h-4 filter saturate-[8.5]"
                alt="Google"
              />
              <span className="tracking-wide">Sign in with Google</span>
              <div
                ref={googleBtnRef}
                className="absolute opacity-0 pointer-events-none inset-0"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="mx-3 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.25em]">
              or continue with
            </span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="relative auto-floating">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder=" "
                autoComplete="new-email"
                className="peer w-full border border-black/15 rounded-xl px-3.5 pt-5 pb-2.5 bg-white text-sm text-black 
                           focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition 
                           autofill:bg-white"
              />
              <label
                className={`absolute left-3.5 text-[13px] text-gray-500 transition-all duration-200 pointer-events-none
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-[14px]
                peer-focus:-top-1.5 peer-focus:text-[11px] peer-focus:text-black peer-focus:tracking-wide
                ${form.email ? "-top-1.5 text-[11px] text-black tracking-wide" : ""}`}
              >
                Email
              </label>
            </div>

            {/* Password */}
            <div className="relative auto-floating">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder=" "
                autoComplete="new-password"
                className="peer w-full border border-black/15 rounded-xl px-3.5 pt-5 pb-2.5 bg-white text-sm text-black 
                           focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition 
                           autofill:bg-white"
              />
              <label
                className={`absolute left-3.5 text-[13px] text-gray-500 transition-all duration-200 pointer-events-none
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-[14px]
                peer-focus:-top-1.5 peer-focus:text-[11px] peer-focus:text-black peer-focus:tracking-wide
                ${form.password ? "-top-1.5 text-[11px] text-black tracking-wide" : ""}`}
              >
                Password
              </label>
            </div>

            <button
              className="w-full py-3.5 bg-black text-white text-sm font-semibold uppercase tracking-[0.25em]
                         rounded-full hover:bg-white hover:text-black hover:border hover:border-black 
                         transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-gray-500 text-xs">
            No account?
            <Link
              className="font-semibold text-black underline underline-offset-4 ml-1"
              to="/register"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
