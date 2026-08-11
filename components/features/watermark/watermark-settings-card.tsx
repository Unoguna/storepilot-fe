"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Stamp, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { statusClassName } from "@/components/ui/upload-status";
import { deleteMyWatermark, getMyWatermark, getMyWatermarkImage, saveMyWatermark } from "@/lib/api";
import { RequestState, UserWatermark, WatermarkPosition } from "@/types/store-pilot";

const POSITION_OPTIONS: Array<{ value: WatermarkPosition; label: string }> = [
  { value: "TOP_LEFT", label: "왼쪽 위" },
  { value: "TOP_RIGHT", label: "오른쪽 위" },
  { value: "CENTER", label: "가운데" },
  { value: "BOTTOM_LEFT", label: "왼쪽 아래" },
  { value: "BOTTOM_RIGHT", label: "오른쪽 아래" },
];

export function WatermarkSettingsCard() {
  const [watermark, setWatermark] = useState<UserWatermark | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [position, setPosition] = useState<WatermarkPosition>("BOTTOM_RIGHT");
  const [opacity, setOpacity] = useState(50);
  const [sizePercent, setSizePercent] = useState(20);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestState>("idle");
  const [message, setMessage] = useState("워터마크 설정을 불러오는 중입니다...");
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const body = await getMyWatermark();
        const loaded = body.data;
        if (!active || !loaded) {
          return;
        }
        setWatermark(loaded);
        setPosition(loaded.position);
        setOpacity(loaded.opacity);
        setSizePercent(loaded.sizePercent);
        setStatus(loaded.exists ? "ready" : "idle");
        setMessage(loaded.exists ? "저장된 워터마크가 있습니다." : "PNG 또는 JPEG 워터마크를 등록해주세요.");
        if (loaded.exists) {
          const response = await getMyWatermarkImage();
          const url = URL.createObjectURL(await response.blob());
          if (!active) {
            URL.revokeObjectURL(url);
            return;
          }
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          previewUrlRef.current = url;
          setPreviewUrl(url);
        }
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "워터마크 설정을 불러오지 못했습니다.");
        }
      }
    }

    load();
    return () => {
      active = false;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  async function loadSavedPreview() {
    const response = await getMyWatermarkImage();
    const url = URL.createObjectURL(await response.blob());
    replacePreviewUrl(url);
  }

  function replacePreviewUrl(url: string | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      replacePreviewUrl(URL.createObjectURL(file));
      setStatus("ready");
      setMessage(`${file.name} 파일을 선택했습니다.`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!watermark?.exists && !selectedFile) {
      setStatus("error");
      setMessage("워터마크 이미지 파일을 선택해주세요.");
      return;
    }

    setStatus("uploading");
    setMessage("워터마크를 저장하는 중입니다...");
    try {
      const body = await saveMyWatermark(selectedFile, position, opacity, sizePercent);
      if (!body.data) {
        throw new Error(body.message ?? "워터마크를 저장하지 못했습니다.");
      }
      setWatermark(body.data);
      setSelectedFile(null);
      await loadSavedPreview();
      setStatus("success");
      setMessage("워터마크를 저장했습니다. 상품 이미지 다운로드에서 적용할 수 있습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "워터마크를 저장하지 못했습니다.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("저장된 워터마크를 삭제하시겠습니까?")) {
      return;
    }
    setStatus("uploading");
    setMessage("워터마크를 삭제하는 중입니다...");
    try {
      await deleteMyWatermark();
      setWatermark({
        exists: false,
        originalFilename: null,
        fileSize: 0,
        position: "BOTTOM_RIGHT",
        opacity: 50,
        sizePercent: 20,
        updatedAt: null,
      });
      setSelectedFile(null);
      setPosition("BOTTOM_RIGHT");
      setOpacity(50);
      setSizePercent(20);
      replacePreviewUrl(null);
      setStatus("idle");
      setMessage("워터마크를 삭제했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "워터마크를 삭제하지 못했습니다.");
    }
  }

  const busy = status === "uploading";

  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,33,38,0.08)]">
      <div>
        <div className="flex items-center gap-2">
          <Stamp className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
          <h2 className="text-xl font-black">워터마크 설정</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          사용자 계정에 워터마크 이미지와 표시 설정을 저장합니다. PNG 투명 배경을 권장합니다.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-700 hover:bg-teal-50/40">
          <span className="text-sm font-extrabold text-slate-700">워터마크 이미지</span>
          <span className="min-h-6 break-all text-sm text-slate-600">
            {selectedFile?.name ?? watermark?.originalFilename ?? "PNG 또는 JPEG 파일을 선택하세요. (최대 2MB)"}
          </span>
          <input
            accept="image/png,image/jpeg"
            className="sr-only"
            disabled={busy}
            onChange={handleFileChange}
            type="file"
          />
        </label>

        {previewUrl && (
          <div className="grid min-h-64 place-items-center rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] p-6">
            <Image alt="워터마크 미리보기" className="max-h-56 w-auto object-contain" height={224} src={previewUrl} unoptimized width={400} />
          </div>
        )}

        <label className="grid gap-2 text-sm font-extrabold text-slate-700">
          표시 위치
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-700"
            disabled={busy}
            onChange={(event) => setPosition(event.target.value as WatermarkPosition)}
            value={position}
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <RangeSetting label="불투명도" min={10} max={100} value={opacity} disabled={busy} onChange={setOpacity} />
        <RangeSetting label="이미지 너비 대비 크기" min={5} max={50} value={sizePercent} disabled={busy} onChange={setSizePercent} />

        {watermark?.exists && (
          <p className="text-xs font-semibold text-slate-500">
            저장된 파일 크기: {formatBytes(watermark.fileSize)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={busy || (!watermark?.exists && !selectedFile)} loading={busy}>
            {busy ? "저장 중..." : watermark?.exists ? "워터마크 수정" : "워터마크 등록"}
          </ActionButton>
          {watermark?.exists && (
            <button
              className="flex h-12 items-center gap-2 rounded-md border border-rose-200 px-5 font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
              disabled={busy}
              onClick={handleDelete}
              type="button"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              삭제
            </button>
          )}
        </div>
      </form>

      {message && <p className={statusClassName(status)}>{message}</p>}
    </section>
  );
}

function RangeSetting({
  label,
  min,
  max,
  value,
  disabled,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-extrabold text-slate-700">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <strong className="text-teal-800">{value}%</strong>
      </span>
      <input
        className="w-full accent-teal-700"
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <span className="flex justify-between text-xs font-semibold text-slate-500">
        <span>{min}%</span>
        <span>{max}%</span>
      </span>
    </label>
  );
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  return `${(value / 1024).toFixed(1)} KB`;
}
