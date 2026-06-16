"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Feature } from "@/components/ui/feature";
import { UploadCard } from "@/components/ui/upload-card";
import { statusClassName } from "@/components/ui/upload-status";
import { downloadFilledExcel, downloadImageZip } from "@/lib/api";
import { chooseSaveHandle, downloadBlob, parseFilename, saveBlobToHandle } from "@/lib/file-download";
import { labelForFile, removeExcelExtension } from "@/lib/format";
import { RequestState } from "@/types/store-pilot";

export function ProductExcelCard() {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [userKey, setUserKey] = useState("");
  const [excelStatus, setExcelStatus] = useState<RequestState>("idle");
  const [excelMessage, setExcelMessage] = useState("상품 엑셀 파일을 선택한 뒤 결과 엑셀을 저장하세요.");
  const [imageStatus, setImageStatus] = useState<RequestState>("idle");
  const [imageMessage, setImageMessage] = useState("이미지는 ZIP 파일로 저장됩니다.");

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setExcelStatus(selectedFile ? "ready" : "idle");
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

    if (!userKey.trim()) {
      setExcelStatus("error");
      setExcelMessage("T열 마이카테고리를 찾으려면 사용자 식별자를 입력해주세요.");
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
    setExcelMessage("상품명으로 네이버 카테고리를 찾고 T열 마이카테고리를 채우는 중입니다...");

    try {
      const response = await downloadFilledExcel(productFile, userKey.trim());
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
      eyebrow="Step 3"
      title="상품 엑셀 업로드"
      description="상품명으로 네이버 카테고리를 찾고, 사용자별 매칭표에서 해당 마이카테고리를 찾아 T열에 씁니다."
      fileLabel={productFileLabel}
      status={excelStatus === "uploading" ? excelStatus : imageStatus === "uploading" ? imageStatus : excelStatus}
      message=""
      onFileChange={handleProductFileChange}
    >
      <label className="grid gap-2 text-sm font-extrabold text-slate-700">
        사용자 식별자
        <input
          className="h-11 rounded-md border border-slate-300 px-3 font-medium outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          placeholder="예: user-a"
          value={userKey}
          onChange={(event) => setUserKey(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <form className="grid gap-2" onSubmit={handleExcelSubmit}>
          <ActionButton disabled={excelStatus === "uploading"} loading={excelStatus === "uploading"}>
            {excelStatus === "uploading" ? "엑셀 저장 중..." : "결과 엑셀 저장"}
          </ActionButton>
          <p className={statusClassName(excelStatus)}>{excelMessage}</p>
        </form>

        <form className="grid gap-2" onSubmit={handleImageSubmit}>
          <ActionButton disabled={imageStatus === "uploading"} loading={imageStatus === "uploading"}>
            {imageStatus === "uploading" ? "ZIP 저장 중..." : "이미지 ZIP 저장"}
          </ActionButton>
          <p className={statusClassName(imageStatus)}>{imageMessage}</p>
        </form>
      </div>

      <div className="grid gap-2 text-sm text-slate-700">
        <Feature text="네이버 카테고리 직접 매칭 후 실패한 경우 AI 임베딩 검색 사용" />
        <Feature text="추천된 네이버 카테고리에 해당하는 사용자 마이카테고리를 T열에 작성" />
        <Feature text="이미지 ZIP 저장은 목록이미지1 URL만 별도로 처리" />
      </div>
    </UploadCard>
  );
}
