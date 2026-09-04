"use client";

import { useEffect, useState } from "react";
import { Download, Inbox, Trash2 } from "lucide-react";
import {
  deleteTrainingProductRequest,
  downloadTrainingProductRequest,
  getAdminTrainingProductRequests,
  updateTrainingProductRequestStatus,
} from "@/lib/api";
import { downloadBlob } from "@/lib/file-download";
import { formatBytes } from "@/lib/format";
import { TrainingProductRequest, TrainingProductRequestStatus } from "@/types/store-pilot";

const STATUS_OPTIONS: Array<{ value: TrainingProductRequestStatus; label: string }> = [
  { value: "RECEIVED", label: "접수 완료" },
  { value: "REVIEWING", label: "검토 중" },
  { value: "COMPLETED", label: "학습 완료" },
  { value: "REJECTED", label: "반려" },
];

export function AdminTrainingProductRequestPage() {
  const [requests, setRequests] = useState<TrainingProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  async function handleStatusChange(requestId: number, status: TrainingProductRequestStatus) {
    setUpdatingId(requestId);
    setMessage("");
    try {
      const body = await updateTrainingProductRequestStatus(requestId, status);
      if (body.data) {
        setRequests((current) => current.map((request) => request.id === requestId ? body.data! : request));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "학습 요청 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(request: TrainingProductRequest) {
    if (!window.confirm(`'${request.originalFilename}' 원본 파일을 삭제하고 학습 완료 처리하시겠습니까?`)) {
      return;
    }

    setDeletingId(request.id);
    setMessage("");
    try {
      const body = await deleteTrainingProductRequest(request.id);
      if (body.data) {
        setRequests((current) => current.map((item) => item.id === request.id ? body.data! : item));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "학습 요청을 삭제하지 못했습니다.");
    } finally {
      setDeletingId(null);
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
                  <th className="w-36 whitespace-nowrap px-4 py-3">상태</th>
                  <th className="w-52 px-4 py-3 text-center">관리</th>
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
                    <td className="px-4 py-3">
                      <select
                        aria-label={`${request.originalFilename} 학습 요청 상태`}
                        className="h-9 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:cursor-wait disabled:bg-slate-100"
                        disabled={!request.fileAvailable || updatingId === request.id}
                        onChange={(event) => handleStatusChange(
                          request.id,
                          event.target.value as TrainingProductRequestStatus,
                        )}
                        value={request.status}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-teal-700 px-3 text-xs font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
                        disabled={!request.fileAvailable || downloadingId === request.id || deletingId === request.id}
                          onClick={() => handleDownload(request)}
                          type="button"
                        >
                          <Download className="size-3.5" aria-hidden="true" />
                          {!request.fileAvailable ? "삭제됨" : downloadingId === request.id ? "받는 중" : "다운로드"}
                        </button>
                        {request.fileAvailable && (
                          <button
                            aria-label={`${request.originalFilename} 원본 파일 삭제`}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-red-200 px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                            disabled={deletingId === request.id || downloadingId === request.id}
                            onClick={() => handleDelete(request)}
                            type="button"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            {deletingId === request.id ? "삭제 중" : "파일 삭제"}
                          </button>
                        )}
                      </div>
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
