"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8080";
const UPLOAD_DOWNLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/upload-download`;

type UploadState = "idle" | "ready" | "uploading" | "success" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [productNameColumn, setProductNameColumn] = useState("상품명");
  const [categoryColumn, setCategoryColumn] = useState("");
  const [keywordCount, setKeywordCount] = useState(30);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("백엔드 서버를 켠 뒤 엑셀 파일을 업로드하세요.");

  const fileLabel = useMemo(() => {
    if (!file) {
      return "xlsx 또는 xls 파일을 선택하세요";
    }
    return `${file.name} (${formatBytes(file.size)})`;
  }, [file]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setStatus(selectedFile ? "ready" : "idle");
    setMessage(selectedFile ? "파일이 선택되었습니다. 다운로드 생성을 시작할 수 있습니다." : "엑셀 파일을 선택하세요.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("업로드할 엑셀 파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productNameColumn", productNameColumn);
    formData.append("categoryColumn", categoryColumn);
    formData.append("keywordCount", String(keywordCount));

    setStatus("uploading");
    setMessage("백엔드에서 엑셀 파일을 채우는 중입니다...");

    try {
      const response = await fetch(UPLOAD_DOWNLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const blob = await response.blob();
      const filename = parseFilename(response.headers.get("Content-Disposition")) ?? `keyword_result_${file.name}`;
      downloadBlob(blob, filename);
      setStatus("success");
      setMessage("완료되었습니다. 결과 엑셀 다운로드가 시작됩니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot MVP</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              엑셀 상품에 키워드와 마이카테를 채웁니다
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              상품명 컬럼을 기준으로 키워드와 마이카테를 채운 결과 엑셀을 바로 다운로드합니다.
              네이버 카테고리 컬럼은 파일에 없으면 비워둘 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-700">
            <Feature text="네이버 카테고리 컬럼은 없어도 업로드 가능" />
            <Feature text="L열 키워드, T열 마이카테 자동 입력" />
            <Feature text="완료 즉시 브라우저 자동 다운로드" />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)] sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Excel Upload</p>
            <h2 className="mt-1 text-xl font-black">결과 파일 생성</h2>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-700 hover:bg-teal-50/40">
              <span className="text-sm font-extrabold text-slate-700">엑셀 파일</span>
              <span className="min-h-6 break-all text-sm text-slate-600">{fileLabel}</span>
              <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="상품명 컬럼">
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  value={productNameColumn}
                  onChange={(event) => setProductNameColumn(event.target.value)}
                  required
                />
              </Field>

              <Field label="네이버 카테고리 컬럼">
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  placeholder="없으면 비워두기"
                  value={categoryColumn}
                  onChange={(event) => setCategoryColumn(event.target.value)}
                />
              </Field>

              <Field label="키워드 개수">
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  type="number"
                  min={1}
                  max={50}
                  value={keywordCount}
                  onChange={(event) => setKeywordCount(Number(event.target.value))}
                />
              </Field>
            </div>

            <button
              className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
              disabled={status === "uploading"}
              type="submit"
            >
              {status === "uploading" ? "처리 중..." : "엑셀 채우고 다운로드"}
            </button>

            <p className={statusClassName(status)}>{message}</p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">✓</span>
      <span>{text}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-700">
      {label}
      {children}
    </label>
  );
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

function statusClassName(status: UploadState) {
  const base = "min-h-6 text-sm font-bold";
  if (status === "success") {
    return `${base} text-teal-700`;
  }
  if (status === "error") {
    return `${base} text-red-600`;
  }
  return `${base} text-slate-500`;
}
