export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function labelForFile(file: File | null) {
  if (!file) {
    return "xlsx 또는 xls 파일을 선택하세요.";
  }
  return `${file.name} (${formatBytes(file.size)})`;
}

export function removeExcelExtension(filename: string) {
  return filename.replace(/\.(xlsx|xls)$/i, "");
}
