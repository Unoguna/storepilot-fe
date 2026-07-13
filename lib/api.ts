import {
  AuthResponse,
  AuthUserResponse,
  CategoryUploadResponse,
  MyCategoryMappingUploadResponse,
  ProductExcelJobCreateResponse,
  ProductExcelJobStatusResponse,
  TrainingProductUploadResponse,
} from "@/types/store-pilot";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

const EXCEL_DOWNLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/upload-download`;
const PRODUCT_EXCEL_JOB_URL = `${API_BASE}/api/v1/product-excel-jobs`;
const IMAGE_ZIP_DOWNLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/images/download-zip`;
const CATEGORY_UPLOAD_URL = `${API_BASE}/api/v1/admin/naver-categories/upload`;
const MY_CATEGORY_MAPPING_UPLOAD_URL = `${API_BASE}/api/v1/admin/my-category-mappings/upload`;
const TRAINING_PRODUCT_UPLOAD_URL = `${API_BASE}/api/v1/admin/training-products/rebuild`;
const AUTH_URL = `${API_BASE}/api/v1/auth`;

export async function signup(email: string, password: string, userKey: string) {
  const response = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, userKey }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AuthResponse;
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

export async function downloadFilledExcel(file: File, userKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("productNameColumn", "\uC0C1\uD488\uBA85");
  formData.append("categoryColumn", "");
  formData.append("keywordCount", "30");
  formData.append("userKey", userKey);

  const response = await fetchWithAuth(EXCEL_DOWNLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function createProductExcelJob(file: File) {
  const formData = new FormData();
  formData.append("file", file);

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

export async function downloadImageZip(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth(IMAGE_ZIP_DOWNLOAD_URL, {
    method: "POST",
    body: formData,
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

  const response = await fetchWithAuth(MY_CATEGORY_MAPPING_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as MyCategoryMappingUploadResponse;
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

async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}, retry = true) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });
  if (response.status !== 401 || !retry) {
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

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    return body.message ?? "요청에 실패했습니다.";
  }
  return "요청에 실패했습니다.";
}
