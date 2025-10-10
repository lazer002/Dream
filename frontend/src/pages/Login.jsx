import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wide uppercase">
          Sign In
        </h1>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {/* Google Login */}
        <div
          onClick={handleOuterClick}
          className="w-full flex items-center justify-center gap-2 border border-black rounded-lg cursor-pointer p-2 mb-6 relative hover:bg-gray-100 transition"
        >
          <img
            src="/images/icons8-google-logo-100.png"
            className="w-5 h-5 filter saturate-[8.5]"
            alt="Google"
          />
          <span>Sign in with Google</span>
          <div
            ref={googleBtnRef}
            className="absolute opacity-0 pointer-events-none inset-0"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-500 text-xs font-bold uppercase">
            or
          </span>
          <div className="flex-grow h-px bg-gray-300"></div>
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
              className={`peer w-full border border-black rounded px-3 pt-5 pb-2 bg-transparent text-black focus:outline-none focus:border-black autofill:bg-white`}
            />
            <label
              className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
              peer-focus:-top-2 peer-focus:text-sm peer-focus:text-black
              ${form.email ? "-top-2 text-sm text-black" : ""}`}
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
              className={`peer w-full border border-black rounded px-3 pt-5 pb-2 bg-transparent text-black focus:outline-none focus:border-black autofill:bg-white`}
            />
            <label
              className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
              peer-focus:-top-2 peer-focus:text-sm peer-focus:text-black
              ${form.password ? "-top-2 text-sm text-black" : ""}`}
            >
              Password
            </label>
          </div>

          <button className="w-full py-3 bg-black text-white font-bold uppercase rounded-lg hover:bg-gray-900 transition">
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          No account?
          <Link className="font-bold text-black underline ml-1" to="/register">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
