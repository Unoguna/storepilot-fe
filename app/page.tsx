"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8080";
const PRODUCT_UPLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/upload-download`;
const CATEGORY_UPLOAD_URL = `${API_BASE}/api/v1/admin/naver-categories/upload`;

type RequestState = "idle" | "ready" | "uploading" | "success" | "error";

type CategoryUploadResponse = {
  success: boolean;
  data?: {
    versionId: number;
    sourceFilename: string;
    rowCount: number;
    categoryCount: number;
    csvPath: string;
    message: string;
  };
  message?: string;
  code?: string;
};

export default function Home() {
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productStatus, setProductStatus] = useState<RequestState>("idle");
  const [productMessage, setProductMessage] = useState("상품 엑셀 파일을 업로드하면 결과 파일이 자동 다운로드됩니다.");

  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryStatus, setCategoryStatus] = useState<RequestState>("idle");
  const [categoryMessage, setCategoryMessage] = useState("네이버 카테고리 리스트 엑셀을 먼저 업로드해 기준 데이터를 갱신하세요.");
  const [categoryResult, setCategoryResult] = useState<CategoryUploadResponse["data"] | null>(null);

  const productFileLabel = useMemo(() => labelForFile(productFile), [productFile]);
  const categoryFileLabel = useMemo(() => labelForFile(categoryFile), [categoryFile]);

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setProductFile(selectedFile);
    setProductStatus(selectedFile ? "ready" : "idle");
    setProductMessage(selectedFile ? "상품 엑셀 파일이 선택되었습니다." : "상품 엑셀 파일을 선택하세요.");
  }

  function handleCategoryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setCategoryFile(selectedFile);
    setCategoryStatus(selectedFile ? "ready" : "idle");
    setCategoryResult(null);
    setCategoryMessage(selectedFile ? "네이버 카테고리 파일이 선택되었습니다." : "네이버 카테고리 파일을 선택하세요.");
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productFile) {
      setProductStatus("error");
      setProductMessage("업로드할 상품 엑셀 파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", productFile);
    formData.append("productNameColumn", "상품명");
    formData.append("categoryColumn", "");
    formData.append("keywordCount", "30");

    setProductStatus("uploading");
    setProductMessage("백엔드에서 엑셀 파일을 채우는 중입니다...");

    try {
      const response = await fetch(PRODUCT_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const blob = await response.blob();
      const filename = parseFilename(response.headers.get("Content-Disposition")) ?? `keyword_result_${productFile.name}`;
      downloadBlob(blob, filename);
      setProductStatus("success");
      setProductMessage("완료되었습니다. 결과 엑셀 다운로드가 시작됩니다.");
    } catch (error) {
      setProductStatus("error");
      setProductMessage(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryFile) {
      setCategoryStatus("error");
      setCategoryMessage("업로드할 네이버 카테고리 엑셀 파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", categoryFile);

    setCategoryStatus("uploading");
    setCategoryResult(null);
    setCategoryMessage("네이버 카테고리 기준 데이터를 갱신하는 중입니다...");

    try {
      const response = await fetch(CATEGORY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const body = (await response.json()) as CategoryUploadResponse;
      setCategoryResult(body.data ?? null);
      setCategoryStatus("success");
      setCategoryMessage(body.message ?? "네이버 카테고리 기준 데이터가 갱신되었습니다.");
    } catch (error) {
      setCategoryStatus("error");
      setCategoryMessage(error instanceof Error ? error.message : "카테고리 업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <section className="grid gap-4">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot MVP</p>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              카테고리 기준을 갱신하고 상품 엑셀을 자동 완성합니다
            </h1>
            <p className="text-base leading-7 text-slate-600">
              네이버 카테고리 리스트를 먼저 업로드한 뒤, 상품 엑셀을 올리면 L열 키워드와 T열 마이카테가 채워진 결과 파일을 받을 수 있습니다.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <UploadCard
            eyebrow="Step 1"
            title="네이버 카테고리 리스트 업로드"
            description="카테고리코드, 1차카테, 2차카테, 3차카테, 4차카테 컬럼을 가진 엑셀 파일을 업로드합니다."
            fileLabel={categoryFileLabel}
            buttonText="카테고리 기준 갱신"
            loadingText="갱신 중..."
            status={categoryStatus}
            message={categoryMessage}
            onFileChange={handleCategoryFileChange}
            onSubmit={handleCategorySubmit}
          >
            {categoryResult && (
              <div className="grid gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-950">
                <ResultRow label="버전" value={String(categoryResult.versionId)} />
                <ResultRow label="카테고리 수" value={`${categoryResult.categoryCount.toLocaleString()}개`} />
                <ResultRow label="CSV 캐시" value={categoryResult.csvPath} />
              </div>
            )}
          </UploadCard>

          <UploadCard
            eyebrow="Step 2"
            title="상품 엑셀 업로드"
            description="input.xlsx 형식의 상품 엑셀을 업로드하면 결과 파일이 자동으로 다운로드됩니다."
            fileLabel={productFileLabel}
            buttonText="엑셀 채우고 다운로드"
            loadingText="처리 중..."
            status={productStatus}
            message={productMessage}
            onFileChange={handleProductFileChange}
            onSubmit={handleProductSubmit}
          >
            <div className="grid gap-2 text-sm text-slate-700">
              <Feature text="상품명 컬럼은 '상품명'으로 고정" />
              <Feature text="키워드는 L열, 마이카테는 T열에 입력" />
              <Feature text="키워드 개수는 기본 30개" />
            </div>
          </UploadCard>
        </section>
      </div>
    </main>
  );
}

function UploadCard({
  eyebrow,
  title,
  description,
  fileLabel,
  buttonText,
  loadingText,
  status,
  message,
  children,
  onFileChange,
  onSubmit,
}: {
  eyebrow: string;
  title: string;
  description: string;
  fileLabel: string;
  buttonText: string;
  loadingText: string;
  status: RequestState;
  message: string;
  children: React.ReactNode;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <form className="grid gap-5" onSubmit={onSubmit}>
        <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-700 hover:bg-teal-50/40">
          <span className="text-sm font-extrabold text-slate-700">엑셀 파일</span>
          <span className="min-h-6 break-all text-sm text-slate-600">{fileLabel}</span>
          <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={onFileChange} />
        </label>

        {children}

        <button
          className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
          disabled={status === "uploading"}
          type="submit"
        >
          {status === "uploading" ? loadingText : buttonText}
        </button>

        <p className={statusClassName(status)}>{message}</p>
      </form>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">✓</span>
      <span>{text}</span>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[88px_1fr]">
      <span className="font-extrabold">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function labelForFile(file: File | null) {
  if (!file) {
    return "xlsx 또는 xls 파일을 선택하세요";
  }
  return `${file.name} (${formatBytes(file.size)})`;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    return body.message ?? "요청에 실패했습니다.";
  }
  return "요청에 실패했습니다.";
}

function parseFilename(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
  if (encodedMatch) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  return plainMatch?.[1] ?? null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusClassName(status: RequestState) {
  const base = "min-h-6 text-sm font-bold";
  if (status === "success") {
    return `${base} text-teal-700`;
  }
  if (status === "error") {
    return `${base} text-red-600`;
  }
  return `${base} text-slate-500`;
}
