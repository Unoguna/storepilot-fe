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
              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                StorePilot
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
