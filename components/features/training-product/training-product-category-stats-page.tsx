"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { getTrainingProductCategoryStats } from "@/lib/api";
import { ProductCategoryStatsResult, RequestState } from "@/types/store-pilot";

export function TrainingProductCategoryStatsPage() {
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [statsResult, setStatsResult] = useState<ProductCategoryStatsResult | null>(null);

  useEffect(() => {
    async function loadStats() {
      setStatus("uploading");
      setMessage("기존 상품 카테고리 통계를 불러오는 중입니다...");

      try {
        const body = await getTrainingProductCategoryStats();
        setStatsResult(body.data ?? null);
        setStatus("success");
        setMessage(body.message ?? "기존 상품 카테고리 통계를 불러왔습니다.");
      } catch (error) {
        setStatsResult(null);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "기존 상품 카테고리 통계를 불러오지 못했습니다.");
      }
    }

    loadStats();
  }, []);

  const stats = statsResult?.stats ?? [];
  const updatedAtText = statsResult?.updatedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(statsResult.updatedAt))
    : "-";

  return (
    <section className="grid gap-5 lg:col-span-2">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-teal-700" aria-hidden="true" />
        <h2 className="text-xl font-black tracking-normal text-slate-950">기존 상품 카테고리 통계</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="총 상품 수" value={`${(statsResult?.totalProductCount ?? 0).toLocaleString()}개`} />
        <SummaryCard label="카테고리 종류" value={`${(statsResult?.categoryCount ?? 0).toLocaleString()}개`} />
        <SummaryCard label="최근 집계" value={updatedAtText} />
      </div>

      {message && (
        <p
          className={[
            "rounded-md border px-4 py-3 text-sm font-bold",
            status === "error"
              ? "border-red-100 bg-red-50 text-red-700"
              : "border-teal-100 bg-teal-50 text-teal-800",
          ].join(" ")}
        >
          {message}
        </p>
      )}

      {status === "success" && stats.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">
          아직 기존 상품 카테고리 통계가 없습니다. 기존 상품 업로드를 먼저 진행해주세요.
        </div>
      )}

      {stats.length > 0 && (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[calc(100vh-260px)] overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="w-20 whitespace-nowrap px-4 py-3">순위</th>
                  <th className="w-36 whitespace-nowrap px-4 py-3">카테고리 코드</th>
                  <th className="min-w-96 px-4 py-3">네이버 카테고리</th>
                  <th className="w-32 whitespace-nowrap px-4 py-3 text-right">상품 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {stats.map((stat, index) => (
                  <tr key={`${stat.naverCategoryCode}-${stat.naverCategoryId}`} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-extrabold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700">
                      {stat.naverCategoryCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {stat.naverCategoryFullPath}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-black text-teal-700">
                      {stat.productCount.toLocaleString()}개
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-extrabold text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
