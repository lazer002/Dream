"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import toast from "react-hot-toast";
import { loadGoogleScript } from "../utils/loader.js";

export default function Signup() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const innerBtnRef = useRef(null);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await register(
        form.name,
        form.email,
        form.password
      );

      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (res) => {
    if (!res?.credential) return;

    try {
      setLoading(true);
      setError("");

      await loginWithGoogle(res.credential);

      toast.success("Signed up with Google");
      navigate("/");
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Google signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = async () => {
      const loaded = await loadGoogleScript();

      if (!loaded || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id:
          import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(
        googleBtnRef.current,
        {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signup_with",
          shape: "pill",
        }
      );

      const inner =
        googleBtnRef.current.querySelector(
          "div[role='button']"
        );

      if (inner) {
        innerBtnRef.current = inner;
        inner.style.width = "100%";
      }
    };

    initGoogle();
  }, []);

  const handleGoogleClick = () => {
    innerBtnRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[1100px]">

        <div className="grid overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.10)] lg:grid-cols-2">

          {/* LEFT IMAGE */}
          <div className="relative hidden min-h-[720px] overflow-hidden bg-black lg:block">
            <img
              src="/images/4.avif"
              alt="Fashion"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="absolute bottom-12 left-12 right-12 text-white">
              <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-white/60">
                Join us
              </p>

              <h2 className="text-5xl font-semibold leading-[1.05]">
                Your style.
                <br />
                Your account.
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">
                Create your account and discover
                everything waiting for you.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex min-h-[720px] items-center px-7 py-12 sm:px-14 lg:px-16">
            <div className="mx-auto w-full max-w-[420px]">

              {/* LOGO */}
              <div className="mb-14 text-center">
                <Link
                  to="/"
                  className="text-2xl font-bold tracking-[0.35em] text-black"
                >
                  YOUR BRAND
                </Link>
              </div>

              {/* HEADER */}
              <div className="mb-9">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Account
                </p>

                <h1 className="text-4xl font-semibold tracking-tight text-black">
                  Create account
                </h1>

                <p className="mt-3 text-sm text-gray-500">
                  Join us and start shopping.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NAME */}
                <div className=" border-b">
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="h-[52px] w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* EMAIL */}
                <div className=" border-b">
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-[52px] w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* PASSWORD */}
                <div className=" border-b">
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="h-[52px] w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-[54px] w-full rounded-full bg-black text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black hover:ring-1 hover:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Creating..."
                    : "Create Account"}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                  Or
                </span>

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                className="relative flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-black bg-white text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                <img
                  src="/images/icons8-google-logo-100.png"
                  alt="Google"
                  className="h-5 w-5"
                />

                <span>
                  Continue with Google
                </span>

                <div
                  ref={googleBtnRef}
                  className="pointer-events-none absolute inset-0 opacity-0"
                />
              </button>

              {/* LOGIN */}
              <p className="mt-9 text-center text-xs text-gray-500">
                Already have an account?

                <Link
                  to="/login"
                  className="ml-2 font-semibold text-black underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>

              {/* BACK */}
              <div className="mt-7 text-center">
                <Link
                  to="/"
                  className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 hover:text-black"
                >
                  Back to store
                </Link>
              </div>

            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[9px] uppercase tracking-[0.3em] text-gray-400">
          Secure authentication
        </p>
      </div>
    </div>
  );
}