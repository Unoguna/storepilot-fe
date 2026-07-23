"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { MyCategoryMappingListPage } from "@/components/features/my-category/my-category-mapping-list-page";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { deleteAccount, getCurrentUser, getMyCategoryMappings, logout } from "@/lib/api";
import { AuthUser } from "@/types/store-pilot";

type HomeView =
  | "dashboard"
  | "naver-category-upload"
  | "my-category-upload"
  | "my-category-mappings"
  | "training-product-upload";

type AuthenticatedHomeProps = {
  currentView?: HomeView;
};

export function AuthenticatedHome({ currentView = "dashboard" }: AuthenticatedHomeProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [myCategoryRedirectNotified, setMyCategoryRedirectNotified] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const body = await getCurrentUser();
        setUser(body.data ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (!user || currentView !== "dashboard" || myCategoryRedirectNotified) {
      return;
    }

    function notifyAndRedirectToMyCategoryUpload() {
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
      router.push("/");
    }
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
      window.location.assign("/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.");
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7f6] px-4 text-[#172126]">
        <p className="text-sm font-extrabold text-slate-600">로그인 상태를 확인하는 중입니다...</p>
      </main>
    );
  }

  if (!user) {
    return <AuthPanel onAuthenticated={setUser} />;
  }

  const isAdmin = user.role === "ADMIN";

  function renderContent() {
    if (currentView === "naver-category-upload") {
      return isAdmin ? <FullWidthContent><CategoryUploadCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    if (currentView === "my-category-upload") {
      return <FullWidthContent><MyCategoryMappingCard /></FullWidthContent>;
    }

    if (currentView === "my-category-mappings") {
      return <MyCategoryMappingListPage />;
    }

    if (currentView === "training-product-upload") {
      return isAdmin ? <FullWidthContent><TrainingProductUploadCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    return <FullWidthContent><ProductExcelCard /></FullWidthContent>;
  }

  function moveTo(path: string) {
    router.push(path);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172126]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex min-h-full flex-col border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:border-b-0 lg:border-r">
          <button
            className="mb-5 h-11 rounded-md px-3 text-left text-xl font-black tracking-normal text-slate-950 transition hover:bg-slate-100 hover:text-teal-800"
            onClick={() => window.location.assign("/")}
            type="button"
          >
            StorePilot
          </button>

          <nav className="grid gap-1" aria-label="주요 메뉴">
            <SidebarButton active={currentView === "dashboard"} onClick={() => window.location.assign("/")}>
              홈
            </SidebarButton>
            {isAdmin && (
              <SidebarButton active={currentView === "naver-category-upload"} onClick={() => moveTo("/naver-categories/upload")}>
                네이버 카테고리 업로드
              </SidebarButton>
            )}
            <SidebarButton active={currentView === "my-category-upload"} onClick={() => moveTo("/my-category-mappings/upload")}>
              마이카테고리 업로드
            </SidebarButton>
            {isAdmin && (
              <SidebarButton active={currentView === "training-product-upload"} onClick={() => moveTo("/training-products/upload")}>
                기존 상품 업로드
              </SidebarButton>
            )}
            <SidebarButton active={currentView === "my-category-mappings"} onClick={() => moveTo("/my-category-mappings")}>
              마이카테고리 조회
            </SidebarButton>
          </nav>

          <div className="relative mt-auto border-t border-slate-200 pt-4" ref={accountMenuRef}>
            {accountMenuOpen && (
              <div
                className="absolute bottom-full left-0 z-20 mb-2 grid w-full gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(23,33,38,0.16)]"
                role="menu"
              >
                <button
                  className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  onClick={handleDeleteAccount}
                  role="menuitem"
                  type="button"
                >
                  회원 탈퇴
                </button>
                <button
                  className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  로그아웃
                </button>
              </div>
            )}
            <button
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className="w-full rounded-md bg-white px-3 py-2 text-left transition hover:bg-slate-100"
              onClick={() => setAccountMenuOpen((open) => !open)}
              type="button"
            >
              <span className="block truncate text-sm font-extrabold text-slate-800">{user.email}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{isAdmin ? "관리자" : "사용자"}</span>
            </button>
          </div>
        </aside>

        <section className="grid content-start gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-8">
          {renderContent()}
        </section>
      </div>
    </main>
  );
}

function SidebarButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "min-h-10 rounded-md px-3 py-2 text-left text-sm font-extrabold transition",
        active
          ? "bg-teal-50 text-teal-900"
          : "text-slate-700 hover:bg-slate-100 hover:text-teal-800",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
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
