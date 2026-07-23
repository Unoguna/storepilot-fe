"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyCategoryMappings } from "@/lib/api";
import { MyCategoryMappingItem } from "@/types/store-pilot";

export function MyCategoryMappingListPage() {
  const [mappings, setMappings] = useState<MyCategoryMappingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    async function loadMappings() {
      try {
        const body = await getMyCategoryMappings();
        setMappings(body.data?.mappings ?? []);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "마이카테고리 매핑을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadMappings();
  }, []);

  const filteredMappings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return mappings;
    }

    return mappings.filter((mapping) => {
      const searchable = [
        mapping.myCategoryCode,
        mapping.naverCategoryValue,
        mapping.naverCategoryCode,
        mapping.naverCategoryFullPath,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedKeyword);
    });
  }, [keyword, mappings]);

  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-normal text-slate-950">마이카테고리 조회</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {mappings.length.toLocaleString()}개
          </p>
        </div>
      </div>

      <input
        className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="검색"
        type="search"
        value={keyword}
      />

      {loading && <p className="text-sm font-bold text-slate-500">불러오는 중입니다...</p>}

      {!loading && errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>
      )}

      {!loading && !errorMessage && filteredMappings.length === 0 && (
        <div className="rounded-md bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          조회할 마이카테고리 매핑이 없습니다.
        </div>
      )}

      {!loading && !errorMessage && filteredMappings.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">마이카테고리</th>
                <th className="whitespace-nowrap px-4 py-3">네이버 코드</th>
                <th className="min-w-96 px-4 py-3">네이버 카테고리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id} className="transition hover:bg-teal-50/40">
                  <td className="whitespace-nowrap px-4 py-3 font-extrabold text-slate-900">
                    {mapping.myCategoryCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-600">
                    {mapping.naverCategoryCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {mapping.naverCategoryFullPath}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
