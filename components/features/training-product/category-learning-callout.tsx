import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

export function CategoryLearningCallout({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={[
        "flex flex-col gap-4 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 sm:flex-row sm:items-center sm:justify-between",
        compact ? "p-4" : "p-5 sm:p-6",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
          <BookOpenCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-black text-teal-950">
            {compact ? "더 정확한 카테고리 결과가 필요하신가요?" : "카테고리 추천 정확도를 높여보세요"}
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            기존에 등록했던 상품의 상품명과 카테고리를 학습하면 내 상품에 맞는 마이카테를 더욱 정확하게 찾을 수 있습니다.
          </p>
        </div>
      </div>
      <Link
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        href="/category-learning"
      >
        카테고리 학습하기
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
