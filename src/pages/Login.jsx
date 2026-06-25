import { useState } from "react";
import { Building2, Eye, EyeOff, Lock, ShieldCheck, User, KeyRound, Mail, ArrowLeft } from "lucide-react";
import kimsLogo from "../assets/kims-login-logo.png";
import founderCard from "../assets/login-founder-card.png";

import { sites } from "../utils/authConfig";
import { login, changePassword, verifyOtp } from "../lib/api";

export default function Login({ onLogin }) {
  const [site, setSite] = useState(sites[0]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [expiredUser, setExpiredUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forceShowPw, setForceShowPw] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const user = await login(username.trim(), password, site);
      if (user._otpRequired) {
        setOtpEmail(user.email || "");
        setOtpRequired(true);
        return;
      }
      if (user._passwordExpired) {
        setExpiredUser(user);
        return;
      }
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (otpCode.length < 4) {
      setError("Please enter the OTP code sent to your email.");
      return;
    }
    try {
      const user = await verifyOtp(otpCode);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForceChange = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await changePassword(password, newPassword);
      const updatedUser = await login(username.trim(), newPassword, site);
      onLogin(updatedUser);
    } catch (err) {
      setError(err.message);
    }
  };

  if (otpRequired) {
    return (
      <main className="relative h-screen overflow-hidden bg-[#f7fbf8] px-5 py-3 text-gray-900">
        <div className="pointer-events-none absolute -left-36 bottom-0 h-[460px] w-[660px] rounded-[50%] bg-green-100/70" />
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-40 [background-image:radial-gradient(#90d6ae_2px,transparent_2px)] [background-size:14px_14px]" />
        <div className="relative mx-auto flex h-[calc(100vh-24px)] w-full max-w-[500px] flex-col items-center justify-center">
          <div className="mb-4 w-full max-w-[470px] rounded-[22px] bg-[#062b1c] px-7 py-4 shadow-[0_28px_70px_-38px_rgba(6,43,28,0.85)]">
            <img src={kimsLogo} alt="KIMS" className="mx-auto h-auto w-full object-contain" />
          </div>
          <div className="w-full rounded-[22px] border border-green-100/80 bg-white/95 p-8 shadow-[0_34px_90px_-50px_rgba(15,23,42,0.42)]">
            <div className="mb-2 flex items-center justify-center gap-4 text-green-800">
              <span className="h-px w-16 bg-green-700/45" />
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-green-700">
                <Mail size={20} strokeWidth={1.5} />
              </span>
              <span className="h-px w-16 bg-green-700/45" />
            </div>
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Verify OTP</h2>
            <p className="mb-1 text-center text-sm text-gray-600">
              A one-time code has been sent to
            </p>
            <p className="mb-6 text-center text-sm font-semibold text-green-800">{otpEmail}</p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">OTP Code</p>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-13 w-full rounded-xl border border-green-200 bg-white pl-4 pr-4 text-center text-2xl tracking-[8px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="000000"
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
              <button
                type="submit"
                className="flex h-13 w-full items-center justify-center rounded-xl bg-green-800 px-4 text-base font-bold tracking-wide text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Verify & Login
              </button>
              <button
                type="button"
                onClick={() => { setOtpRequired(false); setOtpCode(""); setError(""); }}
                className="flex w-full items-center justify-center gap-2 text-sm text-gray-500 hover:text-green-700 transition"
              >
                <ArrowLeft size={16} strokeWidth={1.5} /> Back to login
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (expiredUser) {
    return (
      <main className="relative h-screen overflow-hidden bg-[#f7fbf8] px-5 py-3 text-gray-900">
        <div className="pointer-events-none absolute -left-36 bottom-0 h-[460px] w-[660px] rounded-[50%] bg-green-100/70" />
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-40 [background-image:radial-gradient(#90d6ae_2px,transparent_2px)] [background-size:14px_14px]" />
        <div className="relative mx-auto flex h-[calc(100vh-24px)] w-full max-w-[500px] flex-col items-center justify-center">
          <div className="mb-4 w-full max-w-[470px] rounded-[22px] bg-[#062b1c] px-7 py-4 shadow-[0_28px_70px_-38px_rgba(6,43,28,0.85)]">
            <img src={kimsLogo} alt="KIMS" className="mx-auto h-auto w-full object-contain" />
          </div>
          <div className="w-full rounded-[22px] border border-green-100/80 bg-white/95 p-8 shadow-[0_34px_90px_-50px_rgba(15,23,42,0.42)]">
            <div className="mb-2 flex items-center justify-center gap-4 text-green-800">
              <span className="h-px w-16 bg-green-700/45" />
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-green-700">
                <KeyRound size={20} strokeWidth={1.5} />
              </span>
              <span className="h-px w-16 bg-green-700/45" />
            </div>
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Password Expired</h2>
            <p className="mb-6 text-center text-sm text-gray-600">Please change your password before continuing.</p>
            <form onSubmit={handleForceChange} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">New Password</p>
                <div className="relative">
                  <input
                    type={forceShowPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-green-200 bg-white pl-4 pr-12 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setForceShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-700"
                  >
                    {forceShowPw ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Confirm New Password</p>
                <input
                  type={forceShowPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-green-200 bg-white pl-4 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="Confirm new password"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
              <button className="flex h-12 w-full items-center justify-center rounded-xl bg-green-800 px-4 text-base font-bold tracking-wide text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900">
                Change Password & Login
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#f7fbf8] px-5 py-3 text-gray-900">
      <div className="pointer-events-none absolute -left-36 bottom-0 h-[460px] w-[660px] rounded-[50%] bg-green-100/70" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-40 [background-image:radial-gradient(#90d6ae_2px,transparent_2px)] [background-size:14px_14px]" />
      <div className="pointer-events-none absolute left-12 top-16 text-5xl font-black text-green-100">+</div>

      <div className="relative mx-auto flex h-[calc(100vh-24px)] w-full max-w-[1320px] flex-col items-center">
        <div className="mb-4 w-full max-w-[470px] rounded-[22px] bg-[#062b1c] px-7 py-4 shadow-[0_28px_70px_-38px_rgba(6,43,28,0.85)]">
          <img src={kimsLogo} alt="KIMS" className="mx-auto h-auto w-full object-contain" />
        </div>

        <section className="relative w-full flex-1 min-h-0 overflow-hidden rounded-[22px] border border-green-100/80 bg-white/95 shadow-[0_34px_90px_-50px_rgba(15,23,42,0.42)] lg:grid lg:grid-cols-[0.42fr_0.58fr]">
          <aside className="relative hidden h-full overflow-hidden bg-[#f0f7f2] lg:flex flex-col items-center justify-end px-6 pb-6 pt-0">
            <div className="pointer-events-none absolute -left-24 top-1/2 -translate-y-[55%] h-[520px] w-[520px] rounded-full bg-[#d6ebd9]" />
            <div className="pointer-events-none absolute left-0 top-0 h-28 w-28 opacity-60 [background-image:radial-gradient(#8fc4a4_2px,transparent_2px)] [background-size:10px_10px]" />
            <div className="pointer-events-none absolute right-4 bottom-28 h-[140px] w-[140px] rounded-full border-[2px] border-[#c0deca]/70" />
            <img
              src={founderCard}
              alt="Dr. Achyuta Samanta"
              className="relative z-10 mb-4 h-[92%] w-auto max-w-full object-contain drop-shadow-sm"
            />
          </aside>

          <div className="relative flex w-full items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#d6ebd9]/60" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full border-[2px] border-[#c0deca]/50" />
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-50 [background-image:radial-gradient(#8fc4a4_2px,transparent_2px)] [background-size:10px_10px]" />

            <form onSubmit={submitLogin} className="relative z-10 mx-auto flex w-full max-w-[520px] flex-col justify-center px-8 py-10 lg:px-14">
              <div className="mb-8 text-center">
                <div className="mb-3 flex items-center justify-center gap-4 text-green-800">
                  <span className="h-px w-24 bg-green-700/45" />
                  <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-green-700">
                    <ShieldCheck size={22} strokeWidth={1.5} />
                  </span>
                  <span className="h-px w-24 bg-green-700/45" />
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-green-800">Secure Login</p>
                <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-gray-900">Hospital Dashboard</h1>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Building2 className="text-green-700" size={18} strokeWidth={1.5} /> Site
                  </span>
                  <select
                    value={site}
                    onChange={(event) => setSite(event.target.value)}
                    className="h-13 w-full rounded-xl border border-green-200 bg-white px-8 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  >
                    {sites.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="relative block">
                  <User className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-green-700" size={21} strokeWidth={1.5} />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-13 w-full rounded-xl border border-green-200 bg-white pl-14 pr-4 text-sm outline-none transition placeholder:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="Username"
                  />
                </label>

                <label className="relative block">
                  <Lock className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-green-700" size={21} strokeWidth={1.5} />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="h-13 w-full rounded-xl border border-green-200 bg-white pl-14 pr-14 text-sm outline-none transition placeholder:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                  </button>
                </label>
              </div>

              {error && (
                <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
              )}

              <button className="mt-8 flex h-13 w-full items-center justify-center rounded-xl bg-green-800 px-4 text-base font-bold tracking-wide text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900">
                LOGIN
              </button>
            </form>
          </div>
        </section>

      </div>
    </main>
  );
}
