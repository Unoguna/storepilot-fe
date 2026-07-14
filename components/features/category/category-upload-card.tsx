"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { ResultRow } from "@/components/ui/result-row";
import { UploadCard } from "@/components/ui/upload-card";
import { uploadCategoryFile } from "@/lib/api";
import { labelForFile } from "@/lib/format";
import { CategoryUploadResult, RequestState } from "@/types/store-pilot";

export function CategoryUploadCard() {
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryStatus, setCategoryStatus] = useState<RequestState>("idle");
  const [categoryMessage, setCategoryMessage] = useState("네이버 카테고리 리스트 엑셀을 먼저 업로드해 기준 데이터를 갱신하세요.");
  const [categoryResult, setCategoryResult] = useState<CategoryUploadResult | null>(null);

  const categoryFileLabel = useMemo(() => labelForFile(categoryFile), [categoryFile]);

  function handleCategoryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setCategoryFile(selectedFile);
    setCategoryStatus(selectedFile ? "ready" : "idle");
    setCategoryResult(null);
    setCategoryMessage(selectedFile ? "네이버 카테고리 파일이 선택되었습니다." : "네이버 카테고리 파일을 선택하세요.");
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryFile) {
      setCategoryStatus("error");
      setCategoryMessage("업로드할 네이버 카테고리 엑셀 파일을 선택해주세요.");
      return;
    }

    setCategoryStatus("uploading");
    setCategoryResult(null);
    setCategoryMessage("네이버 카테고리 기준 데이터를 갱신하는 중입니다...");

    try {
      const body = await uploadCategoryFile(categoryFile);
      setCategoryResult(body.data ?? null);
      setCategoryStatus("success");
      setCategoryMessage(body.message ?? "네이버 카테고리 기준 데이터가 갱신되었습니다.");
    } catch (error) {
      setCategoryStatus("error");
      setCategoryMessage(error instanceof Error ? error.message : "카테고리 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      eyebrow="Step 1"
      title="네이버 카테고리 리스트 업로드"
      description="카테고리코드, 1차카테, 2차카테, 3차카테, 4차카테 컬럼을 가진 엑셀 파일을 업로드합니다."
      fileLabel={categoryFileLabel}
      status={categoryStatus}
      message={categoryMessage}
      onFileChange={handleCategoryFileChange}
    >
      <form className="grid gap-5" onSubmit={handleCategorySubmit}>
        <ActionButton disabled={categoryStatus === "uploading"} loading={categoryStatus === "uploading"}>
          {categoryStatus === "uploading" ? "갱신 중..." : "카테고리 기준 갱신"}
        </ActionButton>
      </form>
      {categoryResult && (
        <div className="grid gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-950">
          <ResultRow label="버전" value={String(categoryResult.versionId)} />
          <ResultRow label="카테고리 수" value={`${categoryResult.categoryCount.toLocaleString()}개`} />
          <ResultRow label="CSV 캐시" value={categoryResult.csvPath} />
        </div>
      )}
    </UploadCard>
  );
}
