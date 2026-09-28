export type RequestState = "idle" | "ready" | "uploading" | "success" | "error";

export type ProductExcelJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type AuthUser = {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
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

export type MessageResult = {
  message: string;
};

export type MessageResponse = {
  success: boolean;
  data?: MessageResult;
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
  resultExpiresAt: string | null;
  resultExpired: boolean;
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

export type ProductImageDownloadItem = {
  rowNumber: number;
  name: string;
  filename: string;
  url: string;
};

export type ProductImageDownloadFailure = {
  rowNumber: number;
  name: string;
  url: string;
  reason: string;
};

export type ProductImageDownloadPrepareResult = {
  imageCount: number;
  failedCount: number;
  images: ProductImageDownloadItem[];
  failures: ProductImageDownloadFailure[];
};

export type ProductImageDownloadPrepareResponse = {
  success: boolean;
  data?: ProductImageDownloadPrepareResult;
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

export type MyCategoryMappingItem = {
  id: number;
  myCategoryCode: string;
  naverCategoryValue: string;
  naverCategoryId: number;
  naverCategoryCode: string;
  naverCategoryFullPath: string;
};

export type MyCategoryMappingListResult = {
  mappingCount: number;
  mappings: MyCategoryMappingItem[];
};

export type MyCategoryMappingListResponse = {
  success: boolean;
  data?: MyCategoryMappingListResult;
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

export type WatermarkPosition = "TOP_LEFT" | "TOP_RIGHT" | "CENTER" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";

export type UserWatermark = {
  exists: boolean;
  originalFilename: string | null;
  fileSize: number;
  position: WatermarkPosition;
  opacity: number;
  sizePercent: number;
  updatedAt: string | null;
};

export type UserWatermarkResponse = {
  success: boolean;
  data?: UserWatermark;
  message?: string;
  code?: string;
};

export type ProductCategoryStatItem = {
  naverCategoryId: number;
  naverCategoryCode: string;
  naverCategoryFullPath: string;
  productCount: number;
};

export type ProductCategoryStatsResult = {
  categoryCount: number;
  totalProductCount: number;
  updatedAt: string | null;
  stats: ProductCategoryStatItem[];
};

export type ProductCategoryStatsResponse = {
  success: boolean;
  data?: ProductCategoryStatsResult;
  message?: string;
  code?: string;
};

export type ProductCategoryFeedbackResult = {
  feedbackId: number;
  userId: number;
  myCategoryCode: string;
  naverCategory: string;
  indexedProductCount: number;
  message: string;
};

export type ProductCategoryFeedbackResponse = {
  success: boolean;
  data?: ProductCategoryFeedbackResult;
  message?: string;
  code?: string;
};

export type ProductIndexAppendResult = {
  sourceCount: number;
  sourceRowCount: number;
  validRowCount: number;
  unmappedRowCount: number;
  appendedProductCount: number;
  insertedProductCount: number;
  updatedProductCount: number;
  indexedProductCount: number;
  message: string;
};

export type ProductIndexAppendResponse = {
  success: boolean;
  data?: ProductIndexAppendResult;
  message?: string;
  code?: string;
};

export type ProductExcelJobResult = {
  jobId: number;
  filename: string;
  productCount: number;
  completedAt: string | null;
  resultExpiresAt: string | null;
  resultExpired: boolean;
};

export type ProductExcelJobResultsResponse = {
  success: boolean;
  data?: ProductExcelJobResult[];
  message?: string;
  code?: string;
};

export type TrainingProductRequestStatus = "RECEIVED" | "REVIEWING" | "COMPLETED" | "REJECTED";

export type TrainingProductRequest = {
  id: number;
  userId: number;
  userEmail: string;
  originalFilename: string;
  fileSize: number;
  productCount: number;
  status: TrainingProductRequestStatus;
  fileAvailable: boolean;
  createdAt: string;
};

export type TrainingProductRequestResponse = {
  success: boolean;
  data?: TrainingProductRequest;
  message?: string;
  code?: string;
};

export type TrainingProductRequestListResponse = {
  success: boolean;
  data?: {
    requestCount: number;
    requests: TrainingProductRequest[];
  };
  message?: string;
  code?: string;
};

export type UserUsagePeriod = "TODAY" | "MONTH" | "TOTAL";

export type AdminUserUsage = {
  userId: number;
  email: string;
  role: "USER" | "ADMIN";
  categoryKeywordJobCount: number;
  processedProductCount: number;
  imageDownloadCount: number;
  categoryLearningRequestCount: number;
  lastUsedDate: string | null;
};

export type AdminUserUsageListResponse = {
  success: boolean;
  data?: {
    period: UserUsagePeriod;
    userCount: number;
    users: AdminUserUsage[];
  };
  message?: string;
  code?: string;
};

export type UserUsage = {
  period: UserUsagePeriod;
  categoryKeywordJobCount: number;
  processedProductCount: number;
  reservedProductCount: number;
  dailyProductLimit: number;
  imageDownloadCount: number;
  categoryLearningRequestCount: number;
  lastUsedDate: string | null;
};

export type UserUsageResponse = {
  success: boolean;
  data?: UserUsage;
  message?: string;
  code?: string;
};

export type QnaQuestionStatus = "WAITING" | "ANSWERED";

export type QnaFaq = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QnaFaqListResult = {
  faqCount: number;
  faqs: QnaFaq[];
};

export type QnaFaqListResponse = {
  success: boolean;
  data?: QnaFaqListResult;
  message?: string;
  code?: string;
};

export type QnaFaqResponse = {
  success: boolean;
  data?: QnaFaq;
  message?: string;
  code?: string;
};

export type QnaQuestion = {
  messages?: { content: string; admin: boolean; createdAt: string }[];
  id: number;
  userId: number;
  title: string;
  content: string;
  status: QnaQuestionStatus;
  answer: string | null;
  answeredBy: number | null;
  answeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QnaQuestionListResult = {
  questionCount: number;
  questions: QnaQuestion[];
};

export type QnaQuestionResponse = {
  success: boolean;
  data?: QnaQuestion;
  message?: string;
  code?: string;
};

export type QnaQuestionListResponse = {
  success: boolean;
  data?: QnaQuestionListResult;
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

export type FileSystemDirectoryHandle = {
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
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
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};
export type ProductMappingPreview = {
  products: Array<{
    rowNumber: number;
    productName: string;
    myCategoryCode: string;
    naverCategoryCode: string | null;
    naverCategoryFullPath: string | null;
    reason: string | null;
  }>;
};
