export type RequestState = "idle" | "ready" | "uploading" | "success" | "error";

export type CategoryJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type CategoryJobCreateResult = {
  jobId: number;
  status: CategoryJobStatus;
  message: string;
};

export type CategoryJobProgress = {
  jobId: number;
  status: CategoryJobStatus;
  totalCount: number;
  processedCount: number;
  progress: number;
  stage: string;
  message: string;
};

export type CategoryJobCreateResponse = {
  success: boolean;
  data?: CategoryJobCreateResult;
  message?: string;
  code?: string;
};

export type CategoryJobStatusResponse = {
  success: boolean;
  data?: CategoryJobProgress;
  message?: string;
  code?: string;
};

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
  message: string;
};

export type MyCategoryMappingUploadResponse = {
  success: boolean;
  data?: MyCategoryMappingUploadResult;
  message?: string;
  code?: string;
};

export type TrainingProductUploadResult = {
  userKey: string;
  sourceCount: number;
  sourceRowCount: number;
  validRowCount: number;
  unmappedRowCount: number;
  indexedProductCount: number;
  duplicateRowCount: number;
  conflictingTitleCount: number;
  message: string;
};

export type TrainingProductUploadResponse = {
  success: boolean;
  data?: TrainingProductUploadResult;
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
