"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import {
  createProductExcelJob,
  downloadProductImage,
  downloadProductExcelJobResult,
  getProductExcelJobStatus,
  prepareImageDownloads,
} from "@/lib/api";
import {
  chooseDirectoryHandle,
  chooseSaveHandle,
  downloadBlob,
  parseFilename,
  saveBlobToDirectory,
  saveBlobToHandle,
} from "@/lib/file-download";
import { labelForFile } from "@/lib/format";
import { ProductExcelJobProgress, ProductImageDownloadFailure, RequestState } from "@/types/store-pilot";

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
  const [imageFailures, setImageFailures] = useState<ProductImageDownloadFailure[]>([]);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setExcelStatus(selectedFile ? "ready" : "idle");
    setJobProgress(null);
    setImageStatus(selectedFile ? "ready" : "idle");
    setImageFailures([]);
    setExcelMessage(selectedFile ? "상품 엑셀 파일이 선택되었습니다." : "상품 엑셀 파일을 선택하세요.");
    setImageMessage(selectedFile ? "이미지를 폴더에 저장할 수 있습니다." : "상품 엑셀 파일을 선택하세요.");
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

    const directoryHandle = await chooseDirectoryHandle();
    if (directoryHandle === null) {
      setImageStatus("error");
      setImageMessage("폴더 저장은 Chrome 또는 Edge 브라우저에서 사용할 수 있습니다.");
      return;
    }
    if (directoryHandle === "cancelled") {
      setImageStatus("ready");
      setImageMessage("저장 폴더 선택이 취소되었습니다.");
      return;
    }

    setImageStatus("uploading");
    setImageFailures([]);
    setImageMessage("목록이미지1 URL을 읽는 중입니다...");

    try {
      const prepareBody = await prepareImageDownloads(productFile);
      if (!prepareBody.data) {
        throw new Error(prepareBody.message ?? "이미지 다운로드 목록을 만들지 못했습니다.");
      }

      const { images } = prepareBody.data;
      const failures: ProductImageDownloadFailure[] = [...prepareBody.data.failures];
      let savedCount = 0;

      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        setImageMessage(`이미지 저장 중: ${index + 1} / ${images.length}`);
        try {
          const response = await downloadProductImage(image.url);
          const blob = await response.blob();
          await saveBlobToDirectory(blob, directoryHandle, image.filename);
          savedCount++;
        } catch (error) {
          failures.push({
            rowNumber: image.rowNumber,
            name: image.name,
            url: image.url,
            reason: error instanceof Error ? error.message : "이미지를 저장하지 못했습니다.",
          });
        }
      }

      setImageFailures(failures);
      setImageStatus("success");
      setImageMessage(`이미지 폴더 저장 완료: 성공 ${savedCount.toLocaleString()}개, 실패/건너뜀 ${failures.length.toLocaleString()}개`);
    } catch (error) {
      setImageStatus("error");
      setImageMessage(error instanceof Error ? error.message : "이미지 저장 중 오류가 발생했습니다.");
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
      {productFile && (
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
              {imageStatus === "uploading" ? "이미지 저장 중..." : "이미지 폴더 저장"}
            </ActionButton>
            <p className={statusClassName(imageStatus)}>{imageMessage}</p>
            {imageFailures.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-md border border-rose-200 bg-rose-50">
                <table className="min-w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-rose-100 text-rose-900">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 font-bold">행</th>
                      <th className="whitespace-nowrap px-3 py-2 font-bold">파일명</th>
                      <th className="whitespace-nowrap px-3 py-2 font-bold">이유</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-rose-950">
                    {imageFailures.map((failure) => (
                      <tr key={`${failure.rowNumber}-${failure.name}-${failure.url}`}>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold">{failure.rowNumber}</td>
                        <td className="min-w-24 px-3 py-2">{failure.name || "-"}</td>
                        <td className="min-w-48 px-3 py-2">{failure.reason || "이미지를 저장하지 못했습니다."}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </form>
        </div>
      )}

    </UploadCard>
  );
}
