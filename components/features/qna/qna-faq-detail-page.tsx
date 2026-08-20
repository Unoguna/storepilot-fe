"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { getAdminQnaFaq, getQnaFaq } from "@/lib/api";
import { AuthUser, QnaFaq } from "@/types/store-pilot";

type QnaFaqDetailPageProps = {
  faqId: number;
  user: AuthUser;
};

export function QnaFaqDetailPage({ faqId, user }: QnaFaqDetailPageProps) {
  const isAdmin = user.role === "ADMIN";
  const [faq, setFaq] = useState<QnaFaq | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFaq() {
      setLoading(true);
      setErrorMessage("");
      try {
        const body = await (isAdmin ? getAdminQnaFaq(faqId) : getQnaFaq(faqId));
        if (active) {
          setFaq(body.data ?? null);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "자주 묻는 질문을 불러오지 못했습니다.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFaq();
    return () => {
      active = false;
    };
  }, [faqId, isAdmin]);

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

        {loading && (
          <p className="mt-6 text-sm font-bold text-slate-500">자주 묻는 질문을 불러오는 중입니다...</p>
        )}

        {!loading && errorMessage && (
          <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}

        {!loading && faq && (
          <article className="mt-5 grid gap-5">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <CircleHelp className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
                  <h2 className="break-words text-xl font-black text-slate-950">{faq.question}</h2>
                </div>
                {isAdmin && !faq.active && (
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-500">
                    숨김
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-teal-800">답변</h3>
              <p className="mt-2 whitespace-pre-wrap rounded-md bg-teal-50 p-4 text-sm leading-6 text-teal-950">
                {faq.answer}
              </p>
            </div>
          </article>
        )}

        {!loading && !faq && !errorMessage && (
          <p className="mt-6 rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">
            자주 묻는 질문을 찾을 수 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
