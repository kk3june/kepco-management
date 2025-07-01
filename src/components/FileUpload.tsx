import { Alert, AlertDescription } from "@/components/ui/Alert";
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
import { AlertCircle, Download, File, Upload, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(selectedFiles)) {
        // 파일 크기 체크
        if (file.size > maxSize * 1024 * 1024) {
          setError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
          continue;
        }

        // 파일 확장자 체크
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
          setError(
            `지원하지 않는 파일 형식입니다. (${acceptedTypes.join(", ")})`
          );
          continue;
        }

        // 임시로 Storage 없이 데이터베이스에만 파일 정보 저장
        // 실제 구현에서는 Supabase Storage 사용
        const { error: dbError } = await supabase
          .from("customer_documents")
          .insert({
            customer_id: customerId,
            document_type: documentType,
            file_name: file.name,
            file_path: `temp/${customerId}/${documentType}/${Date.now()}_${
              file.name
            }`, // 임시 경로
            file_size: file.size,
            uploaded_by: "current_user", // 나중에 실제 사용자 정보로 변경
          });

        if (dbError) {
          console.error("Error saving file info:", dbError);
          if (dbError.code === "42P01") {
            setError(
              "데이터베이스 테이블이 아직 생성되지 않았습니다. 관리자에게 문의하세요."
            );
          } else {
            setError("파일 정보 저장에 실패했습니다.");
          }
          break;
        }
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

      fetchFiles();
      onChange?.();
    } catch (error) {
      console.error("Error:", error);
      setError("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleFileDownload = (filePath: string, fileName: string) => {
    // 임시로 다운로드 비활성화 (Storage 설정 후 활성화)
    setError("파일 다운로드 기능은 Storage 설정 후 사용할 수 있습니다.");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (customerId) {
      fetchFiles();
    }
  }, [customerId, documentType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <File className="mr-2 h-5 w-5" />
          {title}
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

        {/* 파일 업로드 영역 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !!error}
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
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file_size)} •{" "}
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleFileDownload(file.file_path, file.file_name)
                    }
                    disabled
                    title="Storage 설정 후 사용 가능"
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
