"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import { RequestState } from "@/types/store-pilot";

export function EmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<RequestState>("uploading");
  const [message, setMessage] = useState("이메일 인증을 확인하는 중입니다...");

  useEffect(() => {
    async function submitVerification() {
      const token = searchParams.get("token") ?? "";
      if (!token) {
        setStatus("error");
        setMessage("이메일 인증 토큰이 없습니다.");
        return;
      }

      try {
        const body = await verifyEmail(token);
        setStatus("success");
        setMessage(body.message ?? "이메일 인증이 완료되었습니다.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "이메일 인증 중 오류가 발생했습니다.");
      }
    }

    submitVerification();
  }, [searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f6] px-4 text-[#172126]">
      <section className="grid w-full max-w-md gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot</p>
          <h1 className="text-2xl font-black tracking-normal">이메일 인증</h1>
        </div>

        <p className={`text-sm font-bold ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
          {message}
        </p>

        <button
          className="h-11 w-fit rounded-md bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800"
          onClick={() => router.push("/")}
          type="button"
        >
          로그인으로 이동
        </button>
      </section>
    </main>
  );
}
