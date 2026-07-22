"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { MyCategoryMappingListPage } from "@/components/features/my-category/my-category-mapping-list-page";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { deleteAccount, getCurrentUser, logout } from "@/lib/api";
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
      return <MyCategoryMappingListPage onBack={() => router.push("/")} />;
    }

    if (currentView === "training-product-upload") {
      return isAdmin ? <FullWidthContent><TrainingProductUploadCard /></FullWidthContent> : <AccessDeniedMessage />;
    }

    return <FullWidthContent><ProductExcelCard /></FullWidthContent>;
  }

  function moveTo(path: string) {
    setAccountMenuOpen(false);
    router.push(path);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-4">
              <button
                className="max-w-3xl cursor-pointer text-left text-3xl font-black leading-tight tracking-normal transition hover:text-teal-800 sm:text-4xl"
                onClick={() => window.location.assign("/")}
                type="button"
              >
                StorePilot
              </button>
            </div>
            <div className="relative" ref={accountMenuRef}>
              <button
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-700 hover:text-teal-800"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="max-w-56 truncate">{user.email}</span>
                <span className="text-xs text-slate-400">▾</span>
              </button>

              {accountMenuOpen && (
                <div
                  className="absolute right-0 z-20 mt-2 grid min-w-64 gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(23,33,38,0.16)]"
                  role="menu"
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-bold text-slate-800">{user.email}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {isAdmin ? "관리자" : "사용자"}
                    </p>
                  </div>
                  <button
                    className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      window.location.assign("/");
                    }}
                    role="menuitem"
                    type="button"
                  >
                    홈
                  </button>
                  {isAdmin && (
                    <button
                      className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
                      onClick={() => moveTo("/naver-categories/upload")}
                      role="menuitem"
                      type="button"
                    >
                      네이버 카테고리 업로드
                    </button>
                  )}
                  <button
                    className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
                    onClick={() => moveTo("/my-category-mappings/upload")}
                    role="menuitem"
                    type="button"
                  >
                    마이카테고리 업로드
                  </button>
                  {isAdmin && (
                    <button
                      className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
                      onClick={() => moveTo("/training-products/upload")}
                      role="menuitem"
                      type="button"
                    >
                      기존 상품 업로드
                    </button>
                  )}
                  <button
                    className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
                    onClick={() => moveTo("/my-category-mappings")}
                    role="menuitem"
                    type="button"
                  >
                    마이카테고리 조회
                  </button>
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
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {renderContent()}
        </section>
      </div>
    </main>
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
