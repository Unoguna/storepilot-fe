"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { ResultRow } from "@/components/ui/result-row";
import { UploadCard } from "@/components/ui/upload-card";
import { uploadMyCategoryMappingFile } from "@/lib/api";
import { labelForFile } from "@/lib/format";
import { MyCategoryMappingUploadResult, RequestState } from "@/types/store-pilot";

export function MyCategoryMappingCard() {
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

  const uploadGuide = (
    <div className="grid gap-4 rounded-lg border border-teal-200 border-l-4 border-l-teal-700 bg-teal-50/70 p-5 shadow-sm">
      <div>
        <h3 className="text-base font-black text-teal-950">작성 방법</h3>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">
          셀포터 → 유플렛 → 마이카테관리 → (좌측 하단) 전체건 엑셀다운로드를 통해 다운받은 파일을 업로드해주세요.
        </p>
      </div>
      <p className="rounded-md border border-teal-100 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-700">
        1행의 &apos;마이카테&apos;, &apos;네이버카테&apos;, &apos;마이카테명&apos; 열을 기준으로 데이터를 추출합니다. 정확한 데이터 처리를 위해 열 이름(컬럼명)을 변경하지 않고 업로드해 주시기 바랍니다.
      </p>
    </div>
  );

  return (
    <UploadCard
      title="마이카테고리 업로드"
      icon={Upload}
      guide={uploadGuide}
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
          <ResultRow label="매핑 수" value={`${mappingResult.mappingCount.toLocaleString()}개`} />
          <ResultRow label="자동 연결" value={`${mappingResult.matchedCount.toLocaleString()}개`} />
        </div>
      )}
    </UploadCard>
  );
}
