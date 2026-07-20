import { ChangeEvent } from "react";
import { RequestState } from "@/types/store-pilot";
import { statusClassName } from "@/components/ui/upload-status";

export function UploadCard({
  title,
  description,
  fileLabel,
  status,
  message,
  accept = ".xlsx,.xls",
  multiple = false,
  children,
  onFileChange,
}: {
  title: string;
  description?: string;
  fileLabel: string;
  status: RequestState;
  message: string;
  accept?: string;
  multiple?: boolean;
  children: React.ReactNode;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      </div>

      <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-700 hover:bg-teal-50/40">
        <span className="text-sm font-extrabold text-slate-700">엑셀 파일</span>
        <span className="min-h-6 break-all text-sm text-slate-600">{fileLabel}</span>
        <input className="sr-only" type="file" accept={accept} multiple={multiple} onChange={onFileChange} />
      </label>

      {children}

      {message && <p className={statusClassName(status)}>{message}</p>}
    </section>
  );
}
