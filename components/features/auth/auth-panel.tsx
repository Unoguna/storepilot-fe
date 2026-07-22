"use client";

import { FormEvent, useState } from "react";
import { login, requestPasswordReset, resendVerificationEmail, signup } from "@/lib/api";
import { AuthUser, RequestState } from "@/types/store-pilot";

type AuthMode = "login" | "signup" | "password-reset";

export function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage(
      mode === "login"
        ? "로그인하는 중입니다..."
        : mode === "signup"
          ? "계정을 만드는 중입니다..."
          : "비밀번호 재설정 메일을 보내는 중입니다..."
    );

    try {
      if (mode === "password-reset") {
        const body = await requestPasswordReset(passwordResetEmail.trim());
        setStatus("success");
        setMessage(body.message ?? "비밀번호 재설정 메일을 확인해주세요.");
        return;
      }

      if (mode === "signup" && signupPassword !== signupPasswordConfirm) {
        throw new Error("비밀번호 확인이 일치하지 않습니다.");
      }
      const body =
        mode === "login"
          ? await login(loginEmail.trim(), loginPassword)
          : await signup(signupEmail.trim(), signupPassword, signupPasswordConfirm);
      if (!body.data) {
        setStatus("success");
        setMessage(body.message ?? "인증 메일을 확인해주세요.");
        if (mode === "signup") {
          setSignupPassword("");
          setSignupPasswordConfirm("");
          setVerificationEmailSent(true);
        }
        return;
      }
      setStatus("success");
      setMessage(body.message ?? "로그인되었습니다.");
      onAuthenticated(body.data.user);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다.");
    }
  }

  async function handleResendVerificationEmail() {
    setStatus("uploading");
    setMessage("인증 메일을 다시 보내는 중입니다...");

    try {
      const body = await resendVerificationEmail(signupEmail.trim());
      setStatus("success");
      setMessage(body.message ?? "인증 메일을 다시 보냈습니다.");
      setVerificationEmailSent(true);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "인증 메일 재전송 중 오류가 발생했습니다.");
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus("idle");
    setMessage("");
    setVerificationEmailSent(false);
  }

  const busy = status === "uploading";
  const currentEmail = mode === "login" ? loginEmail : mode === "signup" ? signupEmail : passwordResetEmail;
  const currentPassword = mode === "login" ? loginPassword : signupPassword;
  const title = mode === "signup" ? "회원가입" : mode === "password-reset" ? "비밀번호 찾기" : "로그인";

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md content-center gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot</p>
          <h1 className="text-3xl font-black leading-tight tracking-normal">{title}</h1>
        </div>

        <div className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {mode !== "password-reset" && (
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
          )}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              이메일
              <input
                autoComplete="email"
                className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                placeholder="you@example.com"
                type="email"
                value={currentEmail}
                onChange={(event) => {
                  if (mode === "login") {
                    setLoginEmail(event.target.value);
                  } else if (mode === "signup") {
                    setSignupEmail(event.target.value);
                  } else {
                    setPasswordResetEmail(event.target.value);
                  }
                  setVerificationEmailSent(false);
                }}
              />
            </label>

            {mode !== "password-reset" && (
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                비밀번호
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  placeholder="8자 이상"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    if (mode === "login") {
                      setLoginPassword(event.target.value);
                    } else {
                      setSignupPassword(event.target.value);
                      setVerificationEmailSent(false);
                    }
                  }}
                />
              </label>
            )}

            {mode === "signup" && (
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                비밀번호 확인
                <input
                  autoComplete="new-password"
                  className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  placeholder="비밀번호를 다시 입력"
                  type="password"
                  value={signupPasswordConfirm}
                  onChange={(event) => {
                    setSignupPasswordConfirm(event.target.value);
                    setVerificationEmailSent(false);
                  }}
                />
              </label>
            )}

            <button
              className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
              disabled={busy}
              type="submit"
            >
              {busy ? "처리 중..." : mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "재설정 메일 보내기"}
            </button>

            {mode === "login" && (
              <button
                className="h-10 w-fit text-sm font-extrabold text-slate-600 transition hover:text-teal-800"
                onClick={() => switchMode("password-reset")}
                type="button"
              >
                비밀번호 찾기
              </button>
            )}

            {mode === "password-reset" && (
              <button
                className="h-10 w-fit text-sm font-extrabold text-slate-600 transition hover:text-teal-800"
                onClick={() => switchMode("login")}
                type="button"
              >
                로그인으로 돌아가기
              </button>
            )}

            {mode === "signup" && verificationEmailSent && (
              <button
                className="h-11 w-fit rounded-md border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-wait disabled:border-slate-200 disabled:text-slate-400"
                disabled={busy || signupEmail.trim().length === 0}
                onClick={handleResendVerificationEmail}
                type="button"
              >
                인증메일 재전송
              </button>
            )}
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
