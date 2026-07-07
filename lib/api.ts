import {
  CategoryUploadResponse,
  MyCategoryMappingUploadResponse,
  ProductExcelJobCreateResponse,
  ProductExcelJobStatusResponse,
  TrainingProductUploadResponse,
} from "@/types/store-pilot";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8080";

const EXCEL_DOWNLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/upload-download`;
const PRODUCT_EXCEL_JOB_URL = `${API_BASE}/api/v1/product-excel-jobs`;
const IMAGE_ZIP_DOWNLOAD_URL = `${API_BASE}/api/v1/keyword-jobs/images/download-zip`;
const CATEGORY_UPLOAD_URL = `${API_BASE}/api/v1/admin/naver-categories/upload`;
const MY_CATEGORY_MAPPING_UPLOAD_URL = `${API_BASE}/api/v1/admin/my-category-mappings/upload`;
const TRAINING_PRODUCT_UPLOAD_URL = `${API_BASE}/api/v1/admin/training-products/rebuild`;

export async function downloadFilledExcel(file: File, userKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("productNameColumn", "\uC0C1\uD488\uBA85");
  formData.append("categoryColumn", "");
  formData.append("keywordCount", "30");
  formData.append("userKey", userKey);

  const response = await fetch(EXCEL_DOWNLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function createProductExcelJob(file: File, userKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userKey", userKey);

  const response = await fetch(PRODUCT_EXCEL_JOB_URL, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ProductExcelJobCreateResponse;
}

export async function getProductExcelJobStatus(jobId: number) {
  const response = await fetch(`${PRODUCT_EXCEL_JOB_URL}/${jobId}/status`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ProductExcelJobStatusResponse;
}

export async function downloadProductExcelJobResult(jobId: number) {
  const response = await fetch(`${PRODUCT_EXCEL_JOB_URL}/${jobId}/download`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response;
}

export async function downloadImageZip(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(IMAGE_ZIP_DOWNLOAD_URL, {
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

  const response = await fetch(CATEGORY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CategoryUploadResponse;
}

export async function uploadMyCategoryMappingFile(file: File, userKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userKey", userKey);

  const response = await fetch(MY_CATEGORY_MAPPING_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as MyCategoryMappingUploadResponse;
}

export async function uploadTrainingProductFiles(files: File[], userKey: string) {
  const formData = new FormData();
  formData.append("userKey", userKey);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(TRAINING_PRODUCT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as TrainingProductUploadResponse;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    return body.message ?? "요청에 실패했습니다.";
  }
  return "요청에 실패했습니다.";
}
