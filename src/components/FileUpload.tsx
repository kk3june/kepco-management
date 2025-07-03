import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { CustomerDocument } from "@/types/database";
import {
  AlertCircle,
  CheckCircle,
  Download,
  File,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FileUploadProps {
  customerId: string;
  documentType:
    | "business_license"
    | "electrical_diagram"
    | "power_usage_data"
    | "other";
  title: string;
  description: string;
  acceptedTypes?: string[];
  maxSize?: number; // MB
  onChange?: () => void;
}

export function FileUpload({
  customerId,
  documentType,
  title,
  description,
  acceptedTypes = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
  ],
  maxSize = 10,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<CustomerDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkStorageAvailability();
    if (customerId) {
      fetchFiles();
    }
  }, [customerId, documentType]);

  const checkStorageAvailability = async () => {
    try {
      // 실제 업로드 테스트로 Storage 가용성 확인
      const testFileName = `test/${Date.now()}_test.txt`;
      const testFile = new Blob(["test"], { type: "text/plain" });

      const { data, error } = await supabase.storage
        .from("customer-documents")
        .upload(testFileName, testFile, {
          upsert: true,
        });

      if (error) {
        console.error("Storage availability check failed:", error);
        setStorageAvailable(false);

        // 에러 타입에 따른 구체적인 메시지
        if (error.message.includes("bucket")) {
          setError(
            "Storage 버킷이 설정되지 않았습니다. 관리자에게 문의하세요."
          );
        } else if (error.message.includes("policy")) {
          setError("Storage 접근 권한이 없습니다. 관리자에게 문의하세요.");
        } else {
          setError(`Storage 오류: ${error.message}`);
        }
        return;
      }

      // 테스트 파일 삭제
      await supabase.storage.from("customer-documents").remove([testFileName]);

      setStorageAvailable(true);
      setError(null);
    } catch (error) {
      console.error("Storage availability check failed:", error);
      setStorageAvailable(false);
      setError("Storage 연결을 확인할 수 없습니다.");
    }
  };

  const fetchFiles = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("customer_id", customerId)
        .eq("document_type", documentType)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          setError(
            "데이터베이스 테이블이 아직 생성되지 않았습니다. 관리자에게 문의하세요."
          );
        } else {
          console.error("Error fetching files:", error);
          setError("파일 목록을 불러오는데 실패했습니다.");
        }
        return;
      }

      setFiles(data || []);
    } catch (error) {
      console.error("Error:", error);
      setError("파일 목록을 불러오는데 실패했습니다.");
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!storageAvailable) {
      setError("Storage가 설정되지 않아 파일 업로드가 불가능합니다.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const file of Array.from(selectedFiles)) {
        // 파일 크기 체크
        if (file.size > maxSize * 1024 * 1024) {
          setError(`파일 크기는 ${maxSize}MB 이하여야 합니다: ${file.name}`);
          continue;
        }

        // 파일 확장자 체크
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
          setError(
            `지원하지 않는 파일 형식입니다: ${file.name} (${acceptedTypes.join(
              ", "
            )})`
          );
          continue;
        }

        // 파일명 생성 (한글 파일명 지원)
        const timestamp = Date.now();
        const fileName = `${customerId}/${documentType}/${timestamp}_${file.name}`;

        // Supabase Storage에 파일 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("customer-documents")
          .upload(fileName, file, {
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          setError(
            `파일 업로드에 실패했습니다: ${file.name} - ${uploadError.message}`
          );
          continue;
        }

        // 데이터베이스에 파일 정보 저장
        const { error: dbError } = await supabase
          .from("customer_documents")
          .insert({
            customer_id: customerId,
            document_type: documentType,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            uploaded_by: "current_user", // 나중에 실제 사용자 정보로 변경
          });

        if (dbError) {
          console.error("Error saving file info:", dbError);
          // 업로드된 파일 삭제
          await supabase.storage
            .from("customer-documents")
            .remove([uploadData.path]);
          setError(
            `파일 정보 저장에 실패했습니다: ${file.name} - ${dbError.message}`
          );
          continue;
        }

        setSuccess(`파일이 성공적으로 업로드되었습니다: ${file.name}`);
      }

      if (!error) {
        fetchFiles();
        onChange?.();
      }
    } catch (error) {
      console.error("Error:", error);
      setError("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileDelete = async (fileId: string, filePath: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    try {
      setError(null);
      setSuccess(null);

      // Storage에서 파일 삭제
      if (storageAvailable) {
        const { error: storageError } = await supabase.storage
          .from("customer-documents")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Storage 삭제 실패해도 DB에서는 삭제 진행
        }
      }

      // 데이터베이스에서 파일 정보 삭제
      const { error: dbError } = await supabase
        .from("customer_documents")
        .delete()
        .eq("id", fileId);

      if (dbError) {
        console.error("Error deleting file info:", dbError);
        setError("파일 삭제에 실패했습니다.");
        return;
      }

      setSuccess("파일이 삭제되었습니다.");
      fetchFiles();
      onChange?.();
    } catch (error) {
      console.error("Error:", error);
      setError("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    if (!storageAvailable) {
      setError("Storage가 설정되지 않아 다운로드할 수 없습니다.");
      return;
    }

    try {
      setError(null);

      // 공개 URL 방식으로 먼저 시도
      const { data: publicUrlData } = supabase.storage
        .from("customer-documents")
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) {
        // 공개 URL로 다운로드
        const response = await fetch(publicUrlData.publicUrl);

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setSuccess("파일 다운로드가 시작되었습니다.");
          return;
        }
      }

      // 공개 URL 방식이 실패하면 download 메서드 사용
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .download(filePath);

      if (error) {
        console.error("Error downloading file:", error);
        setError(`파일 다운로드에 실패했습니다: ${error.message}`);
        return;
      }

      // 파일 다운로드
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("파일 다운로드가 시작되었습니다.");
    } catch (error) {
      console.error("Error:", error);
      setError("파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <File className="mr-2 h-5 w-5" />
          {title}
          {storageAvailable ? (
            <Badge variant="outline" className="ml-2 text-green-600">
              Storage 활성
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2 text-red-600">
              Storage 비활성
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 파일 업로드 영역 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !storageAvailable}
            >
              {uploading ? "업로드 중..." : "파일 선택"}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept={acceptedTypes.join(",")}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {acceptedTypes.join(", ")} 파일만 업로드 가능 (최대 {maxSize}MB)
          </p>
          {!storageAvailable && (
            <p className="mt-1 text-xs text-red-600">
              ⚠️ Storage 설정이 필요합니다
            </p>
          )}
        </div>

        {/* 업로드된 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">업로드된 파일</h4>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{file.file_name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.file_size)} •{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleFileDownload(file.file_path, file.file_name)
                    }
                    disabled={!storageAvailable}
                    title={
                      !storageAvailable
                        ? "Storage 설정 후 사용 가능"
                        : "다운로드"
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDelete(file.id, file.file_path)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
