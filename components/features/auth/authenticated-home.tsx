"use client";

import { useEffect, useState } from "react";
import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { getCurrentUser, logout } from "@/lib/api";
import { AuthUser } from "@/types/store-pilot";

export function AuthenticatedHome() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    try {
      await logout();
    } finally {
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
              <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot MVP</p>
              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                카테고리 기준을 갱신하고 상품 엑셀을 자동 완성합니다
              </h1>
            </div>
            <div className="grid justify-items-start gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm sm:justify-items-end">
              <p className="text-sm font-bold text-slate-700">{user.email}</p>
              <button
                className="h-9 rounded-md border border-slate-300 px-3 text-sm font-extrabold text-slate-700 transition hover:border-teal-700 hover:text-teal-800"
                onClick={handleLogout}
                type="button"
              >
                로그아웃
              </button>
            </div>
          </div>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            네이버 카테고리, 사용자별 마이카테고리 매칭, 기존 상품 학습 데이터, 상품 엑셀 처리를 순서대로 실행할 수 있습니다.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {isAdmin && <CategoryUploadCard />}
          <MyCategoryMappingCard />
          {isAdmin && <TrainingProductUploadCard />}
          <ProductExcelCard />
        </section>
      </div>
    </main>
  );
}
