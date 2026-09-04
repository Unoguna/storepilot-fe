"use client";

import { useEffect, useState } from "react";
import { Download, Inbox } from "lucide-react";
import { downloadTrainingProductRequest, getAdminTrainingProductRequests } from "@/lib/api";
import { downloadBlob } from "@/lib/file-download";
import { formatBytes } from "@/lib/format";
import { TrainingProductRequest } from "@/types/store-pilot";

export function AdminTrainingProductRequestPage() {
  const [requests, setRequests] = useState<TrainingProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    getAdminTrainingProductRequests()
      .then((body) => setRequests(body.data?.requests ?? []))
      .catch((error) => setMessage(error instanceof Error ? error.message : "학습 요청을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(request: TrainingProductRequest) {
    setDownloadingId(request.id);
    setMessage("");
    try {
      const response = await downloadTrainingProductRequest(request.id);
      downloadBlob(await response.blob(), request.originalFilename);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청 파일을 다운로드하지 못했습니다.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="grid gap-5 lg:col-span-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="size-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-xl font-black text-slate-950">카테고리 학습 요청 관리</h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              사용자가 제출한 기존 상품 파일을 확인하고 내려받을 수 있습니다.
            </p>
          </div>
          <span className="rounded-md bg-teal-50 px-3 py-2 text-sm font-black text-teal-900">
            총 {requests.length.toLocaleString()}건
          </span>
        </div>

        {message && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading && <p className="p-6 text-sm font-bold text-slate-500">학습 요청을 불러오는 중입니다...</p>}
        {!loading && requests.length === 0 && (
          <p className="p-6 text-sm font-bold text-slate-500">접수된 카테고리 학습 요청이 없습니다.</p>
        )}
        {requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">요청자</th>
                  <th className="min-w-64 px-4 py-3">파일명</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">상품 수</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">파일 크기</th>
                  <th className="whitespace-nowrap px-4 py-3">접수 일시</th>
                  <th className="w-28 px-4 py-3 text-center">파일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {requests.map((request) => (
                  <tr className="hover:bg-slate-50" key={request.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{request.userEmail}</td>
                    <td className="max-w-96 break-all px-4 py-3 font-semibold">{request.originalFilename}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold">
                      {request.productCount.toLocaleString()}개
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-500">
                      {formatBytes(request.fileSize)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-teal-700 px-3 text-xs font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
                        disabled={downloadingId === request.id}
                        onClick={() => handleDownload(request)}
                        type="button"
                      >
                        <Download className="size-3.5" aria-hidden="true" />
                        {downloadingId === request.id ? "받는 중" : "다운로드"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
