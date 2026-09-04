"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, ImageDown } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { downloadImageFailureExcel, downloadProductImage, getMyWatermark, prepareImageDownloads } from "@/lib/api";
import {
  chooseDirectoryHandle,
  chooseSaveHandle,
  downloadBlob,
  parseFilename,
  saveBlobToDirectory,
  saveBlobToHandle,
} from "@/lib/file-download";
import { labelForFile } from "@/lib/format";
import { FileSystemDirectoryHandle, ProductImageDownloadFailure, RequestState } from "@/types/store-pilot";

const IMAGE_DOWNLOAD_CONCURRENCY = 3;

export function ProductImageDownloadCard() {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imageStatus, setImageStatus] = useState<RequestState>("idle");
  const [imageMessage, setImageMessage] = useState("");
  const [imageFailures, setImageFailures] = useState<ProductImageDownloadFailure[]>([]);
  const [failureExcelSaving, setFailureExcelSaving] = useState(false);
  const [targetSizePercent, setTargetSizePercent] = useState(70);
  const [watermarkExists, setWatermarkExists] = useState(false);
  const [applyWatermark, setApplyWatermark] = useState(false);
  const [watermarkLoading, setWatermarkLoading] = useState(true);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

  useEffect(() => {
    let active = true;

    async function loadWatermark() {
      try {
        const body = await getMyWatermark();
        if (!active) {
          return;
        }
        const exists = body.data?.exists ?? false;
        setWatermarkExists(exists);
        setApplyWatermark(exists);
      } catch {
        if (active) {
          setWatermarkExists(false);
          setApplyWatermark(false);
        }
      } finally {
        if (active) {
          setWatermarkLoading(false);
        }
      }
    }

    loadWatermark();
    return () => {
      active = false;
    };
  }, []);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setImageStatus(selectedFile ? "ready" : "idle");
    setImageFailures([]);
    setImageMessage(selectedFile ? "이미지를 폴더에 저장할 수 있습니다." : "상품 엑셀 파일을 선택하세요.");
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
      let completedCount = 0;
      let nextIndex = 0;

      async function downloadWorker(saveDirectoryHandle: FileSystemDirectoryHandle) {
        while (nextIndex < images.length) {
          const image = images[nextIndex++];
          try {
            const response = await downloadProductImage(image.url, targetSizePercent, applyWatermark);
            const blob = await response.blob();
            await saveBlobToDirectory(blob, saveDirectoryHandle, image.filename);
            savedCount++;
          } catch (error) {
            failures.push({
              rowNumber: image.rowNumber,
              name: image.name,
              url: image.url,
              reason: error instanceof Error ? error.message : "이미지를 저장하지 못했습니다.",
            });
          } finally {
            completedCount++;
            setImageMessage(`이미지 저장 중: ${completedCount} / ${images.length}`);
          }
        }
      }

      const workerCount = Math.min(IMAGE_DOWNLOAD_CONCURRENCY, images.length);
      await Promise.all(Array.from({ length: workerCount }, () => downloadWorker(directoryHandle)));

      failures.sort((first, second) => first.rowNumber - second.rowNumber);
      setImageFailures(failures);
      setImageStatus("success");
      setImageMessage(`이미지 다운로드 완료: 성공 ${savedCount.toLocaleString()}개, 실패/건너뜀 ${failures.length.toLocaleString()}개`);
    } catch (error) {
      setImageStatus("error");
      setImageMessage(error instanceof Error ? error.message : "이미지 저장 중 오류가 발생했습니다.");
    }
  }

  async function handleFailureExcelDownload() {
    const fallbackFilename = "image_download_failures.xlsx";
    const saveHandle = await chooseSaveHandle(fallbackFilename, "Excel workbook", {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    });
    if (saveHandle === "cancelled") {
      return;
    }

    setFailureExcelSaving(true);
    try {
      const response = await downloadImageFailureExcel(imageFailures);
      const blob = await response.blob();
      const filename = parseFilename(response.headers.get("Content-Disposition")) ?? fallbackFilename;

      if (saveHandle) {
        await saveBlobToHandle(blob, saveHandle);
      } else {
        downloadBlob(blob, filename);
      }
      setImageMessage(`실패 목록 엑셀을 저장했습니다: ${imageFailures.length.toLocaleString()}건`);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : "실패 목록 엑셀을 저장하지 못했습니다.");
    } finally {
      setFailureExcelSaving(false);
    }
  }

  const uploadGuide = (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900">작성 방법</h3>
          <p className="mt-1 text-sm text-slate-600">
            유플렛에서 다운받은 신상품 엑셀 파일을 그대로 올리시면 목록이미지1의 이미지를 다운받습니다.
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
        1행의 &apos;목록이미지1&apos; 열에서 이미지 주소를 읽으므로 &apos;목록이미지1&apos;이라는 열 이름을 수정하면 안 됩니다.
      </p>
    </div>
  );

  return (
    <UploadCard
      title="상품 이미지 다운로드"
      icon={ImageDown}
      guide={uploadGuide}
      fileLabel={productFileLabel}
      status={imageStatus}
      message={imageMessage}
      onFileChange={handleProductFileChange}
    >
      {productFile && (
        <form className="grid gap-2" onSubmit={handleImageSubmit}>
          <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <label className="flex items-center gap-2 font-extrabold">
              <input
                checked={applyWatermark}
                className="size-4 accent-teal-700"
                disabled={imageStatus === "uploading" || watermarkLoading || !watermarkExists}
                onChange={(event) => setApplyWatermark(event.target.checked)}
                type="checkbox"
              />
              내 워터마크 적용
            </label>
            <p className="text-xs font-semibold text-slate-500">
              {watermarkLoading
                ? "워터마크 설정을 확인하는 중입니다..."
                : watermarkExists
                  ? "저장된 워터마크를 모든 다운로드 이미지에 적용할 수 있습니다."
                  : "등록된 워터마크가 없습니다."}
              {" "}
              <Link className="font-extrabold text-teal-700 underline underline-offset-2" href="/watermarks">
                워터마크 설정
              </Link>
            </p>
          </div>
          <label className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
            <span className="flex items-center justify-between gap-3">
              <span>목표 이미지 용량</span>
              <strong className="text-teal-800">원본의 {targetSizePercent}%</strong>
            </span>
            <input
              aria-label="목표 이미지 용량 비율"
              className="w-full accent-teal-700"
              disabled={imageStatus === "uploading"}
              max="100"
              min="30"
              onChange={(event) => setTargetSizePercent(Number(event.target.value))}
              step="1"
              type="range"
              value={targetSizePercent}
            />
            <span className="flex justify-between text-xs font-medium text-slate-500">
              <span>30%</span>
              <span>원본 파일 바이트 기준</span>
              <span>100%</span>
            </span>
          </label>
          <ActionButton disabled={imageStatus === "uploading"} loading={imageStatus === "uploading"}>
            {imageStatus === "uploading" ? "이미지 저장 중..." : "이미지 폴더 저장"}
          </ActionButton>
          {imageFailures.length > 0 && (
            <div className="grid gap-2">
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
              <ActionButton
                disabled={failureExcelSaving || imageStatus === "uploading"}
                loading={failureExcelSaving}
                onClick={handleFailureExcelDownload}
                type="button"
              >
                {failureExcelSaving ? "실패 목록 저장 중..." : "실패 목록 엑셀 저장"}
              </ActionButton>
            </div>
          )}
        </form>
      )}
    </UploadCard>
  );
}
