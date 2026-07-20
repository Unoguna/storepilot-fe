"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import {
  downloadImageZip,
  createProductExcelJob,
  downloadProductExcelJobResult,
  getProductExcelJobStatus,
} from "@/lib/api";
import { chooseSaveHandle, downloadBlob, parseFilename, saveBlobToHandle } from "@/lib/file-download";
import { labelForFile, removeExcelExtension } from "@/lib/format";
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

export function ProductExcelCard() {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [excelStatus, setExcelStatus] = useState<RequestState>("idle");
  const [excelMessage, setExcelMessage] = useState("");
  const [jobProgress, setJobProgress] = useState<ProductExcelJobProgress | null>(null);
  const [imageStatus, setImageStatus] = useState<RequestState>("idle");
  const [imageMessage, setImageMessage] = useState("");

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setExcelStatus(selectedFile ? "ready" : "idle");
    setJobProgress(null);
    setImageStatus(selectedFile ? "ready" : "idle");
    setExcelMessage(selectedFile ? "상품 엑셀 파일이 선택되었습니다." : "상품 엑셀 파일을 선택하세요.");
    setImageMessage(selectedFile ? "이미지 ZIP을 저장할 수 있습니다." : "상품 엑셀 파일을 선택하세요.");
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
      const createBody = await createProductExcelJob(productFile);
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

  async function handleImageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productFile) {
      setImageStatus("error");
      setImageMessage("이미지를 저장할 상품 엑셀 파일을 선택해주세요.");
      return;
    }

    const fallbackFilename = `product_images_${removeExcelExtension(productFile.name)}.zip`;
    const saveHandle = await chooseSaveHandle(fallbackFilename, "ZIP archive", {
      "application/zip": [".zip"],
    });
    if (saveHandle === "cancelled") {
      setImageStatus("ready");
      setImageMessage("저장 위치 선택이 취소되었습니다.");
      return;
    }

    setImageStatus("uploading");
    setImageMessage("목록이미지1 URL의 이미지를 ZIP으로 묶는 중입니다...");

    try {
      const response = await downloadImageZip(productFile);
      const blob = await response.blob();
      const responseFilename = parseFilename(response.headers.get("Content-Disposition")) ?? fallbackFilename;
      const savedCount = response.headers.get("X-Saved-Image-Count") ?? "0";
      const failedCount = response.headers.get("X-Failed-Image-Count") ?? "0";

      if (saveHandle) {
        await saveBlobToHandle(blob, saveHandle);
      } else {
        downloadBlob(blob, responseFilename);
      }

      setImageStatus("success");
      setImageMessage(`이미지 ZIP 저장 완료: 성공 ${Number(savedCount).toLocaleString()}개, 실패/건너뜀 ${Number(failedCount).toLocaleString()}개`);
    } catch (error) {
      setImageStatus("error");
      setImageMessage(error instanceof Error ? error.message : "이미지 ZIP 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      title="상품 엑셀 업로드"
      fileLabel={productFileLabel}
      status={excelStatus === "uploading" ? excelStatus : imageStatus === "uploading" ? imageStatus : excelStatus}
      message=""
      onFileChange={handleProductFileChange}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <form className="grid gap-2" onSubmit={handleExcelSubmit}>
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

        <form className="grid gap-2" onSubmit={handleImageSubmit}>
          <ActionButton disabled={imageStatus === "uploading"} loading={imageStatus === "uploading"}>
            {imageStatus === "uploading" ? "ZIP 저장 중..." : "이미지 ZIP 저장"}
          </ActionButton>
          <p className={statusClassName(imageStatus)}>{imageMessage}</p>
        </form>
      </div>

    </UploadCard>
  );
}
