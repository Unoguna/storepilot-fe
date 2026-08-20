"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { createQnaQuestion } from "@/lib/api";
import { RequestState } from "@/types/store-pilot";

export function QnaQuestionCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage("문의를 등록하는 중입니다...");

    try {
      const body = await createQnaQuestion(title, content);
      const questionId = body.data?.id;
      setStatus("success");

      if (questionId !== undefined) {
        router.push(`/qna/questions/${questionId}`);
        return;
      }

      router.push("/qna");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문의 등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className="grid gap-5 lg:col-span-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-500 transition hover:text-teal-700"
          href="/qna"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          문의 내역으로
        </Link>

        <div className="mt-5 flex items-center gap-2 border-b border-slate-200 pb-5">
          <Send className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-black text-slate-950">문의 등록</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">문의 제목과 내용을 입력해 주세요.</p>
          </div>
        </div>

        {message && (
          <p
            className={`mt-5 rounded-md px-3 py-2 text-sm font-bold ${
              status === "error" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
            }`}
          >
            {message}
          </p>
        )}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            제목
            <input
              className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="문의 제목"
              required
              value={title}
            />
          </label>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            내용
            <textarea
              className="min-h-64 resize-y rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              maxLength={5000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="문의 내용을 입력하세요."
              required
              value={content}
            />
          </label>
          <div className="flex justify-end border-t border-slate-200 pt-5">
            <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
              {status === "uploading" ? "등록 중..." : "문의 등록"}
            </ActionButton>
          </div>
        </form>
      </div>
    </section>
  );
}
