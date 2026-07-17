"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { MyCategoryMappingListPage } from "@/components/features/my-category/my-category-mapping-list-page";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { getCurrentUser, logout } from "@/lib/api";
import { AuthUser } from "@/types/store-pilot";

type HomeView = "dashboard" | "my-category-mappings";

export function AuthenticatedHome() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [view, setView] = useState<HomeView>("dashboard");
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
      setView("dashboard");
      setUser(null);
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

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-4">
              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                StorePilot
              </h1>
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
                      setView("my-category-mappings");
                      setAccountMenuOpen(false);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    마이카테고리 조회
                  </button>
                  <button
                    className="h-10 rounded-md px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
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
          {view === "my-category-mappings" ? (
            <MyCategoryMappingListPage onBack={() => setView("dashboard")} />
          ) : (
            <>
              {isAdmin && <CategoryUploadCard />}
              <MyCategoryMappingCard />
              {isAdmin && <TrainingProductUploadCard />}
              <ProductExcelCard />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
