import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      // nav("/");
    } catch (e) {
      setError("Invalid credentials");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      nav("/");
    } catch (e) {
      setError("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wide uppercase">
          Sign In
        </h1>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {/* Google Login */}
 <button
  onClick={handleGoogleLogin}
  className="w-full flex items-center justify-center gap-2 py-3 mb-6 border border-black font-bold uppercase hover:bg-gray-100 transition"
>
  <img src="/images/icons8-google-logo-100.png" alt="Google" className="w-5 h-5" />
  Sign in with Google
</button>

        <div className="flex items-center mb-6">
          <span className="flex-grow border-t border-gray-300"></span>
          <span className="mx-3 text-gray-500 font-semibold uppercase">or</span>
          <span className="flex-grow border-t border-gray-300"></span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
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

          {/* Password */}
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



