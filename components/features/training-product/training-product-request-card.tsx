"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { getMyTrainingProductRequests, submitTrainingProductRequest } from "@/lib/api";
import { formatBytes, labelForFile } from "@/lib/format";
import { RequestState, TrainingProductRequest, TrainingProductRequestStatus } from "@/types/store-pilot";

export function TrainingProductRequestCard() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<TrainingProductRequest[]>([]);
  const fileLabel = useMemo(() => labelForFile(file), [file]);

  useEffect(() => {
    getMyTrainingProductRequests()
      .then((body) => setRequests(body.data?.requests ?? []))
      .catch(() => setRequests([]));
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setStatus(selectedFile ? "ready" : "idle");
    setMessage(selectedFile ? "파일이 선택되었습니다." : "기존 상품 엑셀 파일을 선택해 주세요.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("기존 상품 엑셀 파일을 선택해 주세요.");
      return;
    }

    setStatus("uploading");
    setMessage("카테고리 학습 요청을 접수하는 중입니다...");
    try {
      const body = await submitTrainingProductRequest(file);
      if (body.data) {
        setRequests((current) => [body.data!, ...current]);
      }
      setStatus("success");
      setMessage(body.message ?? "카테고리 학습 요청이 접수되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "카테고리 학습 요청 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="grid gap-5">
      <UploadCard
        title="기존 상품으로 카테고리 학습하기"
        icon={BookOpenCheck}
        description="기존에 등록했던 상품 파일을 보내주시면 상품명과 카테고리의 관계를 확인한 뒤 학습에 반영합니다."
        guide={(
          <div className="rounded-md border-l-4 border-teal-700 bg-teal-50 px-5 py-4 text-sm leading-6 text-slate-800">
            <p className="font-black text-teal-950">파일을 보내기 전에 확인해 주세요</p>
            <p className="mt-1 font-semibold">1행의 상품명과 마이카테 열 이름을 변경하지 않은 .xlsx 파일을 올려주세요.</p>
            <p className="mt-1 font-semibold">파일 용량은 최대 20MB까지 업로드할 수 있습니다.</p>
            <p className="mt-2 rounded-md bg-white px-3 py-2 font-bold text-slate-700">
              제출한 원본 파일은 관리자 확인을 위해 보관되며, 업로드만으로 자동 학습되지는 않습니다.
            </p>
          </div>
        )}
        fileLabel={fileLabel}
        status={status}
        message={message}
        accept=".xlsx"
        onFileChange={handleFileChange}
      >
        {file && (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
              {status === "uploading" ? "접수 중..." : "학습 요청하기"}
            </ActionButton>
          </form>
        )}
      </UploadCard>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
        <h2 className="text-lg font-black text-slate-950">내 학습 요청</h2>
        {requests.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">아직 접수한 학습 요청이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            {requests.map((request) => (
              <div
                className="grid gap-1 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
                key={request.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800">{request.originalFilename}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    상품 {request.productCount.toLocaleString()}개 · {formatBytes(request.fileSize)} · {formatDate(request.createdAt)}
                  </p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(request.status)}`}>
                  {statusLabel(request.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: TrainingProductRequestStatus) {
  return {
    RECEIVED: "접수 완료",
    REVIEWING: "검토 중",
    COMPLETED: "학습 완료",
    REJECTED: "반려",
  }[status];
}

function statusClass(status: TrainingProductRequestStatus) {
  return {
    RECEIVED: "bg-slate-100 text-slate-700",
    REVIEWING: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-teal-50 text-teal-800",
    REJECTED: "bg-red-50 text-red-700",
  }[status];
}
