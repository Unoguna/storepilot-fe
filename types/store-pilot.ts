export type RequestState = "idle" | "ready" | "uploading" | "success" | "error";

export type ProductExcelJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type AuthUser = {
  id: number;
  email: string;
};

export type AuthResult = {
  user: AuthUser;
};

export type AuthResponse = {
  success: boolean;
  data?: AuthResult;
  message?: string;
  code?: string;
};

export type AuthUserResponse = {
  success: boolean;
  data?: AuthUser;
  message?: string;
  code?: string;
};

export type ProductExcelJobCreateResult = {
  jobId: number;
  status: ProductExcelJobStatus;
  message: string;
};

export type ProductExcelJobProgress = {
  jobId: number;
  status: ProductExcelJobStatus;
  totalCount: number;
  processedCount: number;
  progress: number;
  stage: string;
  message: string;
  categoryElapsedMillis: number | null;
  keywordElapsedMillis: number | null;
};

export type ProductExcelJobCreateResponse = {
  success: boolean;
  data?: ProductExcelJobCreateResult;
  message?: string;
  code?: string;
};

export type ProductExcelJobStatusResponse = {
  success: boolean;
  data?: ProductExcelJobProgress;
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
  userId: number;
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
  userId: number;
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
