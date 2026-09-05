"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { ResultRow } from "@/components/ui/result-row";
import { UploadCard } from "@/components/ui/upload-card";
import { appendTrainingProductFiles } from "@/lib/api";
import { labelForFile, labelForFiles } from "@/lib/format";
import { ProductIndexAppendResult, RequestState } from "@/types/store-pilot";

export function TrainingProductAddCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [myCategoryFile, setMyCategoryFile] = useState<File | null>(null);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ProductIndexAppendResult | null>(null);

  const fileLabel = useMemo(() => labelForFiles(files), [files]);
  const myCategoryFileLabel = useMemo(() => labelForFile(myCategoryFile), [myCategoryFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
    setStatus(selectedFiles.length > 0 ? "ready" : "idle");
    setResult(null);
    setMessage(
      selectedFiles.length > 0
        ? `${selectedFiles.length.toLocaleString()}개 추가 상품 파일이 선택되었습니다.`
        : "추가할 상품 엑셀 파일을 하나 이상 선택하세요.",
    );
  }

  function handleMyCategoryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMyCategoryFile(selectedFile);
    setResult(null);
    setStatus(selectedFile ? "ready" : "idle");
    setMessage(selectedFile ? "마이카테고리 매핑 파일이 선택되었습니다." : "마이카테고리 매핑 파일을 선택하세요.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (files.length === 0 || !myCategoryFile) {
      setStatus("error");
      setMessage("추가 상품 파일과 마이카테고리 매핑 파일을 모두 선택해주세요.");
      return;
    }

    setStatus("uploading");
    setResult(null);
    setMessage("엑셀의 상품을 기존 상품 인덱스에 업로드하는 중입니다...");

    try {
      const body = await appendTrainingProductFiles(files, myCategoryFile);
      setResult(body.data ?? null);
      setStatus("success");
      setMessage(body.message ?? "추가 상품 업로드가 완료되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "추가 상품 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      title="추가 상품 업로드"
      icon={PackagePlus}
      fileInputLabel="추가 상품 엑셀 파일"
      fileLabel={fileLabel}
      status={status}
      message={message}
      accept=".xlsx"
      multiple
      onFileChange={handleFileChange}
    >
      <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-700 hover:bg-teal-50/40">
        <span className="text-sm font-extrabold text-slate-700">마이카테고리 매핑 파일</span>
        <span className="min-h-6 break-all text-sm text-slate-600">{myCategoryFileLabel}</span>
        <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={handleMyCategoryFileChange} />
      </label>

      {files.length > 0 && myCategoryFile && (
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <ActionButton disabled={status === "uploading"} loading={status === "uploading"}>
            {status === "uploading" ? "업로드 중..." : "추가 상품 업로드"}
          </ActionButton>
        </form>
      )}

      {result && (
        <div className="grid gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-950">
          <ResultRow label="업로드 파일" value={`${result.sourceCount.toLocaleString()}개`} />
          <ResultRow label="상품명 있는 행" value={`${result.sourceRowCount.toLocaleString()}개`} />
          <ResultRow label="추가 가능 행" value={`${result.validRowCount.toLocaleString()}개`} />
          <ResultRow label="매핑 없는 행" value={`${result.unmappedRowCount.toLocaleString()}개`} />
          <ResultRow label="추가 요청 상품" value={`${result.appendedProductCount.toLocaleString()}개`} />
          <ResultRow label="신규 추가 상품" value={`${result.insertedProductCount.toLocaleString()}개`} />
          <ResultRow label="기존 갱신 상품" value={`${result.updatedProductCount.toLocaleString()}개`} />
          <ResultRow label="현재 인덱싱 상품" value={`${result.indexedProductCount.toLocaleString()}개`} />
        </div>
      )}
    </UploadCard>
  );
}
