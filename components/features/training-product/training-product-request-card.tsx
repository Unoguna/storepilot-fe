"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { getMyTrainingProductRequests, submitTrainingProductRequest } from "@/lib/api";
import { formatBytes, labelForFiles } from "@/lib/format";
import { RequestState, TrainingProductRequest, TrainingProductRequestStatus } from "@/types/store-pilot";

export function TrainingProductRequestCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<TrainingProductRequest[]>([]);
  const fileLabel = useMemo(() => labelForFiles(files), [files]);

  useEffect(() => {
    getMyTrainingProductRequests()
      .then((body) => setRequests(body.data?.requests ?? []))
      .catch(() => setRequests([]));
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
    setStatus(selectedFiles.length > 0 ? "ready" : "idle");
    setMessage(
      selectedFiles.length > 0
        ? `${selectedFiles.length.toLocaleString()}개 파일이 선택되었습니다.`
        : "기존 상품 엑셀 파일을 하나 이상 선택해 주세요.",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setStatus("error");
      setMessage("기존 상품 엑셀 파일을 하나 이상 선택해 주세요.");
      return;
    }

    setStatus("uploading");
    setMessage(`${files.length.toLocaleString()}개 카테고리 학습 요청을 접수하는 중입니다...`);

    const successfulRequests: TrainingProductRequest[] = [];
    const failureMessages: string[] = [];
    for (const selectedFile of files) {
      try {
        const body = await submitTrainingProductRequest(selectedFile);
        if (body.data) {
          successfulRequests.push(body.data);
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : "요청에 실패했습니다.";
        failureMessages.push(`${selectedFile.name}: ${reason}`);
      }
    }

    if (successfulRequests.length > 0) {
      setRequests((current) => [...successfulRequests].reverse().concat(current));
    }
    if (failureMessages.length === 0) {
      setStatus("success");
      setMessage(`${successfulRequests.length.toLocaleString()}개 카테고리 학습 요청이 접수되었습니다.`);
    } else {
      setStatus("error");
      setMessage(
        `${successfulRequests.length.toLocaleString()}개 접수, ${failureMessages.length.toLocaleString()}개 실패했습니다. ${failureMessages[0]}`,
      );
    }
  }

  return (
    <div className="grid gap-5">
      <UploadCard
        title="기존 상품으로 카테고리 학습하기"
        icon={BookOpenCheck}
        description="기존에 등록했던 상품 파일을 업로드하면 상품명과 카테고리의 관계를 확인한 뒤 학습에 반영하여 더욱 정확한 결과를 도출합니다."
        guide={(
          <div className="rounded-md border-l-4 border-teal-700 bg-teal-50 px-5 py-4 text-sm leading-6 text-slate-800">
            <h3 className="text-base font-black text-teal-950">업로드 방법</h3>
            <p className="mt-1 font-semibold">
              유플렛 → 상품수정 → 마이카테Y 선택 → 출력 항목에 상품명, 마이카테 체크 → 엑셀파일 출력 → 전체다운로드를 통해 기존에 등록했던 상품 파일을 다운받을 수 있습니다.
            </p>
            <p className="mt-1 font-semibold">각 파일은 최대 20MB까지 업로드할 수 있습니다.</p>
            <p className="mt-2 rounded-md bg-white px-3 py-2 font-bold text-slate-700">
              1행의 &apos;상품명&apos;과 &apos;마이카테&apos; 열을 기준으로 학습합니다. 정확한 데이터 처리를 위해 열 이름(컬럼명)을 변경하지 않고 업로드해 주시기 바랍니다.
            </p>
          </div>
        )}
        fileLabel={fileLabel}
        status={status}
        message={message}
        accept=".xlsx"
        multiple
        onFileChange={handleFileChange}
      >
        {files.length > 0 && (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
              {status === "uploading" ? "접수 중..." : "학습 요청하기"}
            </ActionButton>
          </form>
        )}
      </UploadCard>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
        <h2 className="text-lg font-black text-slate-950">내 학습 요청</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">학습 요청 처리는 하루 정도 걸릴 수 있습니다.</p>
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
