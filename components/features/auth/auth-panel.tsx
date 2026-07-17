"use client";

import { FormEvent, useState } from "react";
import { login, signup } from "@/lib/api";
import { AuthUser, RequestState } from "@/types/store-pilot";

type AuthMode = "login" | "signup";

export function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage(mode === "login" ? "로그인하는 중입니다..." : "계정을 만드는 중입니다...");

    try {
      if (mode === "signup" && password !== passwordConfirm) {
        throw new Error("비밀번호 확인이 일치하지 않습니다.");
      }
      const body =
        mode === "login"
          ? await login(email.trim(), password)
          : await signup(email.trim(), password, passwordConfirm);
      if (!body.data) {
        throw new Error(body.message ?? "인증 응답을 확인하지 못했습니다.");
      }
      setStatus("success");
      setMessage(body.message ?? "로그인되었습니다.");
      onAuthenticated(body.data.user);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다.");
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPasswordConfirm("");
    setStatus("idle");
    setMessage("");
  }

  const busy = status === "uploading";

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md content-center gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot</p>
          <h1 className="text-3xl font-black leading-tight tracking-normal">로그인</h1>
        </div>

        <div className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
            <button
              className={`h-10 rounded-md text-sm font-extrabold transition ${
                mode === "login" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => switchMode("login")}
              type="button"
            >
              로그인
            </button>
            <button
              className={`h-10 rounded-md text-sm font-extrabold transition ${
                mode === "signup" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => switchMode("signup")}
              type="button"
            >
              회원가입
            </button>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              이메일
              <input
                autoComplete="email"
                className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              비밀번호
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                placeholder="8자 이상"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {mode === "signup" && (
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                비밀번호 확인
                <input
                  autoComplete="new-password"
                  className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  placeholder="비밀번호를 다시 입력"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </label>
            )}

            <button
              className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
              disabled={busy}
              type="submit"
            >
              {busy ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>

          {message && (
            <p className={`text-sm font-semibold ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
