"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Database,
  ExternalLink,
  FileSearch,
  ImageDown,
  ListTree,
  Sparkles,
  Stamp,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { StorePilotGuideModal } from "@/components/features/home/store-pilot-guide-modal";
import { CategoryLearningCallout } from "@/components/features/training-product/category-learning-callout";

type HomeDashboardProps = {
  isAdmin: boolean;
  onNavigate: (path: string) => void;
};

const GUIDE_HIDDEN_UNTIL_KEY = "storepilot-guide-hidden-until";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const steps = [
  {
    title: "마이카테고리 등록",
    description: "사용 중인 마이카테고리와 네이버 카테고리 매핑이 담긴 엑셀을 업로드하세요.",
    path: "/my-category-mappings/upload",
    icon: Upload,
  },
  {
    title: "카테고리·키워드 찾기",
    description: "상품 엑셀을 올리면 적합한 카테고리와 검색 키워드를 찾아 결과 파일로 만들어 드립니다.",
    path: "/product-excel-jobs/upload",
    icon: FileSearch,
  },
  {
    title: "상품 이미지 받기",
    description: "상품 엑셀의 이미지 주소를 읽어 이미지를 내려받고, 필요하면 워터마크도 적용하세요.",
    path: "/product-images/download",
    icon: ImageDown,
  },
] satisfies Array<GuideItem>;

const features = [
  {
    title: "카테고리 및 키워드 찾기",
    description: "상품별 추천 카테고리와 키워드를 생성합니다.",
    path: "/product-excel-jobs/upload",
    icon: Sparkles,
  },
  {
    title: "상품 이미지 다운로드",
    description: "상품 이미지를 일괄 다운로드하고 용량을 줄입니다.",
    path: "/product-images/download",
    icon: ImageDown,
  },
  {
    title: "워터마크 설정",
    description: "다운로드할 이미지에 사용할 워터마크를 등록합니다.",
    path: "/watermarks",
    icon: Stamp,
  },
  {
    title: "마이카테고리 조회",
    description: "등록된 카테고리 매핑을 확인하고 관리합니다.",
    path: "/my-category-mappings",
    icon: ListTree,
  },
] satisfies Array<GuideItem>;

export function HomeDashboard({ isAdmin, onNavigate }: HomeDashboardProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hiddenUntil = Number.parseInt(window.localStorage.getItem(GUIDE_HIDDEN_UNTIL_KEY) ?? "0", 10);
        setGuideOpen(!Number.isFinite(hiddenUntil) || hiddenUntil <= Date.now());
      } catch {
        setGuideOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function hideGuideForDay() {
    try {
      window.localStorage.setItem(GUIDE_HIDDEN_UNTIL_KEY, String(Date.now() + ONE_DAY_MS));
    } catch {
      // 저장소를 사용할 수 없는 브라우저에서도 팝업은 닫을 수 있어야 합니다.
    }
    setGuideOpen(false);
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 px-6 py-8 text-white shadow-[0_16px_40px_rgba(13,148,136,0.18)] sm:px-8 sm:py-10">
        <p className="text-sm font-extrabold text-teal-100">STOREPILOT</p>
        <h1 className="mt-2 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
          상품 등록에 필요한 반복 작업을 더 간단하게
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-teal-50 sm:text-base">
          상품 엑셀을 기반으로 네이버 카테고리와 키워드를 찾고, 상품 이미지 다운로드와 워터마크 적용까지 한 곳에서 처리할 수 있습니다.
        </p>
        <a
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-black text-teal-800 transition hover:bg-teal-50"
          href="https://literate-marquis-4cc.notion.site/StorePilot-3d2c3b070b418090809ad8e419b2df0e"
          rel="noreferrer"
          target="_blank"
        >
          StorePilot 사용법
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </section>

      <CategoryLearningCallout />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-extrabold tracking-wide text-teal-700">처음 사용한다면</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">이 순서대로 시작하세요</h2>
        </div>
        <ol className="mt-5 grid gap-3 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <GuideCard item={step} number={index + 1} onNavigate={onNavigate} />
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-950">주요 기능</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard item={feature} key={feature.title} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Database className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-black text-amber-950">관리자용 검색 데이터 관리</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-amber-900">
                추천 품질을 유지하려면 네이버 카테고리와 기존 상품 인덱스를 최신 상태로 관리하세요.
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-extrabold text-amber-900 transition hover:bg-amber-100"
            onClick={() => onNavigate("/training-products/upload")}
            type="button"
          >
            기존 상품 관리
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </section>
      )}

      {guideOpen && (
        <StorePilotGuideModal
          onClose={() => setGuideOpen(false)}
          onHideForDay={hideGuideForDay}
        />
      )}
    </div>
  );
}

type GuideItem = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
};

function GuideCard({
  item,
  number,
  onNavigate,
}: {
  item: GuideItem;
  number: number;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      className="group flex h-full w-full cursor-pointer gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"
      onClick={() => onNavigate(item.path)}
      type="button"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="text-xs font-black text-teal-700">STEP {number}</span>
        <span className="mt-1 block font-black text-slate-950 group-hover:text-teal-900">{item.title}</span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-slate-600">{item.description}</span>
      </span>
    </button>
  );
}

function FeatureCard({ item, onNavigate }: { item: GuideItem; onNavigate: (path: string) => void }) {
  const Icon = item.icon;
  return (
    <button
      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
      onClick={() => onNavigate(item.path)}
      type="button"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900 group-hover:text-teal-800">{item.title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span>
      </span>
    </button>
  );
}
