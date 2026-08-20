"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleHelp, MessageCircleQuestion, Pencil, Send, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import {
  answerQnaQuestion,
  createQnaFaq,
  createQnaQuestion,
  deleteQnaQuestion,
  getAdminQnaFaqs,
  getAdminQnaQuestions,
  getMyQnaQuestions,
  getQnaFaqs,
  setQnaFaqActive,
  updateQnaFaq,
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
  const [faqId, setFaqId] = useState<number | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqSortOrder, setFaqSortOrder] = useState("0");
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
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
        isAdmin ? getAdminQnaFaqs() : getQnaFaqs(),
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

  async function handleFaqSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sortOrder = Number.parseInt(faqSortOrder, 10);
    setStatus("uploading");
    setMessage(faqId === null ? "FAQ를 등록하는 중입니다..." : "FAQ를 수정하는 중입니다...");

    try {
      if (faqId === null) {
        await createQnaFaq(faqQuestion, faqAnswer, Number.isNaN(sortOrder) ? 0 : sortOrder);
        setMessage("FAQ가 등록되었습니다.");
      } else {
        await updateQnaFaq(faqId, faqQuestion, faqAnswer, Number.isNaN(sortOrder) ? 0 : sortOrder);
        setMessage("FAQ가 수정되었습니다.");
      }
      resetFaqForm();
      setStatus("success");
      await loadQna();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "FAQ 저장 중 오류가 발생했습니다.");
    }
  }

  async function handleFaqActiveToggle(faq: QnaFaq) {
    setStatus("uploading");
    setMessage(faq.active ? "FAQ를 숨김 처리하는 중입니다..." : "FAQ를 노출 처리하는 중입니다...");

    try {
      await setQnaFaqActive(faq.id, !faq.active);
      setStatus("success");
      setMessage(faq.active ? "FAQ가 숨김 처리되었습니다." : "FAQ가 노출 처리되었습니다.");
      await loadQna();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "FAQ 상태 변경 중 오류가 발생했습니다.");
    }
  }

  function startFaqEdit(faq: QnaFaq) {
    setFaqId(faq.id);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqSortOrder(String(faq.sortOrder));
  }

  function resetFaqForm() {
    setFaqId(null);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqSortOrder("0");
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

  async function handleQuestionDelete(question: QnaQuestion) {
    if (!window.confirm(`'${question.title}' 문의를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingQuestionId(question.id);
    setStatus("uploading");
    setMessage("문의를 삭제하는 중입니다...");

    try {
      await deleteQnaQuestion(question.id);
      setQuestions((currentQuestions) =>
        currentQuestions.filter((currentQuestion) => currentQuestion.id !== question.id),
      );
      setStatus("success");
      setMessage("문의가 삭제되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문의 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingQuestionId(null);
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
          {isAdmin && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Pencil className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
                <h3 className="text-lg font-black text-slate-950">FAQ 관리</h3>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={handleFaqSubmit}>
                <label className="grid gap-1 text-sm font-extrabold text-slate-700">
                  질문
                  <input
                    className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    maxLength={300}
                    onChange={(event) => setFaqQuestion(event.target.value)}
                    placeholder="FAQ 질문"
                    value={faqQuestion}
                  />
                </label>
                <label className="grid gap-1 text-sm font-extrabold text-slate-700">
                  답변
                  <textarea
                    className="min-h-32 resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    maxLength={5000}
                    onChange={(event) => setFaqAnswer(event.target.value)}
                    placeholder="FAQ 답변"
                    value={faqAnswer}
                  />
                </label>
                <label className="grid gap-1 text-sm font-extrabold text-slate-700 sm:max-w-40">
                  정렬 순서
                  <input
                    className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    min={0}
                    onChange={(event) => setFaqSortOrder(event.target.value)}
                    type="number"
                    value={faqSortOrder}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
                    {faqId === null ? "FAQ 등록" : "FAQ 수정"}
                  </ActionButton>
                  {faqId !== null && (
                    <button
                      className="h-12 cursor-pointer rounded-md border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                      onClick={resetFaqForm}
                      type="button"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

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
                    <span className={!faq.active ? "text-slate-400" : ""}>{faq.question}</span>
                    {isAdmin && !faq.active && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-500">
                        숨김
                      </span>
                    )}
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{faq.answer}</p>
                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      <button
                        className="h-9 cursor-pointer rounded-md border border-slate-200 px-3 text-xs font-extrabold text-slate-700 transition hover:bg-white"
                        onClick={() => startFaqEdit(faq)}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="h-9 cursor-pointer rounded-md border border-slate-200 px-3 text-xs font-extrabold text-slate-700 transition hover:bg-white"
                        onClick={() => handleFaqActiveToggle(faq)}
                        type="button"
                      >
                        {faq.active ? "숨김" : "노출"}
                      </button>
                    </div>
                  )}
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
                    <div className="flex items-center gap-2">
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
                      {!isAdmin && (
                        <button
                          aria-label={`${question.title} 문의 삭제`}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-red-200 px-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                          disabled={deletingQuestionId === question.id}
                          onClick={() => handleQuestionDelete(question)}
                          type="button"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          {deletingQuestionId === question.id ? "삭제 중..." : "삭제"}
                        </button>
                      )}
                    </div>
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
