import { supabase } from "./supabase";

export const BUCKET_NAME = "customer-documents"; // 하이픈 사용 (Supabase 표준)

// Storage 버킷 존재 확인 (디버깅 강화)
export async function checkStorageAvailability(): Promise<boolean> {
  try {
    console.log("🔍 Checking storage availability for bucket:", BUCKET_NAME);

    const { data, error } = await supabase.storage.listBuckets();

    console.log("📦 Storage response - data:", data);
    console.log("❌ Storage response - error:", error);

    if (error) {
      console.error("Storage check error:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No buckets found in this Supabase project");
      return false;
    }

    const bucketNames = data.map((bucket) => bucket.name);
    console.log("📋 Available bucket names:", bucketNames);

    const bucketExists = data.some((bucket) => bucket.name === BUCKET_NAME);
    console.log("✅ Target bucket exists:", bucketExists);

    if (!bucketExists) {
      console.warn(
        `⚠️ Bucket "${BUCKET_NAME}" not found. Available buckets:`,
        bucketNames
      );
    }

    return bucketExists;
  } catch (error) {
    console.error("Storage availability check failed:", error);
    return false;
  }
}

// 파일 업로드 (디버깅 강화)
export async function uploadFile(
  file: File,
  path: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log("📤 Uploading file:", {
      fileName: file.name,
      path,
      size: file.size,
    });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        upsert: false,
      });

    console.log("📤 Upload result - data:", data);
    console.log("❌ Upload result - error:", error);

    if (error) {
      console.error("Upload failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Upload successful:", data.path);
    return { success: true, data };
  } catch (error) {
    console.error("Upload exception:", error);
    return { success: false, error: "Upload failed" };
  }
}

// 파일 다운로드
export async function downloadFile(
  path: string
): Promise<{ success: boolean; data?: Blob; error?: string }> {
  try {
    console.log("📥 Downloading file from path:", path);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) {
      console.error("Download failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Download successful");
    return { success: true, data };
  } catch (error) {
    console.error("Download exception:", error);
    return { success: false, error: "Download failed" };
  }
}

// 파일 삭제
export async function deleteFile(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🗑️ Deleting file from path:", path);

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("Delete failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Delete successful");
    return { success: true };
  } catch (error) {
    console.error("Delete exception:", error);
    return { success: false, error: "Delete failed" };
  }
}

// 파일 목록 조회 (새로 추가)
export async function listFiles(
  prefix?: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log("📋 Listing files with prefix:", prefix);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(prefix, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      console.error("List files failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ List files successful:", data?.length, "files found");
    return { success: true, data };
  } catch (error) {
    console.error("List files exception:", error);
    return { success: false, error: "List failed" };
  }
}

// 파일 경로 생성 (한글 파일명 처리 개선)
export function generateFilePath(
  customerId: string,
  documentType: string,
  fileName: string,
  userId?: string // 익명 사용자 지원
): string {
  const timestamp = Date.now();

  // 한글 파일명을 안전한 영문으로 변환
  const sanitizedFileName = sanitizeFileName(fileName);

  // 사용자 ID가 있으면 포함 (보안 강화)
  if (userId) {
    return `${userId}/${customerId}/${documentType}/${timestamp}_${sanitizedFileName}`;
  }

  return `${customerId}/${documentType}/${timestamp}_${sanitizedFileName}`;
}

// 파일명 안전화 (한글 처리 개선)
export function sanitizeFileName(fileName: string): string {
  // 파일 확장자 분리
  const lastDotIndex = fileName.lastIndexOf(".");
  const name =
    lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

  // 한글 및 특수문자를 안전한 문자로 변환
  const safeName = name
    .replace(/[^\w\s-]/g, "") // 영문, 숫자, 공백, 하이픈만 허용
    .replace(/\s+/g, "_") // 공백을 언더스코어로 변환
    .replace(/_{2,}/g, "_") // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, "") // 시작과 끝의 언더스코어 제거
    .toLowerCase(); // 소문자로 변환

  // 이름이 비어있으면 타임스탬프 사용
  const finalName = safeName || `file_${Date.now()}`;

  return finalName + extension.toLowerCase();
}

// 브라우저에서 파일 다운로드 실행
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 파일 타입 검증
export function validateFileType(file: File, acceptedTypes: string[]): boolean {
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
  return acceptedTypes.includes(fileExtension);
}

// 파일 크기 검증
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

// Storage 연결 테스트 (디버깅용)
export async function testStorageConnection(): Promise<void> {
  console.log("🧪 Testing Supabase Storage connection...");

  try {
    // 1. 환경 변수 확인
    console.log("🔧 Environment check:");
    console.log("  VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log(
      "  VITE_SUPABASE_ANON_KEY:",
      import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing"
    );

    // 2. 버킷 목록 조회
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();
    console.log("📦 Buckets:", buckets);
    console.log("❌ Buckets error:", bucketsError);

    // 3. 특정 버킷 파일 목록 조회
    if (buckets && buckets.length > 0) {
      const { data: files, error: filesError } = await supabase.storage
        .from(BUCKET_NAME)
        .list();
      console.log("📁 Files in bucket:", files);
      console.log("❌ Files error:", filesError);
    }

    // 4. 작은 테스트 파일 업로드 시도
    const testFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });
    const testPath = `test/${Date.now()}_test.txt`;

    const uploadResult = await uploadFile(testFile, testPath);
    console.log("📤 Test upload result:", uploadResult);

    // 5. 테스트 파일 삭제
    if (uploadResult.success) {
      const deleteResult = await deleteFile(testPath);
      console.log("🗑️ Test cleanup result:", deleteResult);
    }
  } catch (error) {
    console.error("🚨 Storage test failed:", error);
  }
}

// 개발 모드에서만 자동 테스트 실행
if (import.meta.env.DEV) {
  // 페이지 로드 후 잠시 대기하고 테스트 실행
  setTimeout(() => {
    console.log("🚀 Auto-running storage test in dev mode...");
    testStorageConnection();
  }, 2000);
}
