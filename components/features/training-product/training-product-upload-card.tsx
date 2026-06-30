"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { ResultRow } from "@/components/ui/result-row";
import { UploadCard } from "@/components/ui/upload-card";
import { uploadTrainingProductFiles } from "@/lib/api";
import { labelForFiles } from "@/lib/format";
import { RequestState, TrainingProductUploadResult } from "@/types/store-pilot";

export function TrainingProductUploadCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [userKey, setUserKey] = useState("");
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState(
    "D열 상품명과 T열 마이카테고리를 읽고 네이버 카테고리로 변환해 공용 검색 인덱스를 갱신합니다.",
  );
  const [result, setResult] = useState<TrainingProductUploadResult | null>(null);

  const fileLabel = useMemo(() => labelForFiles(files), [files]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
    setStatus(selectedFiles.length > 0 ? "ready" : "idle");
    setResult(null);
    setMessage(
      selectedFiles.length > 0
        ? `${selectedFiles.length.toLocaleString()}개 기존 상품 파일이 선택되었습니다.`
        : "기존 상품 엑셀 파일을 하나 이상 선택하세요.",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userKey.trim()) {
      setStatus("error");
      setMessage("마이카테고리 매핑을 찾을 사용자 식별자를 입력해주세요.");
      return;
    }
    if (files.length === 0) {
      setStatus("error");
      setMessage("업로드할 기존 상품 엑셀 파일을 선택해주세요.");
      return;
    }

    setStatus("uploading");
    setResult(null);
    setMessage("기존 상품을 임베딩하고 유사 상품 검색 인덱스를 다시 만드는 중입니다...");

    try {
      const body = await uploadTrainingProductFiles(files, userKey.trim());
      setResult(body.data ?? null);
      setStatus("success");
      setMessage(body.message ?? "기존 상품 검색 인덱스가 갱신되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "기존 상품 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      eyebrow="Step 3"
      title="기존 상품 엑셀 업로드"
      description="T열 마이카테고리를 해당 사용자의 매핑표로 네이버 카테고리 코드로 변환해 공용 유사 상품 검색 데이터를 갱신합니다."
      fileLabel={fileLabel}
      status={status}
      message={message}
      accept=".xlsx"
      multiple
      onFileChange={handleFileChange}
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-extrabold text-slate-700">
          사용자 식별자
          <input
            className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            placeholder="예: uno1969"
            value={userKey}
            onChange={(event) => setUserKey(event.target.value)}
          />
        </label>

        <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
          {status === "uploading" ? "인덱스 생성 중..." : "기존 상품 인덱스 갱신"}
        </ActionButton>
      </form>

      {result && (
        <div className="grid gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-950">
          <ResultRow label="사용자" value={result.userKey} />
          <ResultRow label="업로드 파일" value={`${result.sourceCount.toLocaleString()}개`} />
          <ResultRow label="원본 상품 행" value={`${result.sourceRowCount.toLocaleString()}개`} />
          <ResultRow label="유효 상품 행" value={`${result.validRowCount.toLocaleString()}개`} />
          <ResultRow label="매핑 없는 행" value={`${result.unmappedRowCount.toLocaleString()}개`} />
          <ResultRow label="인덱싱 상품" value={`${result.indexedProductCount.toLocaleString()}개`} />
          <ResultRow label="중복 행" value={`${result.duplicateRowCount.toLocaleString()}개`} />
          <ResultRow label="카테고리 충돌" value={`${result.conflictingTitleCount.toLocaleString()}개`} />
        </div>
      )}
    </UploadCard>
  );
}
