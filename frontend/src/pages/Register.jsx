"use client";
import { useState } from "react";

export default function Signup() {
  const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 48 48"
  >
    <path fill="#4285F4" d="M23.5 12.27v8.27h11.85c-.52 3.06-3.53 8.97-11.85 8.97-7.14 0-12.97-5.88-12.97-13.11S16.36 12.27 23.5 12.27z"/>
    <path fill="#34A853" d="M11.03 24c0 1.55.28 3.03.76 4.41l7.04-5.44c-.18-.52-.28-1.08-.28-1.66s.1-1.14.28-1.66l-7.04-5.44a12.956 12.956 0 0 0-.76 9.79z"/>
    <path fill="#FBBC05" d="M23.5 35.51c-5.08 0-9.4-1.68-12.57-4.57l-7.04 5.44C6.94 42.43 14.86 46 23.5 46c8.33 0 14.34-4.41 17.14-10.67H23.5v.18z"/>
    <path fill="#EA4335" d="M35.64 28.7c-.54 1.47-1.36 2.79-2.4 3.96l7.04 5.44c3.15-3.01 4.97-7.18 4.97-12.1s-1.82-9.08-4.97-12.1l-7.04 5.44c1.04 1.17 1.86 2.49 2.4 3.96z"/>
  </svg>
);

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signup data:", form);
    // Add your API call here
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Implement Google OAuth here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wide uppercase">
          Sign Up
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 mb-6 border border-black font-bold uppercase hover:bg-gray-100 transition"
        >
        <GoogleIcon />
          Sign up with Google
        </button>

        <div className="flex items-center mb-6">
          <span className="flex-grow border-t border-gray-300"></span>
          <span className="mx-3 text-gray-500 font-semibold uppercase">or</span>
          <span className="flex-grow border-t border-gray-300"></span>
        </div>

     <form onSubmit={handleSubmit} className="flex flex-col gap-4">
  {/* Name */}
  <div className="relative">
    <input
      type="text"
      name="name"
      value={form.name}
      onChange={handleChange}
      placeholder=" "
      className="peer w-full px-3 pt-4 pb-2 border border-black focus:outline-none focus:border-black text-black"
      required
    />
    <label
      className={`absolute left-3 text-gray-500 text-sm transition-all
        ${form.name ? "-top-3 text-black text-sm" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3 peer-focus:text-black peer-focus:text-sm"}`}
    >
      Name
    </label>
  </div>

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
    Sign Up
  </button>
</form>


        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <a href="/login" className="font-bold text-black hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
