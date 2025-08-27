import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CustomerFile } from "@/types/database";
import {
  Eye,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  customerId: number;
  documentType: string;
  title: string;
  description: string;
  files?: CustomerFile[];
  onFileUpload?: (file: File) => void;
  onFileDelete?: (fileId: number) => void;
}

export function FileUpload({
  customerId,
  documentType,
  title,
  description,
  files = [],
  onFileUpload,
  onFileDelete,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (50MB 제한)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert("파일 크기는 50MB를 초과할 수 없습니다.");
        event.target.value = "";
        return;
      }

      // 파일 타입 검증
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(
          "지원되지 않는 파일 형식입니다. PDF, 이미지, 엑셀, CSV, 압축 파일만 업로드 가능합니다."
        );
        event.target.value = "";
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !onFileUpload) return;

    setIsUploading(true);
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById(
        `file-${documentType}`
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = (fileId: number) => {
    if (onFileDelete) {
      if (confirm("정말로 이 파일을 삭제하시겠습니까?")) {
        onFileDelete(fileId);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) {
      return <FileImage className="h-5 w-5 text-green-500" />;
    } else if (["xlsx", "xls", "csv"].includes(ext)) {
      return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
    } else if (["pdf"].includes(ext)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (["zip", "rar", "7z"].includes(ext)) {
      return <FileArchive className="h-5 w-5 text-purple-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDocumentTypeText = (type: string) => {
    const typeMap = {
      BUSINESS_LICENSE: "사업자 등록증",
      ELECTRICAL_DIAGRAM: "변전실 도면",
      GOMETA_EXCEL: "입주사별 전력사용량 자료",
      INSPECTION_REPORT: "실사 검토 보고서",
      CONTRACT: "계약서",
      SAVINGS_PROOF: "전기요금 절감 확인서",
      INSURANCE: "보증 보험 증권",
      KEPCO_APPLICATION: "한전 대관 신청서",
      OTHER: "기타 문서",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  console.log(files);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 파일 업로드 섹션 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              id={`file-${documentType}`}
              type="file"
              onChange={handleFileSelect}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              size="sm"
              className="flex items-center space-x-2"
            >
              {isUploading ? (
                <>업로드 중...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  업로드
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 첨부된 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">
              첨부된 파일 ({files.length}개)
            </h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file.extension)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.originalFileName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.extension.toUpperCase()}</span>
                        <span>•</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => console.log("file", file)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 hover:bg-blue-50"
                      title="파일 보기"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleFileDelete(file.fileId)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="파일 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 파일이 없을 때 */}
        {files.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">첨부된 파일이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">
              위의 업로드 버튼을 사용하여 파일을 추가하세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
