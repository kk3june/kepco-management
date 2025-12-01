import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { CustomerFile } from "@/types/database";
import {
  AlertTriangle,
  Download,
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
  readOnly?: boolean;
}

export function FileUpload({
  documentType,
  title,
  description,
  files = [],
  onFileUpload,
  onFileDelete,
  readOnly = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<CustomerFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // 변전실도면과 기타는 최대 5개까지 첨부 가능, 나머지는 한 개씩만
  const isMultipleAllowed = documentType === "ELECTRICAL_DIAGRAM" || documentType === "ETC";
  const hasExistingFiles = files.length > 0;
  const maxFilesReached = isMultipleAllowed && files.length >= 5;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (50MB 제한)
      const maxSize = 50 * 1024 * 1024;
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

      // 변전실도면과 기타 최대 5개 제한 체크
      if (isMultipleAllowed && maxFilesReached) {
        const typeLabel = documentType === "ELECTRICAL_DIAGRAM" ? "변전실 도면" : "기타 문서";
        alert(
          `${typeLabel}은 최대 5개까지 첨부 가능합니다. 기존 파일을 삭제한 후 새 파일을 첨부해주세요.`
        );
        event.target.value = "";
        return;
      }

      // 중복 첨부 체크 (변전실도면이 아닌 경우)
      if (!isMultipleAllowed && hasExistingFiles) {
        setPendingFile(file);
        setIsDuplicateModalOpen(true);
        event.target.value = "";
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDuplicateConfirm = () => {
    if (pendingFile) {
      // 기존 파일 삭제는 상위 컴포넌트에서 처리하도록 안내만 표시
      alert("기존 파일을 먼저 삭제한 후 새 파일을 첨부해주세요.");
      setPendingFile(null);
      setIsDuplicateModalOpen(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !onFileUpload) return;

    setIsUploading(true);
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
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

  const handleFileView = (file: CustomerFile) => {
    if (!file.fileUrl) {
      alert("파일 URL을 찾을 수 없습니다.");
      return;
    }

    const ext = file.extension.toLowerCase();
    const contentType = file.contentType.toLowerCase();

    // 이미지 파일인 경우 미리보기 모달 열기
    if (
      ["jpg", "jpeg", "png", "gif", "bmp"].includes(ext) ||
      contentType.startsWith("image/")
    ) {
      setPreviewFile(file);
      setIsPreviewOpen(true);
    } else {
      // 다른 파일은 새 창에서 열기
      window.open(file.fileUrl, "_blank");
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

  const canPreviewFile = (file: CustomerFile) => {
    const ext = file.extension.toLowerCase();
    const contentType = file.contentType.toLowerCase();

    return (
      ["jpg", "jpeg", "png", "gif", "bmp", "pdf", "txt"].includes(ext) ||
      contentType.startsWith("image/") ||
      contentType === "application/pdf" ||
      contentType === "text/"
    );
  };

  const handleFileDownload = async (file: CustomerFile) => {
    if (!file.fileUrl) {
      alert("파일 URL을 찾을 수 없습니다.");
      return;
    }

    try {
      const response = await fetch(file.fileUrl, {
        mode: "cors",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      // CORS 에러 시 새 창에서 열기로 fallback
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
          {isMultipleAllowed ? (
            <div className="text-xs text-blue-600 flex items-center justify-between">
              <span>최대 5개까지 첨부 가능합니다.</span>
              <span className="text-gray-500">{files.length}/5</span>
            </div>
          ) : (
            <p className="text-xs text-orange-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />이 문서는 한 개의 파일만
              첨부 가능합니다.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 파일 업로드 섹션 */}
          {!readOnly && (
            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <input
                id={`file-${documentType}`}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`file-${documentType}`}
                  className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    파일 선택 (PDF, 이미지, 엑셀 등)
                  </span>
                </label>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  size="sm"
                  className="px-4"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                      업로드 중
                    </>
                  ) : (
                    "업로드"
                  )}
                </Button>
              </div>
              {selectedFile && (
                <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5 pl-1">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-gray-400">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

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
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canPreviewFile(file) && (
                        <Button
                          onClick={() => handleFileView(file)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 hover:bg-blue-50"
                          title="파일 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleFileDownload(file)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 hover:bg-green-50"
                        title="파일 다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button
                          onClick={() => handleFileDelete(file.fileId)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="파일 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 파일이 없을 때 */}
          {files.length === 0 && (
            <div className="text-center py-3 text-gray-400">
              <p className="text-sm">첨부된 파일이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 파일 미리보기 모달 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewFile?.originalFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {previewFile && (
              <img
                src={previewFile.fileUrl}
                alt={previewFile.originalFileName}
                className="max-w-full max-h-full object-contain"
                onError={() => alert("이미지를 불러올 수 없습니다.")}
              />
            )}
          </div>
          <div className="text-sm text-gray-500 text-center pt-4 border-t">
            파일 크기: {previewFile ? formatFileSize(previewFile.size) : ""}
          </div>
        </DialogContent>
      </Dialog>

      {/* 중복 첨부 모달 */}
      <Dialog
        open={isDuplicateModalOpen}
        onOpenChange={setIsDuplicateModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>중복 첨부 경고</DialogTitle>
            <DialogDescription>
              이 문서 유형은 여러 개의 파일을 첨부할 수 없습니다. 기존 파일을
              삭제하고 새로 첨부하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateModalOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDuplicateConfirm}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
