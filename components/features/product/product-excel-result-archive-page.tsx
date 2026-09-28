"use client";

import { useEffect, useState } from "react";
import { Archive, Download, RefreshCw } from "lucide-react";
import { downloadProductExcelJobResult, getProductExcelJobResults } from "@/lib/api";
import { downloadBlob, parseFilename } from "@/lib/file-download";
import { ProductExcelJobResult } from "@/types/store-pilot";

export function ProductExcelResultArchivePage() {
  const [results, setResults] = useState<ProductExcelJobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingJobId, setDownloadingJobId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadResults() {
    setLoading(true);
    setMessage("");
    try {
      const body = await getProductExcelJobResults();
      setResults(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결과 엑셀 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getProductExcelJobResults()
      .then((body) => {
        if (active) {
          setResults(body.data ?? []);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "결과 엑셀 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleDownload(result: ProductExcelJobResult) {
    setDownloadingJobId(result.jobId);
    setMessage("");
    try {
      const response = await downloadProductExcelJobResult(result.jobId);
      const blob = await response.blob();
      const filename = parseFilename(response.headers.get("Content-Disposition")) ?? result.filename;
      downloadBlob(blob, filename);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결과 엑셀을 다운로드하지 못했습니다.");
      await loadResults();
    } finally {
      setDownloadingJobId(null);
    }
  }

  return (
    <section className="grid gap-5 lg:col-span-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="size-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-xl font-black text-slate-950">결과 엑셀 보관함</h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              카테고리 및 키워드 찾기가 완료된 결과를 7일 동안 다시 다운로드할 수 있습니다.
            </p>
          </div>
          <button
            className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadResults()}
            type="button"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            새로고침
          </button>
        </div>
        {message && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm font-bold text-slate-500">결과 엑셀 목록을 불러오는 중입니다...</p>
        ) : results.length === 0 ? (
          <div className="grid justify-items-center gap-2 p-10 text-center">
            <Archive className="size-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-extrabold text-slate-700">보관된 결과 엑셀이 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {results.map((result) => (
              <li className="flex flex-wrap items-center justify-between gap-4 p-5" key={result.jobId}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900">{result.filename}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-extrabold ${result.resultExpired ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                      {result.resultExpired ? "보관 만료" : "다운로드 가능"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    상품 {result.productCount.toLocaleString()}개 · 완료 {formatDateTime(result.completedAt)}
                  </p>
                  {!result.resultExpired && result.resultExpiresAt && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatDateTime(result.resultExpiresAt)}까지 보관
                    </p>
                  )}
                </div>
                <button
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={result.resultExpired || downloadingJobId === result.jobId}
                  onClick={() => void handleDownload(result)}
                  type="button"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {downloadingJobId === result.jobId ? "다운로드 중..." : "다운로드"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "기록 없음";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
