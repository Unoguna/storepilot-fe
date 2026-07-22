"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { RequestState } from "@/types/store-pilot";

export function PasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = searchParams.get("token") ?? "";
    if (!token) {
      setStatus("error");
      setMessage("비밀번호 재설정 토큰이 없습니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setStatus("error");
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setStatus("uploading");
    setMessage("비밀번호를 변경하는 중입니다...");

    try {
      const body = await resetPassword(token, password, passwordConfirm);
      setStatus("success");
      setMessage(body.message ?? "비밀번호가 변경되었습니다.");
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "비밀번호 변경 중 오류가 발생했습니다.");
    }
  }

  const busy = status === "uploading";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f6] px-4 text-[#172126]">
      <section className="grid w-full max-w-md gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot</p>
          <h1 className="text-2xl font-black tracking-normal">비밀번호 재설정</h1>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            새 비밀번호
            <input
              autoComplete="new-password"
              className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              placeholder="8자 이상"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            새 비밀번호 확인
            <input
              autoComplete="new-password"
              className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              placeholder="비밀번호를 다시 입력"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </label>

          <button
            className="h-11 w-fit rounded-md bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
            disabled={busy}
            type="submit"
          >
            {busy ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>

        {message && (
          <p className={`text-sm font-bold ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
            {message}
          </p>
        )}

        <button
          className="h-11 w-fit rounded-md border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-700 transition hover:border-teal-700 hover:text-teal-800"
          onClick={() => router.push("/")}
          type="button"
        >
          로그인으로 이동
        </button>
      </section>
    </main>
  );
}
