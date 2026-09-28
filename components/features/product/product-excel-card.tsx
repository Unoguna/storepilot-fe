"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SearchCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import { CategoryLearningCallout } from "@/components/features/training-product/category-learning-callout";
import {
  createProductExcelJob,
  downloadProductExcelJobResult,
  getProductExcelJobStatus,
  getMyUsage,
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
  const [todayProductUsage, setTodayProductUsage] = useState<{ used: number; limit: number } | null>(null);
  const [todayUsageLoaded, setTodayUsageLoaded] = useState(false);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);
  const usagePercent = todayProductUsage
    ? Math.min(100, Math.round((todayProductUsage.used / todayProductUsage.limit) * 100))
    : 0;

  const refreshTodayProductUsage = useCallback(async () => {
    try {
      const body = await getMyUsage("TODAY");
      if (!body.data) {
        setTodayProductUsage(null);
        return;
      }
      setTodayProductUsage({
        used: body.data.processedProductCount + body.data.reservedProductCount,
        limit: body.data.dailyProductLimit,
      });
    } catch {
      setTodayProductUsage(null);
    } finally {
      setTodayUsageLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMyUsage("TODAY")
      .then((body) => {
        if (!active) {
          return;
        }
        setTodayProductUsage(body.data
          ? {
              used: body.data.processedProductCount + body.data.reservedProductCount,
              limit: body.data.dailyProductLimit,
            }
          : null);
      })
      .catch(() => {
        if (active) {
          setTodayProductUsage(null);
        }
      })
      .finally(() => {
        if (active) {
          setTodayUsageLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
      void refreshTodayProductUsage();
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
          if (progress.resultExpired) {
            throw new Error(progress.message);
          }
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
    } finally {
      void refreshTodayProductUsage();
    }
  }

  const uploadGuide = (
    <div className="grid gap-4 rounded-lg border border-teal-200 border-l-4 border-l-teal-700 bg-teal-50/70 p-5 shadow-sm">
      <div>
        <h3 className="text-base font-black text-teal-950">작성 방법</h3>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">
          유플렛에서 다운받은 신상품 엑셀 파일을 그대로 올리시면 마이카테를 찾아드립니다.
        </p>
      </div>
      <p className="rounded-md border border-teal-100 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-700">
        1행의 &apos;상품명&apos; 열을 기준으로 데이터를 추출합니다. 정확한 데이터 처리를 위해 열 이름(컬럼명)을 변경하지 않고 업로드해 주시기 바랍니다.
        <span className="mt-1 block font-bold text-teal-800">
          한 번에 최대 1,500개의 상품을 처리할 수 있습니다.
        </span>
      </p>
    </div>
  );

  return (
    <div className="grid gap-5">
      <CategoryLearningCallout compact />
      <UploadCard
      title="카테고리 및 키워드 찾기"
      icon={SearchCheck}
      guide={uploadGuide}
      fileLabel={productFileLabel}
      status={excelStatus}
      message=""
      onFileChange={handleProductFileChange}
    >
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-slate-600">오늘 상품 처리량</span>
          <span className="font-black text-slate-900">
            {!todayUsageLoaded
              ? "확인 중..."
              : todayProductUsage
                ? `${todayProductUsage.used.toLocaleString()} / ${todayProductUsage.limit.toLocaleString()}개`
                : "사용량을 확인하지 못했습니다."}
          </span>
        </div>
        {todayProductUsage && (
          <>
            <div
              aria-label="오늘 상품 처리량"
              aria-valuemax={todayProductUsage.limit}
              aria-valuemin={0}
              aria-valuenow={todayProductUsage.used}
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
            >
              <div
                className={`h-full transition-[width] duration-300 ${usagePercent >= 100 ? "bg-red-600" : usagePercent >= 80 ? "bg-amber-500" : "bg-teal-700"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-semibold text-slate-500">
              남은 사용량 {Math.max(todayProductUsage.limit - todayProductUsage.used, 0).toLocaleString()}개
            </p>
          </>
        )}
      </div>
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
            {excelStatus !== "success" && (
              <ActionButton disabled={excelStatus === "uploading"} loading={excelStatus === "uploading"}>
                {excelStatus === "uploading" ? "카테고리 찾는 중..." : "결과 엑셀 저장"}
              </ActionButton>
            )}
            <p className="text-xs font-medium text-slate-500">
              결과 파일은 작업 완료 후 7일 동안 다운로드할 수 있습니다. 기기에 저장한 파일은 삭제되지 않습니다.
            </p>
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
    </div>
  );
}
