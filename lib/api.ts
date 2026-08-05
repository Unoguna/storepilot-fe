import {
  AuthResponse,
  AuthUserResponse,
  CategoryUploadResponse,
  MessageResponse,
  MyCategoryMappingListResponse,
  MyCategoryMappingUploadResponse,
  ProductImageDownloadPrepareResponse,
  ProductExcelJobCreateResponse,
  ProductExcelJobStatusResponse,
  ProductCategoryFeedbackResponse,
  ProductCategoryStatsResponse,
  ProductIndexAppendResponse,
  QnaFaqListResponse,
  QnaFaqResponse,
  QnaQuestionListResponse,
  QnaQuestionResponse,
  TrainingProductUploadResponse,
} from "@/types/store-pilot";

const API_BASE = resolveApiBase();

const PRODUCT_EXCEL_JOB_URL = `${API_BASE}/api/v1/product-excel-jobs`;
const IMAGE_DOWNLOAD_PREPARE_URL = `${API_BASE}/api/v1/product-excel-jobs/images/prepare`;
const IMAGE_DOWNLOAD_URL = `${API_BASE}/api/v1/product-excel-jobs/images/download`;
const CATEGORY_UPLOAD_URL = `${API_BASE}/api/v1/admin/naver-categories/upload`;
const MY_CATEGORY_MAPPING_URL = `${API_BASE}/api/v1/my-category-mappings`;
const TRAINING_PRODUCT_UPLOAD_URL = `${API_BASE}/api/v1/admin/training-products/rebuild`;
const TRAINING_PRODUCT_APPEND_URL = `${API_BASE}/api/v1/admin/training-products/append`;
const TRAINING_PRODUCT_CATEGORY_STATS_URL = `${API_BASE}/api/v1/admin/training-products/category-stats`;
const TRAINING_PRODUCT_FEEDBACK_URL = `${API_BASE}/api/v1/admin/training-products/feedback`;
const AUTH_URL = `${API_BASE}/api/v1/auth`;
const QNA_URL = `${API_BASE}/api/v1/qna`;
const ADMIN_QNA_URL = `${API_BASE}/api/v1/admin/qna`;

export async function signup(email: string, password: string, passwordConfirm: string) {
  const response = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, passwordConfirm }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AuthResponse;
}

export async function verifyEmail(token: string) {
  const response = await fetch(`${AUTH_URL}/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MessageResponse;
}

export async function resendVerificationEmail(email: string) {
  const response = await fetch(`${AUTH_URL}/verification-email/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MessageResponse;
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${AUTH_URL}/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MessageResponse;
}

export async function resetPassword(token: string, password: string, passwordConfirm: string) {
  const response = await fetch(`${AUTH_URL}/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, password, passwordConfirm }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MessageResponse;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AuthResponse;
}

export async function getCurrentUser() {
  const response = await fetchWithAuth(`${AUTH_URL}/me`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AuthUserResponse;
}

export async function logout() {
  const response = await fetch(`${AUTH_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function deleteAccount() {
  const response = await fetchWithAuth(`${AUTH_URL}/me`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MessageResponse;
}

export async function createProductExcelJob(file: File, includeSelectionDetails: boolean) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("includeSelectionDetails", String(includeSelectionDetails));

  const response = await fetchWithAuth(PRODUCT_EXCEL_JOB_URL, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ProductExcelJobCreateResponse;
}

export async function getProductExcelJobStatus(jobId: number) {
  const response = await fetchWithAuth(`${PRODUCT_EXCEL_JOB_URL}/${jobId}/status`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ProductExcelJobStatusResponse;
}

export async function downloadProductExcelJobResult(jobId: number) {
  const response = await fetchWithAuth(`${PRODUCT_EXCEL_JOB_URL}/${jobId}/download`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response;
}

export async function prepareImageDownloads(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth(IMAGE_DOWNLOAD_PREPARE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ProductImageDownloadPrepareResponse;
}

export async function downloadProductImage(url: string) {
  const response = await fetchWithAuth(IMAGE_DOWNLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function uploadCategoryFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth(CATEGORY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CategoryUploadResponse;
}

export async function uploadMyCategoryMappingFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth(`${MY_CATEGORY_MAPPING_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as MyCategoryMappingUploadResponse;
}

export async function getMyCategoryMappings() {
  const response = await fetchWithAuth(MY_CATEGORY_MAPPING_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as MyCategoryMappingListResponse;
}

export async function uploadTrainingProductFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetchWithAuth(TRAINING_PRODUCT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as TrainingProductUploadResponse;
}

export async function appendTrainingProductFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetchWithAuth(TRAINING_PRODUCT_APPEND_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ProductIndexAppendResponse;
}

export async function getTrainingProductCategoryStats() {
  const response = await fetchWithAuth(TRAINING_PRODUCT_CATEGORY_STATS_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ProductCategoryStatsResponse;
}

export async function addTrainingProduct(productName: string, myCategoryCode: string) {
  const response = await fetchWithAuth(TRAINING_PRODUCT_FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName, myCategoryCode }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ProductCategoryFeedbackResponse;
}

export async function getQnaFaqs() {
  const response = await fetchWithAuth(`${QNA_URL}/faqs`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaFaqResponse;
}

export async function getAdminQnaFaqs() {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/faqs`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaFaqResponse;
}

export async function createQnaFaq(question: string, answer: string, sortOrder: number) {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/faqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, sortOrder }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaFaqResponse;
}

export async function updateQnaFaq(faqId: number, question: string, answer: string, sortOrder: number) {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/faqs/${faqId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, sortOrder }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaFaqListResponse;
}

export async function setQnaFaqActive(faqId: number, active: boolean) {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/faqs/${faqId}/${active ? "activate" : "deactivate"}`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaFaqListResponse;
}

export async function getMyQnaQuestions() {
  const response = await fetchWithAuth(`${QNA_URL}/questions`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaQuestionListResponse;
}

export async function createQnaQuestion(title: string, content: string) {
  const response = await fetchWithAuth(`${QNA_URL}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaQuestionResponse;
}

export async function getAdminQnaQuestions() {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/questions`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaQuestionListResponse;
}

export async function answerQnaQuestion(questionId: number, answer: string) {
  const response = await fetchWithAuth(`${ADMIN_QNA_URL}/questions/${questionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as QnaQuestionResponse;
}

async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}, retry = true) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });
  if ((response.status !== 401 && response.status !== 403) || !retry) {
    return response;
  }

  const refreshResponse = await fetch(`${AUTH_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!refreshResponse.ok) {
    return response;
  }
  return fetchWithAuth(input, init, false);
}

function resolveApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    return body.message ?? "요청에 실패했습니다.";
  }
  return "요청에 실패했습니다.";
}
