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

export function labelForFiles(files: File[]) {
  if (files.length === 0) {
    return "xlsx 파일을 하나 이상 선택하세요.";
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (files.length === 1) {
    return `${files[0].name} (${formatBytes(totalSize)})`;
  }
  return `${files.length}개 파일 (${formatBytes(totalSize)})`;
}

export function removeExcelExtension(filename: string) {
  return filename.replace(/\.(xlsx|xls)$/i, "");
}
