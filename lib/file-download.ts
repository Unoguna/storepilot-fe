import { FileSystemFileHandle, WindowWithSavePicker } from "@/types/store-pilot";

export async function chooseSaveHandle(
  suggestedName: string,
  description: string,
  accept: Record<string, string[]>,
): Promise<FileSystemFileHandle | null | "cancelled"> {
  const savePicker = (window as WindowWithSavePicker).showSaveFilePicker;
  if (!savePicker) {
    return null;
  }

  try {
    return await savePicker({
      suggestedName,
      types: [
        {
          description,
          accept,
        },
      ],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    throw error;
  }
}

export async function saveBlobToHandle(blob: Blob, fileHandle: FileSystemFileHandle) {
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function parseFilename(contentDisposition: string | null) {
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

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
