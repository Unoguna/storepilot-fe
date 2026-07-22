"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { ResultRow } from "@/components/ui/result-row";
import { UploadCard } from "@/components/ui/upload-card";
import { uploadMyCategoryMappingFile } from "@/lib/api";
import { labelForFile } from "@/lib/format";
import { MyCategoryMappingUploadResult, RequestState } from "@/types/store-pilot";

export function MyCategoryMappingCard() {
  const router = useRouter();
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [mappingStatus, setMappingStatus] = useState<RequestState>("idle");
  const [mappingMessage, setMappingMessage] = useState("");
  const [mappingResult, setMappingResult] = useState<MyCategoryMappingUploadResult | null>(null);

  const mappingFileLabel = useMemo(() => labelForFile(mappingFile), [mappingFile]);

  function handleMappingFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMappingFile(selectedFile);
    setMappingStatus(selectedFile ? "ready" : "idle");
    setMappingResult(null);
    setMappingMessage(selectedFile ? "마이카테고리 매칭 파일이 선택되었습니다." : "마이카테고리 매칭 파일을 선택하세요.");
  }

  async function handleMappingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mappingFile) {
      setMappingStatus("error");
      setMappingMessage("업로드할 마이카테고리 매칭 엑셀 파일을 선택해주세요.");
      return;
    }

    setMappingStatus("uploading");
    setMappingResult(null);
    setMappingMessage("마이카테고리와 네이버 카테고리 매칭을 저장하는 중입니다...");

    try {
      const body = await uploadMyCategoryMappingFile(mappingFile);
      setMappingResult(body.data ?? null);
      setMappingStatus("success");
      setMappingMessage(body.message ?? "마이카테고리 매칭 데이터가 저장되었습니다.");
    } catch (error) {
      setMappingStatus("error");
      setMappingMessage(error instanceof Error ? error.message : "마이카테고리 매칭 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      title="마이카테고리 업로드"
      fileLabel={mappingFileLabel}
      status={mappingStatus}
      message={mappingMessage}
      onFileChange={handleMappingFileChange}
    >
      {mappingFile && (
        <form className="grid gap-5" onSubmit={handleMappingSubmit}>
          <ActionButton disabled={mappingStatus === "uploading"} loading={mappingStatus === "uploading"}>
            {mappingStatus === "uploading" ? "저장 중..." : "마이카테 매칭 저장"}
          </ActionButton>
        </form>
      )}

      {mappingResult && (
        <div className="grid gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-950">
          <ResultRow label="버전" value={String(mappingResult.versionId)} />
          <ResultRow label="매핑 수" value={`${mappingResult.mappingCount.toLocaleString()}개`} />
          <ResultRow label="자동 연결" value={`${mappingResult.matchedCount.toLocaleString()}개`} />
          <button
            className="mt-2 h-11 w-fit rounded-md bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800"
            onClick={() => router.push("/")}
            type="button"
          >
            홈으로 이동
          </button>
        </div>
      )}
    </UploadCard>
  );
}
