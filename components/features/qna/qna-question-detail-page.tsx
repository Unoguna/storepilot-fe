"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircleQuestion, Trash2 } from "lucide-react";
import {
  answerQnaQuestion,
  deleteQnaQuestion,
  getAdminQnaQuestion,
  getMyQnaQuestion,
} from "@/lib/api";
import { AuthUser, QnaQuestion, RequestState } from "@/types/store-pilot";

type QnaQuestionDetailPageProps = {
  questionId: number;
  user: AuthUser;
};

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function QnaQuestionDetailPage({ questionId, user }: QnaQuestionDetailPageProps) {
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const [question, setQuestion] = useState<QnaQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQuestion() {
      setLoading(true);
      try {
        const body = await (isAdmin ? getAdminQnaQuestion(questionId) : getMyQnaQuestion(questionId));
        if (active) {
          setQuestion(body.data ?? null);
        }
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "문의 내용을 불러오지 못했습니다.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuestion();
    return () => {
      active = false;
    };
  }, [isAdmin, questionId]);

  async function handleAnswerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage("답변을 등록하는 중입니다...");

    try {
      const body = await answerQnaQuestion(questionId, answer);
      setQuestion(body.data ?? null);
      setAnswer("");
      setStatus("success");
      setMessage("답변이 등록되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "답변 등록 중 오류가 발생했습니다.");
    }
  }

  async function handleDelete() {
    if (!question || !window.confirm(`'${question.title}' 문의를 삭제하시겠습니까?`)) {
      return;
    }

    setStatus("uploading");
    setMessage("문의를 삭제하는 중입니다...");
    try {
      await deleteQnaQuestion(question.id);
      router.replace("/qna");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문의 삭제 중 오류가 발생했습니다.");
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

        {loading && <p className="mt-6 text-sm font-bold text-slate-500">문의 내용을 불러오는 중입니다...</p>}

        {!loading && message && (
          <p
            className={`mt-5 rounded-md px-3 py-2 text-sm font-bold ${
              status === "error" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
            }`}
          >
            {message}
          </p>
        )}

        {!loading && question && (
          <article className="mt-5 grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
                  <h2 className="break-words text-xl font-black text-slate-950">{question.title}</h2>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-400">
                  {formatDate(question.createdAt)}
                  {isAdmin && ` · 사용자 #${question.userId}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    question.status === "ANSWERED"
                      ? "bg-teal-50 text-teal-800"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {question.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                </span>
                {!isAdmin && (
                  <button
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-red-200 px-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    disabled={status === "uploading"}
                    onClick={handleDelete}
                    type="button"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    삭제
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-800">문의 내용</h3>
              <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {question.content}
              </p>
            </div>

            {question.answer && (
              <div>
                <h3 className="text-sm font-black text-teal-800">답변 {formatDate(question.answeredAt)}</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-md bg-teal-50 p-4 text-sm leading-6 text-teal-950">
                  {question.answer}
                </p>
              </div>
            )}

            {isAdmin && (
              <form className="grid gap-3 border-t border-slate-200 pt-5" onSubmit={handleAnswerSubmit}>
                <label className="grid gap-2 text-sm font-black text-slate-800">
                  답변 작성
                  <textarea
                    className="min-h-32 resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    maxLength={5000}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="답변 내용을 입력하세요."
                    value={answer}
                  />
                </label>
                <button
                  className="h-10 w-fit cursor-pointer rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
                  disabled={status === "uploading"}
                  type="submit"
                >
                  {status === "uploading" ? "등록 중..." : "답변 등록"}
                </button>
              </form>
            )}
          </article>
        )}

        {!loading && !question && !message && (
          <p className="mt-6 rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">
            문의를 찾을 수 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
