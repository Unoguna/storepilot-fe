"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CircleHelp,
  Database,
  FolderUp,
  Home,
  ImageDown,
  ListTree,
  LogOut,
  PackagePlus,
  SearchCheck,
  Stamp,
  Upload,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { MyCategoryMappingListPage } from "@/components/features/my-category/my-category-mapping-list-page";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { ProductImageDownloadCard } from "@/components/features/product/product-image-download-card";
import { QnaPage } from "@/components/features/qna/qna-page";
import { QnaFaqDetailPage } from "@/components/features/qna/qna-faq-detail-page";
import { QnaQuestionCreatePage } from "@/components/features/qna/qna-question-create-page";
import { QnaQuestionDetailPage } from "@/components/features/qna/qna-question-detail-page";
import { TrainingProductAddCard } from "@/components/features/training-product/training-product-add-card";
import { TrainingProductCategoryStatsPage } from "@/components/features/training-product/training-product-category-stats-page";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";
import { WatermarkSettingsCard } from "@/components/features/watermark/watermark-settings-card";
import { HomeDashboard } from "@/components/features/home/home-dashboard";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { useAuthSession } from "@/components/features/auth/auth-session-provider";
import { deleteAccount, getMyCategoryMappings, logout } from "@/lib/api";
import { AuthUser } from "@/types/store-pilot";

type HomeView =
  | "dashboard"
  | "product-excel-upload"
  | "product-image-download"
  | "watermark-settings"
  | "naver-category-upload"
  | "my-category-upload"
  | "my-category-mappings"
  | "qna"
  | "qna-faq-detail"
  | "qna-question-create"
  | "qna-question-detail"
  | "training-product-upload"
  | "training-product-add"
  | "training-product-category-stats";

type AuthenticatedHomeProps = {
  currentView?: HomeView;
  faqId?: number;
  questionId?: number;
};

export function AuthenticatedHome({ currentView = "dashboard", faqId, questionId }: AuthenticatedHomeProps) {
  const router = useRouter();
  const { user, loading, setUser } = useAuthSession();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [myCategoryRedirectNotified, setMyCategoryRedirectNotified] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const myCategoryRedirectRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && currentView !== "dashboard") {
      router.replace("/");
    }
  }, [currentView, loading, router, user]);

  useEffect(() => {
    if (!user || currentView !== "product-excel-upload" || myCategoryRedirectNotified || myCategoryRedirectRef.current) {
      return;
    }

    function notifyAndRedirectToMyCategoryUpload() {
      if (myCategoryRedirectRef.current) {
        return;
      }
      myCategoryRedirectRef.current = true;
      setMyCategoryRedirectNotified(true);
      window.alert("활성화된 마이카테고리가 없습니다. 마이카테고리 업로드를 해주세요!");
      router.replace("/my-category-mappings/upload");
    }

    async function redirectIfMyCategoryMappingsEmpty() {
      try {
        const body = await getMyCategoryMappings();
        if ((body.data?.mappings ?? []).length === 0) {
          notifyAndRedirectToMyCategoryUpload();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("마이카테고리")) {
          notifyAndRedirectToMyCategoryUpload();
        }
      }
    }

    redirectIfMyCategoryMappingsEmpty();
  }, [currentView, myCategoryRedirectNotified, router, user]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setAccountMenuOpen(false);
      setUser(null);
      router.replace("/");
    }
  }

  function handleAuthenticated(authenticatedUser: AuthUser) {
    setUser(authenticatedUser);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("회원 탈퇴 시 계정과 개인 데이터가 삭제됩니다. 정말 탈퇴하시겠습니까?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteAccount();
      setAccountMenuOpen(false);
      setUser(null);
      router.replace("/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.");
    }
  }

  if (loading) {
    return <AppLoadingShell />;
  }

  if (!user) {
    return currentView === "dashboard"
      ? <AuthPanel onAuthenticated={handleAuthenticated} />
      : <AppLoadingShell />;
  }

  const authenticatedUser = user;
  const isAdmin = authenticatedUser.role === "ADMIN";

  function renderContent() {
    if (currentView === "dashboard") {
      return <FullWidthContent><HomeDashboard isAdmin={isAdmin} onNavigate={moveTo} /></FullWidthContent>;
    }

    if (currentView === "product-excel-upload") {
      return <FullWidthContent><ProductExcelCard isAdmin={isAdmin} /></FullWidthContent>;
    }

    if (currentView === "product-image-download") {
      return <FullWidthContent><ProductImageDownloadCard /></FullWidthContent>;
    }

    if (currentView === "watermark-settings") {
      return <FullWidthContent><WatermarkSettingsCard /></FullWidthContent>;
    }

    if (currentView === "naver-category-upload") {
      return isAdmin ? <FullWidthContent><CategoryUploadCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    if (currentView === "my-category-upload") {
      return <FullWidthContent><MyCategoryMappingCard /></FullWidthContent>;
    }

    if (currentView === "my-category-mappings") {
      return <MyCategoryMappingListPage />;
    }

    if (currentView === "qna") {
      return <QnaPage user={authenticatedUser} />;
    }

    if (currentView === "qna-faq-detail" && faqId !== undefined) {
      return <QnaFaqDetailPage faqId={faqId} user={authenticatedUser} />;
    }

    if (currentView === "qna-question-create") {
      return <QnaQuestionCreatePage />;
    }

    if (currentView === "qna-question-detail" && questionId !== undefined) {
      return <QnaQuestionDetailPage questionId={questionId} user={authenticatedUser} />;
    }

    if (currentView === "training-product-upload") {
      return isAdmin ? <FullWidthContent><TrainingProductUploadCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    if (currentView === "training-product-add") {
      return isAdmin ? <FullWidthContent><TrainingProductAddCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    if (currentView === "training-product-category-stats") {
      return isAdmin ? <TrainingProductCategoryStatsPage /> : <AccessDeniedMessage />;
    }

    return null;
  }

  function moveTo(path: string) {
    router.push(path);
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f5f7f6] text-[#172126]">
      <div className="grid h-full min-h-0 lg:grid-cols-[280px_1fr]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:border-b-0 lg:border-r">
          <button
            className="mb-5 flex h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-left text-xl font-black tracking-normal text-slate-950"
            onClick={() => router.push("/")}
            type="button"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="size-8 shrink-0 rounded-full"
              height={32}
              src="/storepilot-logo-green.png"
              width={32}
            />
            <span>StorePilot</span>
          </button>

          <nav className="grid gap-1" aria-label="주요 메뉴">
            <SidebarButton active={currentView === "dashboard"} icon={Home} onClick={() => moveTo("/")}>
              홈
            </SidebarButton>
            <SidebarButton active={currentView === "product-excel-upload"} icon={SearchCheck} onClick={() => moveTo("/product-excel-jobs/upload")}>
              카테고리 및 키워드 찾기
            </SidebarButton>
            <SidebarButton active={currentView === "product-image-download"} icon={ImageDown} onClick={() => moveTo("/product-images/download")}>
              상품 이미지 다운로드
            </SidebarButton>
            <SidebarButton active={currentView === "watermark-settings"} icon={Stamp} onClick={() => moveTo("/watermarks")}>
              워터마크 설정
            </SidebarButton>
            <SidebarButton active={currentView === "my-category-upload"} icon={Upload} onClick={() => moveTo("/my-category-mappings/upload")}>
              마이카테고리 업로드
            </SidebarButton>
            <SidebarButton active={currentView === "my-category-mappings"} icon={ListTree} onClick={() => moveTo("/my-category-mappings")}>
              마이카테고리 조회
            </SidebarButton>
            <SidebarButton active={currentView === "qna" || currentView === "qna-faq-detail" || currentView === "qna-question-create" || currentView === "qna-question-detail"} icon={CircleHelp} onClick={() => moveTo("/qna")}>
              QnA
            </SidebarButton>
          </nav>

          {isAdmin && (
            <nav className="mt-4 grid gap-1 border-t border-slate-200 pt-4" aria-label="관리자 메뉴">
              <p className="px-3 pb-1 text-xs font-extrabold text-slate-400">관리자</p>
              <SidebarButton active={currentView === "naver-category-upload"} icon={FolderUp} onClick={() => moveTo("/naver-categories/upload")}>
                네이버 카테고리 업로드
              </SidebarButton>
              <SidebarButton active={currentView === "training-product-upload"} icon={Database} onClick={() => moveTo("/training-products/upload")}>
                기존 상품 업로드
              </SidebarButton>
              <SidebarButton active={currentView === "training-product-add"} icon={PackagePlus} onClick={() => moveTo("/training-products/add")}>
                추가 상품 업로드
              </SidebarButton>
              <SidebarButton active={currentView === "training-product-category-stats"} icon={BarChart3} onClick={() => moveTo("/training-products/category-stats")}>
                기존 상품 카테고리 통계
              </SidebarButton>
            </nav>
          )}

          <div className="relative mt-auto border-t border-slate-200 pt-4" ref={accountMenuRef}>
            {accountMenuOpen && (
              <div
                className="absolute bottom-full left-0 z-20 mb-2 grid w-full gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(23,33,38,0.16)]"
                role="menu"
              >
                <button
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  onClick={handleDeleteAccount}
                  role="menuitem"
                  type="button"
                >
                  <UserX className="size-4 shrink-0" aria-hidden="true" />
                  회원 탈퇴
                </button>
                <button
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  로그아웃
                </button>
              </div>
            )}
            <button
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className="w-full cursor-pointer rounded-md bg-white px-3 py-2 text-left transition hover:bg-slate-100"
              onClick={() => setAccountMenuOpen((open) => !open)}
              type="button"
            >
              <span className="block truncate text-sm font-extrabold text-slate-800">{authenticatedUser.email}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{isAdmin ? "관리자" : "사용자"}</span>
            </button>
          </div>
        </aside>

        <section className="grid min-h-0 content-start gap-5 overflow-y-auto px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-8">
          {renderContent()}
        </section>
      </div>
    </main>
  );
}

function SidebarButton({
  active,
  children,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-extrabold transition",
        active
          ? "bg-teal-50 text-teal-900"
          : "text-slate-700 hover:bg-slate-100 hover:text-teal-800",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </button>
  );
}

function FullWidthContent({ children }: { children: React.ReactNode }) {
  return <div className="lg:col-span-2">{children}</div>;
}

function AccessDeniedMessage() {
  return (
    <section className="rounded-md border border-red-100 bg-white p-6 text-sm font-bold text-red-700 shadow-sm lg:col-span-2">
      접근 권한이 없습니다.
    </section>
  );
}

function AppLoadingShell() {
  return (
    <main
      aria-label="페이지를 준비하는 중"
      aria-live="polite"
      className="h-screen overflow-hidden bg-[#f5f7f6] text-[#172126]"
    >
      <div className="grid h-full min-h-0 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-full border-r border-slate-200 bg-white px-4 py-4 shadow-sm lg:block">
          <div className="mb-6 flex h-11 items-center gap-2 px-3">
            <div className="size-8 animate-pulse rounded-full bg-teal-100" />
            <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="grid gap-2 px-3">
            {Array.from({ length: 7 }, (_, index) => (
              <div className="flex h-10 items-center gap-3" key={index}>
                <div className="size-4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </aside>
        <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
            <div className="h-6 w-52 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
            <div className="h-36 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
            <div className="h-12 w-36 animate-pulse rounded-md bg-teal-100" />
          </div>
        </section>
      </div>
      <span className="sr-only">페이지를 준비하고 있습니다.</span>
    </main>
  );
}
