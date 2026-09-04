"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Download, SearchCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import {
  createProductExcelJob,
  downloadProductExcelJobResult,
  getProductExcelJobStatus,
} from "@/lib/api";
import {
  chooseSaveHandle,
  downloadBlob,
  parseFilename,
  saveBlobToHandle,
} from "@/lib/file-download";
import { labelForFile } from "@/lib/format";
import { ProductExcelJobProgress, RequestState } from "@/types/store-pilot";

const STATUS_POLL_INTERVAL_MS = 1000;

function formatElapsedTime(milliseconds: number | null) {
  if (milliseconds === null) {
    return "측정 중";
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}초`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}분 ${remainingSeconds}초`;
}

export function ProductExcelCard({ isAdmin }: { isAdmin: boolean }) {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [excelStatus, setExcelStatus] = useState<RequestState>("idle");
  const [excelMessage, setExcelMessage] = useState("");
  const [jobProgress, setJobProgress] = useState<ProductExcelJobProgress | null>(null);
  const [includeSelectionDetails, setIncludeSelectionDetails] = useState(true);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setExcelStatus(selectedFile ? "ready" : "idle");
    setJobProgress(null);
    setExcelMessage(selectedFile ? "상품 엑셀 파일이 선택되었습니다." : "상품 엑셀 파일을 선택하세요.");
  }

  async function handleExcelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productFile) {
      setExcelStatus("error");
      setExcelMessage("업로드할 상품 엑셀 파일을 선택해주세요.");
      return;
    }

    const fallbackFilename = `keyword_result_${productFile.name}`;
    const saveHandle = await chooseSaveHandle(fallbackFilename, "Excel workbook", {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    });
    if (saveHandle === "cancelled") {
      setExcelStatus("ready");
      setExcelMessage("저장 위치 선택이 취소되었습니다.");
      return;
    }

    setExcelStatus("uploading");
    setJobProgress(null);
    setExcelMessage("카테고리 찾기 작업을 등록하는 중입니다...");

    try {
      const createBody = await createProductExcelJob(productFile, isAdmin && includeSelectionDetails);
      if (!createBody.data) {
        throw new Error(createBody.message ?? "카테고리 찾기 작업을 등록하지 못했습니다.");
      }

      const jobId = createBody.data.jobId;
      while (true) {
        const statusBody = await getProductExcelJobStatus(jobId);
        if (!statusBody.data) {
          throw new Error(statusBody.message ?? "작업 상태를 확인하지 못했습니다.");
        }

        const progress = statusBody.data;
        setJobProgress(progress);
        setExcelMessage(progress.message);

        if (progress.status === "FAILED") {
          throw new Error(progress.message || "카테고리 찾기 작업에 실패했습니다.");
        }
        if (progress.status === "COMPLETED") {
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
      }

      const response = await downloadProductExcelJobResult(jobId);
      const blob = await response.blob();
      const responseFilename = parseFilename(response.headers.get("Content-Disposition")) ?? fallbackFilename;

      if (saveHandle) {
        await saveBlobToHandle(blob, saveHandle);
      } else {
        downloadBlob(blob, responseFilename);
      }

      setExcelStatus("success");
      setExcelMessage(saveHandle ? "선택한 위치에 결과 엑셀이 저장되었습니다." : "브라우저 다운로드 폴더에 결과 엑셀이 저장되었습니다.");
    } catch (error) {
      setExcelStatus("error");
      setExcelMessage(error instanceof Error ? error.message : "엑셀 저장 중 오류가 발생했습니다.");
    }
  }

  const uploadGuide = (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900">작성 방법</h3>
          <p className="mt-1 text-sm text-slate-600">
            유플렛에서 다운받은 신상품 엑셀 파일을 그대로 올리시면 마이카테를 찾아드립니다.
          </p>
        </div>
        <a
          className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-700 bg-white px-4 text-sm font-extrabold text-teal-700 transition hover:bg-teal-50"
          download
          href="/templates/product-excel-job-example.xlsx"
        >
          <Download className="size-4" aria-hidden="true" />
          예시 파일 다운로드
        </a>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        1행의 &apos;상품명&apos; 열을 찾아 해당 열의 데이터를 읽으므로 &apos;상품명&apos;이라는 열 이름을 수정하면 안 됩니다.
      </p>
    </div>
  );

  return (
    <UploadCard
      title="카테고리 및 키워드 찾기"
      icon={SearchCheck}
      guide={uploadGuide}
      fileLabel={productFileLabel}
      status={excelStatus}
      message=""
      onFileChange={handleProductFileChange}
    >
      {productFile && (
        <div className="grid gap-3">
          <form className="grid gap-2" onSubmit={handleExcelSubmit}>
            {isAdmin && (
              <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  checked={includeSelectionDetails}
                  className="mt-1 h-4 w-4 accent-teal-700"
                  disabled={excelStatus === "uploading"}
                  onChange={(event) => setIncludeSelectionDetails(event.target.checked)}
                  type="checkbox"
                />
                <span className="grid gap-0.5">
                  <span>선택 과정 확인용 열 포함</span>
                  <span className="text-xs font-medium text-slate-500">
                    유사상품, 선택카테고리, LLM상태, 카테고리검색 열을 결과 엑셀에 표시합니다.
                  </span>
                </span>
              </label>
            )}
            <ActionButton disabled={excelStatus === "uploading"} loading={excelStatus === "uploading"}>
              {excelStatus === "uploading" ? "카테고리 찾는 중..." : "결과 엑셀 저장"}
            </ActionButton>
            <p className={statusClassName(excelStatus)}>{excelMessage}</p>
            {jobProgress && (
              <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                  <span>{jobProgress.stage}</span>
                  <span>{jobProgress.progress}%</span>
                </div>
                <div
                  aria-label="카테고리 찾기 진행률"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={jobProgress.progress}
                  className="h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                >
                  <div
                    className="h-full bg-teal-700 transition-[width] duration-300"
                    style={{ width: `${jobProgress.progress}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {jobProgress.processedCount.toLocaleString()} / {jobProgress.totalCount.toLocaleString()}개 처리
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-slate-200 pt-2 text-xs">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <dt className="truncate font-semibold text-slate-500">카테고리 분류</dt>
                    <dd className="shrink-0 font-bold text-slate-700">
                      {formatElapsedTime(jobProgress.categoryElapsedMillis)}
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <dt className="truncate font-semibold text-slate-500">키워드 생성</dt>
                    <dd className="shrink-0 font-bold text-slate-700">
                      {formatElapsedTime(jobProgress.keywordElapsedMillis)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </form>
        </div>
      )}

    </UploadCard>
  );
}
