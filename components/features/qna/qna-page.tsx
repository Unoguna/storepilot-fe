"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleHelp, MessageCircleQuestion, Send } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import {
  answerQnaQuestion,
  createQnaQuestion,
  getAdminQnaQuestions,
  getMyQnaQuestions,
  getQnaFaqs,
} from "@/lib/api";
import { AuthUser, QnaFaq, QnaQuestion, RequestState } from "@/types/store-pilot";

type QnaPageProps = {
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

export function QnaPage({ user }: QnaPageProps) {
  const isAdmin = user.role === "ADMIN";
  const [faqs, setFaqs] = useState<QnaFaq[]>([]);
  const [questions, setQuestions] = useState<QnaQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  const waitingCount = useMemo(
    () => questions.filter((question) => question.status === "WAITING").length,
    [questions],
  );

  useEffect(() => {
    loadQna();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadQna() {
    setLoading(true);
    setMessage("");
    try {
      const [faqBody, questionBody] = await Promise.all([
        getQnaFaqs(),
        isAdmin ? getAdminQnaQuestions() : getMyQnaQuestions(),
      ]);
      setFaqs(faqBody.data?.faqs ?? []);
      setQuestions(questionBody.data?.questions ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "QnA 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage("문의를 등록하는 중입니다...");

    try {
      await createQnaQuestion(title, content);
      setTitle("");
      setContent("");
      setStatus("success");
      setMessage("문의가 등록되었습니다.");
      await loadQna();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문의 등록 중 오류가 발생했습니다.");
    }
  }

  async function handleAnswerSubmit(questionId: number) {
    const answer = answerDrafts[questionId] ?? "";
    setStatus("uploading");
    setMessage("답변을 등록하는 중입니다...");

    try {
      await answerQnaQuestion(questionId, answer);
      setAnswerDrafts((drafts) => ({ ...drafts, [questionId]: "" }));
      setStatus("success");
      setMessage("답변이 등록되었습니다.");
      await loadQna();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "답변 등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className="grid gap-5 lg:col-span-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CircleHelp className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
              <h2 className="text-xl font-black tracking-normal text-slate-950">QnA</h2>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">
              FAQ를 확인하고 1:1 문의를 남길 수 있습니다.
            </p>
          </div>
          <div className="rounded-md bg-teal-50 px-3 py-2 text-xs font-black text-teal-900">
            답변 대기 {waitingCount.toLocaleString()}건
          </div>
        </div>

        {message && (
          <p
            className={[
              "mt-4 rounded-md px-3 py-2 text-sm font-bold",
              status === "error" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {message}
          </p>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <section className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CircleHelp className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
              <h3 className="text-lg font-black text-slate-950">FAQ</h3>
            </div>

            <div className="mt-4 grid gap-2">
              {loading && <p className="text-sm font-bold text-slate-500">불러오는 중입니다...</p>}
              {!loading && faqs.length === 0 && (
                <p className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  등록된 FAQ가 없습니다.
                </p>
              )}
              {faqs.map((faq) => (
                <details key={faq.id} className="group rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-extrabold text-slate-800">
                    {faq.question}
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
              <h3 className="text-lg font-black text-slate-950">{isAdmin ? "전체 문의" : "내 문의"}</h3>
            </div>

            <div className="mt-4 grid gap-3">
              {loading && <p className="text-sm font-bold text-slate-500">불러오는 중입니다...</p>}
              {!loading && questions.length === 0 && (
                <p className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  등록된 문의가 없습니다.
                </p>
              )}
              {questions.map((question) => (
                <article key={question.id} className="grid gap-3 rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-black text-slate-950">{question.title}</h4>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {formatDate(question.createdAt)}
                        {isAdmin && ` · 사용자 #${question.userId}`}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-black",
                        question.status === "ANSWERED"
                          ? "bg-teal-50 text-teal-800"
                          : "bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {question.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {question.content}
                  </p>

                  {question.answer && (
                    <div className="rounded-md bg-teal-50 p-3">
                      <p className="text-xs font-black text-teal-700">답변 {formatDate(question.answeredAt)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-teal-950">{question.answer}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <form
                      className="grid gap-2 border-t border-slate-100 pt-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAnswerSubmit(question.id);
                      }}
                    >
                      <textarea
                        className="min-h-24 resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                        onChange={(event) =>
                          setAnswerDrafts((drafts) => ({ ...drafts, [question.id]: event.target.value }))
                        }
                        placeholder="답변 내용을 입력하세요."
                        value={answerDrafts[question.id] ?? ""}
                      />
                      <button
                        className="h-10 w-fit cursor-pointer rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
                        disabled={status === "uploading"}
                        type="submit"
                      >
                        답변 등록
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Send className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
            <h3 className="text-lg font-black text-slate-950">문의하기</h3>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={handleQuestionSubmit}>
            <label className="grid gap-1 text-sm font-extrabold text-slate-700">
              제목
              <input
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="문의 제목"
                value={title}
              />
            </label>
            <label className="grid gap-1 text-sm font-extrabold text-slate-700">
              내용
              <textarea
                className="min-h-48 resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                maxLength={5000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="문의 내용을 입력하세요."
                value={content}
              />
            </label>
            <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
              {status === "uploading" ? "등록 중..." : "문의 등록"}
            </ActionButton>
          </form>
        </section>
      </div>
    </section>
  );
}
