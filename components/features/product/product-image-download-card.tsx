"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import { downloadProductImage, prepareImageDownloads } from "@/lib/api";
import { chooseDirectoryHandle, saveBlobToDirectory } from "@/lib/file-download";
import { labelForFile } from "@/lib/format";
import { ProductImageDownloadFailure, RequestState } from "@/types/store-pilot";

export function ProductImageDownloadCard() {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imageStatus, setImageStatus] = useState<RequestState>("idle");
  const [imageMessage, setImageMessage] = useState("");
  const [imageFailures, setImageFailures] = useState<ProductImageDownloadFailure[]>([]);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

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
      setImageMessage(`이미지 다운로드 완료: 성공 ${savedCount.toLocaleString()}개, 실패/건너뜀 ${failures.length.toLocaleString()}개`);
    } catch (error) {
      setImageStatus("error");
      setImageMessage(error instanceof Error ? error.message : "이미지 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <UploadCard
      title="상품 이미지 다운로드"
      fileLabel={productFileLabel}
      status={imageStatus}
      message={imageMessage}
      onFileChange={handleProductFileChange}
    >
      {productFile && (
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
      )}
    </UploadCard>
  );
}
