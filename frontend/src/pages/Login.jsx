import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null); // ✅ useRef for Google button
 const innerBtnRef = useRef(null);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      nav("/");
    } catch (e) {
      setError("Invalid credentials");
    }
  };

  // Handle Google credential response
  const handleGoogleLogin = async (res) => {
    if (!res.credential) return console.error("No credential returned from Google");

    try {
      const data = await loginWithGoogle(res.credential);
      console.log("Backend response:", data);
      nav("/");
    } catch (err) {
      console.error("Login with Google failed:", err);
      setError("Google login failed");
    }
  };

  useEffect(() => {
    /* global google */
    if (!window.google || !googleBtnRef.current) return;

    // Initialize Google client
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
   theme: "outline",       // "outline" | "filled_blue" | "filled_black"
  size: "large",          // "small" | "medium" | "large"
  width: "100%",
    });
    const innerDiv = googleBtnRef.current.querySelector("div[role='button']");
    if (innerDiv) {
      innerBtnRef.current = innerDiv;
      // Remove inner hover/background
      innerDiv.style.background = "transparent";
      innerDiv.style.width = "100%"; // optional
    };
  }, []);

  
  const handleOuterClick = () => {
    // Trigger inner SDK div click
    if (innerBtnRef.current) innerBtnRef.current.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wide uppercase">
          Sign In
        </h1>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {/* Google Login Button */}
        
    <div
      onClick={handleOuterClick}
      className="w-full flex items-center justify-center gap-2 border border-black rounded hover:bg-gray-100 transition cursor-pointer p-2"
    >
      <img src="/images/icons8-google-logo-100.png" className="w-5 h-5 filter saturate-[8.5]" alt="Google" />
      <span>Sign in with Google</span>
      {/* Google SDK button rendered here */}
      <div ref={googleBtnRef} className="absolute opacity-0 pointer-events-none"></div>
    </div>
        <div className="flex items-center mb-6">
          <span className="flex-grow border-t border-gray-300"></span>
          <span className="mx-3 text-gray-500 font-semibold uppercase">or</span>
          <span className="flex-grow border-t border-gray-300"></span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder=" "
              className="peer w-full px-3 pt-4 pb-2 border border-black focus:outline-none focus:border-black text-black"
              required
            />
            <label
              className={`absolute left-3 text-gray-500 text-sm transition-all
                ${form.email ? "-top-3 text-black text-sm" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3 peer-focus:text-black peer-focus:text-sm"}`}
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder=" "
              className="peer w-full px-3 pt-4 pb-2 border border-black focus:outline-none focus:border-black text-black"
              required
            />
            <label
              className={`absolute left-3 text-gray-500 text-sm transition-all
                ${form.password ? "-top-3 text-black text-sm" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3 peer-focus:text-black peer-focus:text-sm"}`}
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black text-white font-bold uppercase hover:bg-gray-900 transition"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          No account?{" "}
          <Link to="/register" className="font-bold text-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
