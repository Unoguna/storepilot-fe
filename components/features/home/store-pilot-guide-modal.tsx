"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

const GUIDE_URL = "https://literate-marquis-4cc.notion.site/StorePilot-3d2c3b070b418090809ad8e419b2df0e";

export function StorePilotGuideModal({
  onClose,
  onHideForDay,
}: {
  onClose: () => void;
  onHideForDay: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="store-pilot-guide-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-teal-700">STOREPILOT</p>
            <h2 className="mt-1 text-xl font-black text-slate-950" id="store-pilot-guide-title">StorePilot 사용법</h2>
          </div>
          <button
            aria-label="사용법 닫기"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-5 px-5 py-5 sm:px-6">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            상품 엑셀을 이용해 카테고리와 키워드를 찾고, 상품 이미지 다운로드와 워터마크 적용까지 한 곳에서 처리할 수 있습니다.
          </p>

          <ol className="grid gap-3">
            <GuideStep number={1} title="마이카테고리 등록">
              유플렛에서 내려받은 마이카테고리 파일을 먼저 업로드합니다.
            </GuideStep>
            <GuideStep number={2} title="카테고리 학습">
              기존에 등록했던 상품을 학습하면 내 상품에 맞는 마이카테를 더욱 정확하게 찾을 수 있습니다. 현재 학습 데이터가 쌓이는 단계이므로 카테고리 학습을 권장합니다.
            </GuideStep>
            <GuideStep number={3} title="카테고리 및 키워드 찾기">
              유플렛의 신상품 엑셀을 올리면 임베딩 검색을 통해 카테고리를 찾고 상품 키워드를 생성합니다.
            </GuideStep>
            <GuideStep number={4} title="상품 이미지 다운로드">
              상품 엑셀의 목록이미지1 열을 읽어 이미지를 한 번에 내려받을 수 있습니다.
            </GuideStep>
            <GuideStep number={5} title="워터마크 설정">
              이미지에 적용할 워터마크의 위치, 크기와 불투명도를 설정할 수 있습니다.
            </GuideStep>
          </ol>

          <div className="rounded-lg bg-teal-50 px-4 py-3 text-sm font-bold leading-6 text-teal-950">
            권장 순서: 마이카테고리 등록 → 카테고리 학습 → 카테고리 및 키워드 찾기
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            className="h-10 cursor-pointer px-2 text-sm font-extrabold text-slate-500 transition hover:text-slate-900"
            onClick={onHideForDay}
            type="button"
          >
            오늘 하루 보지 않기
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="h-10 cursor-pointer rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              닫기
            </button>
            <a
              className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:bg-teal-800"
              href={GUIDE_URL}
              rel="noreferrer"
              target="_blank"
            >
              전체 사용법 보기
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}

function GuideStep({ children, number, title }: { children: React.ReactNode; number: number; title: string }) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-200 p-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
        {number}
      </span>
      <div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{children}</p>
      </div>
    </li>
  );
}
