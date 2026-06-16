export type RequestState = "idle" | "ready" | "uploading" | "success" | "error";

export type CategoryUploadResult = {
  versionId: number;
  sourceFilename: string;
  rowCount: number;
  categoryCount: number;
  csvPath: string;
  message: string;
};

export type CategoryUploadResponse = {
  success: boolean;
  data?: CategoryUploadResult;
  message?: string;
  code?: string;
};

export type MyCategoryMappingUploadResult = {
  versionId: number;
  userKey: string;
  sourceFilename: string;
  rowCount: number;
  mappingCount: number;
  matchedCount: number;
  uploadedFilePath: string;
  message: string;
};

export type MyCategoryMappingUploadResponse = {
  success: boolean;
  data?: MyCategoryMappingUploadResult;
  message?: string;
  code?: string;
};

export type FileSystemWritableFileStream = WritableStream & {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

export type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

export type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
};

export type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};
