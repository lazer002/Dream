import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import toast from "react-hot-toast";
import { loadGoogleScript } from "../utils/loader.js";
import api from "@/utils/config.js";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const innerBtnRef = useRef(null);

  const from = location.state?.from || "/";

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

      await login(form.email, form.password);

      const me = await api.get("/auth/me");

      if (me.data.user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Invalid email or password"
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

      toast.success("Logged in with Google");
      navigate(from, { replace: true });
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Google login failed"
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
          text: "signin_with",
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

          {/* LEFT */}
          <div className="relative hidden min-h-[720px] overflow-hidden bg-black lg:block">
            <img
              src="/images/3.avif"
              alt="Fashion"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="absolute bottom-12 left-12 right-12 text-white">
              <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-white/60">
                Welcome back
              </p>

              <h2 className="text-5xl font-semibold leading-[1.05]">
                Your style.
                <br />
                Your account.
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">
                Sign in to access your account,
                orders and saved preferences.
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

              {/* TITLE */}
              <div className="mb-9">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Account
                </p>

                <h1 className="text-4xl font-semibold tracking-tight text-black">
                  Sign in
                </h1>

                <p className="mt-3 text-sm text-gray-500">
                  Enter your details to continue.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* EMAIL + PASSWORD */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
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
                    className="h-13 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className=" border-b">
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-13 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-[54px] w-full rounded-full bg-black text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black hover:ring-1 hover:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}
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

                <span>Continue with Google</span>

                <div
                  ref={googleBtnRef}
                  className="pointer-events-none absolute inset-0 opacity-0"
                />
              </button>

              {/* REGISTER */}
              <p className="mt-9 text-center text-xs text-gray-500">
                Don't have an account?
                <Link
                  to="/register"
                  className="ml-2 font-semibold text-black underline underline-offset-4"
                >
                  Create account
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