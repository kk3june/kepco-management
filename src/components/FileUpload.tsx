import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { CustomerDocument } from "@/types/database";
import { AlertCircle, File, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FileUploadProps {
  customerId: string;
  documentType:
    | "business_license"
    | "electrical_diagram"
    | "power_usage_data"
    | "other";
  title: string;
  description: string;
  onChange?: () => void;
}

export function FileUpload({
  customerId,
  documentType,
  title,
  description,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<CustomerDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(false);

  useEffect(() => {
    checkStorageAvailability();
    if (customerId) {
      fetchFiles();
    }
  }, [customerId, documentType]);

  const checkStorageAvailability = async () => {
    try {
      // TODO: REST API로 파일 업로드 테스트 구현
      setStorageAvailable(true);
    } catch (error) {
      console.error("Storage availability check failed:", error);
      setStorageAvailable(false);
      setError("파일 업로드 서비스를 사용할 수 없습니다.");
    }
  };

  const fetchFiles = async () => {
    try {
      // TODO: REST API로 파일 목록 조회 구현
      const response = await apiClient.get<CustomerDocument[]>(
        `/api/files?customer_id=${customerId}&document_type=${documentType}`
      );

      if (response.data) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const addFactoryUsage = () => {
    setFiles([
      ...files,
      {
        id: `temp_${Date.now()}`,
        customer_id: customerId,
        document_type: documentType,
        file_name: "",
        file_path: "",
        file_size: 0,
        uploaded_by: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CustomerDocument,
    ]);
  };

  const removeFactoryUsage = async (index: number) => {
    const file = files[index];

    // 이미 저장된 항목이면 DB에서 삭제
    if (file.id && !file.id.startsWith("temp_")) {
      try {
        const response = await apiClient.delete(
          API_ENDPOINTS.FILES.DELETE(file.id)
        );

        if (response.error) {
          console.error("Error deleting file:", response.error);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        return;
      }
    }

    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.();
  };

  const updateFactoryUsage = (
    index: number,
    field: keyof CustomerDocument,
    value: string | number
  ) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setFiles(newFiles);
  };

  const saveFactoryUsages = async () => {
    if (!customerId) return;

    setUploading(true);
    try {
      // TODO: REST API로 파일 업로드 구현
      // 기존 데이터 삭제 후 새로 저장
      const deleteResponse = await apiClient.delete(
        `/api/files?customer_id=${customerId}&document_type=${documentType}`
      );

      if (deleteResponse.error) {
        console.error("Error deleting existing files:", deleteResponse.error);
        return;
      }

      // 빈 항목 제외하고 저장
      const validFiles = files.filter((file) => file.file_name.trim() !== "");

      if (validFiles.length > 0) {
        const insertData = validFiles.map((file) => ({
          customer_id: customerId,
          document_type: documentType,
          file_name: file.file_name,
          file_path: file.file_path,
          file_size: file.file_size,
          uploaded_by: file.uploaded_by,
        }));

        const insertResponse = await apiClient.post(
          API_ENDPOINTS.FILES.UPLOAD,
          insertData
        );

        if (insertResponse.error) {
          console.error("Error inserting files:", insertResponse.error);
          return;
        }
      }

      onChange?.();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  // 공장이 아니거나 단독 사용인 경우 표시하지 않음
  if (documentType !== "business_license") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!storageAvailable ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">
              파일 업로드 서비스를 사용할 수 없습니다.
            </p>
            <p className="text-sm text-gray-500 mt-1">관리자에게 문의하세요.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <File className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={file.file_name}
                      onChange={(e) =>
                        updateFactoryUsage(index, "file_name", e.target.value)
                      }
                      placeholder="파일명을 입력하세요"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFactoryUsage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={addFactoryUsage}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                파일 추가
              </Button>
              <Button
                type="button"
                onClick={saveFactoryUsages}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
