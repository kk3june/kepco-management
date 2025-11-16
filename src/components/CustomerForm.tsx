import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import {
  API_ENDPOINTS,
  apiClient,
  ApiResponse,
  getUploadUrls,
  uploadToS3,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import {
  formatBusinessNumber,
  formatPhoneNumber,
  formatUserId,
  validateUserId,
} from "@/lib/utils";
import {
  AddCustomerRequest,
  AttachmentFile,
  Engineer,
  EngineerResponse,
  LimitUserListResponse,
  Salesman,
  SalesmanResponse,
  UpdateTenantCompany,
} from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "./ui/Button";

const customerSchema = z.object({
  companyName: z.string().min(1, "업체명을 입력해주세요"),
  representative: z.string().min(1, "대표자를 입력해주세요"),
  businessNumber: z.string().min(1, "사업자등록번호를 입력해주세요"),
  businessType: z.string().min(1, "업종을 입력해주세요"),
  businessItem: z.string().min(1, "업태를 입력해주세요"),
  businessAddress: z.string().min(1, "사업장 주소를 입력해주세요"),
  managerName: z
    .string({
      required_error: "담당자명을 입력해주세요",
      invalid_type_error: "올바른 담당자명을 입력해주세요",
    })
    .min(1, "담당자명을 입력해주세요"),
  companyPhone: z.string().min(1, "회사전화를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phoneNumber: z.string().min(1, "휴대전화를 입력해주세요"),
  powerPlannerId: z
    .string()
    .min(1, "한전파워플래너 아이디를 입력해주세요")
    .min(3, "아이디는 3자 이상이어야 합니다")
    .max(20, "아이디는 20자 이하여야 합니다")
    .refine(
      validateUserId,
      "아이디는 영문 소문자, 숫자, 특수문자(_-.)만 사용 가능합니다"
    ),
  powerPlannerPassword: z
    .string()
    .min(1, "한전파워플래너 패스워드를 입력해주세요"),
  buildingType: z.enum(
    [
      "FACTORY",
      "KNOWLEDGE_INDUSTRY_CENTER",
      "BUILDING",
      "MIXED_USE_COMPLEX",
      "APARTMENT_COMPLEX",
      "SCHOOL",
      "HOTEL",
      "ETC",
    ],
    {
      required_error: "건축물 형태를 선택해주세요",
      invalid_type_error: "올바른 건축물 형태를 선택해주세요",
    }
  ),
  salesmanId: z.number().nullable().optional(),
  engineerId: z.number().nullable().optional(),
  projectCost: z.number().min(0, "사업비용을 입력해주세요"),
  electricitySavingRate: z.number().min(0, "전기요금 절감율을 입력해주세요"),
  subsidy: z.number().min(0, "보조금을 입력해주세요"),

  progressStatus: z.enum(["REQUESTED", "IN_PROGRESS", "COMPLETE", "REJECTED"]),
  tenantFactory: z.boolean().default(false),
  attachmentFileList: z
    .array(
      z.object({
        fileKey: z.string(),
        category: z.string(),
        originalFileName: z.string(),
        extension: z.string(),
        contentType: z.string(),
        size: z.number(),
      })
    )
    .default([]),
});

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddCustomerRequest) => void;
}

export function CustomerForm({
  open,
  onOpenChange,
  onSubmit,
}: CustomerFormProps) {
  const { user } = useAuth();
  const [salesmans, setSalesmans] = useState<Salesman[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  // 파일 상태
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(
    null
  );
  const [electricalDiagramFiles, setElectricalDiagramFiles] = useState<File[]>(
    []
  );
  const [gometaFile, setGometaFile] = useState<File | null>(null);
  const [hasGometaData, setHasGometaData] = useState(true);
  const [showUserIdWarning, setShowUserIdWarning] = useState(false);

  const [tenantCompanies, setTenantCompanies] = useState([
    { name: "", jan: "", aug: "" },
  ]);

  // 파일 input refs
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const electricalDiagramInputRef = useRef<HTMLInputElement>(null);
  const gometaFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddCustomerRequest>({
    resolver: zodResolver(customerSchema),
    mode: "onSubmit",
    defaultValues: {
      companyName: "",
      representative: "",
      businessNumber: "",
      businessType: "",
      businessItem: "",
      businessAddress: "",
      managerName: "",
      companyPhone: "",
      email: "",
      phoneNumber: "",
      powerPlannerId: "",
      powerPlannerPassword: "",
      buildingType: undefined,
      tenantCompanyList: [],
      salesmanId: null,
      engineerId: null,
      projectCost: 0,
      electricitySavingRate: 0,
      subsidy: 0,
      projectPeriod: "",
      progressStatus: "REQUESTED",
      tenantFactory: false,
      attachmentFileList: [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchSalesmans();
      fetchEngineers();

      // 폼을 초기 상태로 리셋
      form.reset({
        companyName: "",
        representative: "",
        businessNumber: "",
        businessType: "",
        businessItem: "",
        businessAddress: "",
        companyPhone: "",
        email: "",
        phoneNumber: "",
        powerPlannerId: "",
        powerPlannerPassword: "",
        buildingType: undefined,
        tenantCompanyList: [],
        salesmanId: null,
        engineerId: null,
        projectCost: 0,
        electricitySavingRate: 0,
        subsidy: 0,
        projectPeriod: "",
        progressStatus: "REQUESTED",
        tenantFactory: false,
        attachmentFileList: [],
      });
      setTenantCompanies([{ name: "", jan: "", aug: "" }]);
      setBusinessLicenseFile(null);
      setElectricalDiagramFiles([]);
      setGometaFile(null);
      setHasGometaData(true);
    }
  }, [open, form]);

  const fetchSalesmans = async () => {
    try {
      if (user?.role === "ADMIN") {
        // ADMIN은 전체 리스트 조회
        const response = await apiClient.get<ApiResponse<SalesmanResponse>>(
          API_ENDPOINTS.SALES_REPS.LIST
        );
        if (response.data) {
          setSalesmans(response.data.data?.adminSalesmanList || []);
        }
      } else {
        // SALESMAN/ENGINEER는 제한된 리스트 조회
        const response = await apiClient.get<ApiResponse<LimitUserListResponse>>(
          API_ENDPOINTS.SALES_REPS.LIMIT_LIST
        );
        if (response.data) {
          setSalesmans(response.data.data?.limitSalesmanList || []);
        }
      }
    } catch (error) {
      console.error("Error fetching salesmans:", error);
    }
  };

  const fetchEngineers = async () => {
    try {
      if (user?.role === "ADMIN") {
        // ADMIN은 전체 리스트 조회
        const response = await apiClient.get<ApiResponse<EngineerResponse>>(
          API_ENDPOINTS.ENGINEERS.LIST
        );
        if (response.data) {
          setEngineers(response.data.data?.adminEngineerList || []);
        }
      } else {
        // SALESMAN/ENGINEER는 제한된 리스트 조회
        const response = await apiClient.get<ApiResponse<LimitUserListResponse>>(
          API_ENDPOINTS.ENGINEERS.LIMIT_LIST
        );
        if (response.data) {
          setEngineers(response.data.data?.limitEngineerList || []);
        }
      }
    } catch (error) {
      console.error("Error fetching engineers:", error);
    }
  };

  const handleFormSubmit = form.handleSubmit(
    async (data) => {
      // 필수 파일 검증
      const missingFiles = [];

      if (!businessLicenseFile) {
        missingFiles.push("사업자등록증");
      }

      if (electricalDiagramFiles.length === 0) {
        missingFiles.push("변전실도면");
      }

      if (missingFiles.length > 0) {
        toast({
          title: "필수 파일 누락",
          description: `다음 파일을 업로드해주세요: ${missingFiles.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      // 공장이면서 단독사용이 아닌 경우 임차업체 정보 검증
      if (data.buildingType === "FACTORY" && !data.tenantFactory) {
        const hasValidTenant = tenantCompanies.some(
          (company) =>
            company.name.trim() &&
            (parseInt(company.jan) > 0 || parseInt(company.aug) > 0)
        );
        if (!hasValidTenant) {
          toast({
            title: "입력 오류",
            description: "임차 업체 정보를 입력해주세요.",
            variant: "destructive",
          });
          return;
        }
      }

      // 임차 업체 정보 처리
      if (data.buildingType === "FACTORY" && !data.tenantFactory) {
        // 공장이 단독사용이 아닌 경우 임차업체 정보를 tenantCompanyList에 추가
        data.tenantCompanyList = tenantCompanies
          .filter(
            (company) =>
              company.name.trim() &&
              (parseInt(company.jan) > 0 || parseInt(company.aug) > 0)
          )
          .map(
            (company): UpdateTenantCompany => ({
              tenantCompanyName: company.name,
              januaryElectricUsage: parseInt(company.jan) || 0,
              augustElectricUsage: parseInt(company.aug) || 0,
            })
          );
      } else {
        // 공장이 단독사용이거나 공장이 아닌 경우 빈 배열로 설정
        data.tenantCompanyList = [];
      }

      try {
        // 첨부파일 목록 생성
        const attachmentFileList: AttachmentFile[] = [];

        // 사업자등록증
        if (businessLicenseFile) {
          const businessLicenseAttachment = await createAttachmentFile(
            businessLicenseFile,
            "BUSINESS_LICENSE"
          );
          if (businessLicenseAttachment) {
            attachmentFileList.push(businessLicenseAttachment);
          }
        }

        // 변전실도면
        for (const file of electricalDiagramFiles) {
          const electricalDiagramAttachment = await createAttachmentFile(
            file,
            "ELECTRICAL_DIAGRAM"
          );
          if (electricalDiagramAttachment) {
            attachmentFileList.push(electricalDiagramAttachment);
          }
        }

        // 고메타 자료 (공장 제외)
        if (data.buildingType !== "FACTORY" && hasGometaData && gometaFile) {
          const gometaAttachment = await createAttachmentFile(
            gometaFile,
            "GOMETA_EXCEL"
          );
          if (gometaAttachment) {
            attachmentFileList.push(gometaAttachment);
          }
        }

        const normalizedData: AddCustomerRequest = {
          ...data,
          salesmanId: data.salesmanId === 0 ? null : data.salesmanId,
          engineerId: data.engineerId === 0 ? null : data.engineerId,
          attachmentFileList,
        };

        onSubmit(normalizedData);
      } catch (error) {
        console.error("파일 업로드 중 오류:", error);
        toast({
          title: "파일 업로드 오류",
          description: "파일 업로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    (errors) => {
      console.error("Form validation errors:", errors);

      // 유효성 검사 실패 시 toast 메시지 표시
      toast({
        title: "입력 오류",
        description: "모든 탭의 필수 입력값을 입력해주세요.",
        variant: "destructive",
      });
    }
  );

  const addTenantCompany = () => {
    setTenantCompanies([...tenantCompanies, { name: "", jan: "", aug: "" }]);
  };

  const removeTenantCompany = (index: number) => {
    setTenantCompanies(tenantCompanies.filter((_, i) => i !== index));
  };

  const updateTenantCompany = (index: number, field: string, value: string) => {
    const updated = tenantCompanies.map((company, i) =>
      i === index ? { ...company, [field]: value } : company
    );
    setTenantCompanies(updated);
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    if (!files) return;

    if (field === "businessLicense") {
      setBusinessLicenseFile(files[0]);
    } else if (field === "electricalDiagram") {
      const newFiles = Array.from(files);
      const totalFiles = electricalDiagramFiles.length + newFiles.length;

      if (totalFiles > 5) {
        toast({
          title: "파일 개수 초과",
          description: "변전실도면은 최대 5장까지 업로드할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }

      setElectricalDiagramFiles((prev) => [...prev, ...newFiles]);
    } else if (field === "gometaFile") {
      setGometaFile(files[0]);
    }
  };

  const removeFile = (field: string, index?: number) => {
    if (field === "businessLicense") {
      setBusinessLicenseFile(null);
      // input value 리셋
      if (businessLicenseInputRef.current) {
        businessLicenseInputRef.current.value = "";
      }
    } else if (field === "electricalDiagram" && typeof index === "number") {
      setElectricalDiagramFiles((prev) => prev.filter((_, i) => i !== index));
      // input value 리셋
      if (electricalDiagramInputRef.current) {
        electricalDiagramInputRef.current.value = "";
      }
    } else if (field === "gometaFile") {
      setGometaFile(null);
      // input value 리셋
      if (gometaFileInputRef.current) {
        gometaFileInputRef.current.value = "";
      }
    }
  };

  const previewFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      // 이미지 파일인 경우 새 탭에서 열기
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      // 메모리 누수 방지를 위해 URL 해제
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (file.type === "application/pdf") {
      // PDF 파일인 경우 새 탭에서 열기
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      // 기타 파일은 다운로드
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return "🖼️";
    } else if (fileType === "application/pdf") {
      return "📄";
    } else {
      return "📁";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const createAttachmentFile = async (
    file: File,
    category: "BUSINESS_LICENSE" | "ELECTRICAL_DIAGRAM" | "GOMETA_EXCEL"
  ): Promise<AttachmentFile | null> => {
    try {
      // 1. 업로드 URL 요청
      const uploadUrlResult = await getUploadUrls([
        {
          category,
          extension: file.name.split(".").pop() || "",
          contentType: file.type,
        },
      ]);

      if (!uploadUrlResult.success || !uploadUrlResult.uploadUrls?.[0]) {
        throw new Error("업로드 URL을 가져오는데 실패했습니다.");
      }

      const { fileKey, uploadUrl } = uploadUrlResult.uploadUrls[0];

      // 2. S3에 파일 업로드
      const uploadResult = await uploadToS3(file, uploadUrl);
      if (!uploadResult.success) {
        throw new Error("S3 파일 업로드에 실패했습니다.");
      }

      // 3. API에서 요구하는 AttachmentFile 구조에 맞게 생성
      const attachmentFile: AttachmentFile = {
        fileKey,
        category,
        originalFileName: file.name,
        extension: file.name.split(".").pop() || "",
        contentType: file.type,
        size: file.size,
      };

      return attachmentFile;
    } catch (error) {
      console.error("파일 처리 중 오류:", error);

      toast({
        title: "파일 업로드 오류",
        description: `${file.name} 파일 업로드에 실패했습니다.`,
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>수용가 추가</DialogTitle>
          <DialogDescription>
            수용가 정보를 입력해주세요. *는 필수 입력 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="contact">연락처 정보</TabsTrigger>
                <TabsTrigger value="project">사업 정보</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* 기본 정보 섹션 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>업체명 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="representative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>대표자 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>사업자등록번호 *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="123-45-67890"
                              onChange={(e) =>
                                field.onChange(
                                  formatBusinessNumber(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>업종 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessItem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>업태 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사업장 주소 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                {/* 연락처 정보 섹션 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="managerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>담당자명 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>회사전화 *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="02-1234-5678"
                              value={
                                field.value
                                  ? formatPhoneNumber(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  formatPhoneNumber(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>휴대전화 *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="숫자만 입력 가능합니다."
                              value={
                                field.value
                                  ? formatPhoneNumber(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  formatPhoneNumber(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일 *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">
                      한전파워플래너
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="powerPlannerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>아이디 *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="영문 소문자, 숫자, 특수문자(_-.)만 입력 가능"
                                value={
                                  field.value ? formatUserId(field.value) : ""
                                }
                                onInput={(e) => {
                                  const originalValue = e.currentTarget.value;
                                  const formattedValue =
                                    formatUserId(originalValue);

                                  // 허용되지 않는 문자가 입력된 경우 경고 표시
                                  if (originalValue !== formattedValue) {
                                    setShowUserIdWarning(true);
                                    // 3초 후 경고 숨기기
                                    setTimeout(
                                      () => setShowUserIdWarning(false),
                                      3000
                                    );
                                  }
                                }}
                                onChange={(e) => {
                                  const formattedValue = formatUserId(
                                    e.target.value
                                  );
                                  field.onChange(formattedValue);
                                }}
                              />
                            </FormControl>
                            {showUserIdWarning && (
                              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
                                ⚠️ 영문 소문자, 숫자, 특수문자(_-.)만 입력
                                가능합니다.
                              </div>
                            )}

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="powerPlannerPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>패스워드 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="project" className="space-y-6">
                {/* 사업 정보 섹션 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salesmanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>담당 영업자 *</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString() || "0"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="영업자를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">선택하지 않음</SelectItem>
                              {salesmans.map((rep) => (
                                <SelectItem
                                  key={rep.id}
                                  value={rep.id.toString()}
                                >
                                  {rep.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="engineerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>담당 기술사</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString() || "0"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="기술사를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">선택하지 않음</SelectItem>
                              {engineers.map((engineer) => (
                                <SelectItem
                                  key={engineer.id}
                                  value={engineer.id.toString()}
                                >
                                  {engineer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buildingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>건축물 형태 *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="건축물 형태를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent>
                              <SelectItem value="FACTORY">공장</SelectItem>
                              <SelectItem value="KNOWLEDGE_INDUSTRY_CENTER">
                                지식산업센터
                              </SelectItem>
                              <SelectItem value="BUILDING">건물</SelectItem>
                              <SelectItem value="MIXED_USE_COMPLEX">
                                복합 사용 건물
                              </SelectItem>
                              <SelectItem value="APARTMENT_COMPLEX">
                                아파트 단지
                              </SelectItem>
                              <SelectItem value="SCHOOL">학교</SelectItem>
                              <SelectItem value="HOTEL">호텔</SelectItem>
                              <SelectItem value="ETC">기타</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("buildingType") === "FACTORY" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="singleUse"
                            checked={form.watch("tenantFactory")}
                            onCheckedChange={(checked) =>
                              form.setValue("tenantFactory", !!checked)
                            }
                          />
                          <Label htmlFor="singleUse">공장 단독 사용</Label>
                        </div>
                        {!form.watch("tenantFactory") && (
                          <Button
                            type="button"
                            onClick={addTenantCompany}
                            variant="outline"
                            size="sm"
                          >
                            임차업체 추가
                          </Button>
                        )}
                      </div>

                      {!form.watch("tenantFactory") && (
                        <div className="space-y-2">
                          {/* 테이블 헤더 */}
                          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
                            <div>임차업체명 *</div>
                            <div>1월 전기사용량 (kWh) *</div>
                            <div>8월 전기사용량 (kWh) *</div>
                            <div></div>
                          </div>

                          {/* 테이블 행들 */}
                          {tenantCompanies.map((company, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-4 gap-4 items-center"
                            >
                              <Input
                                value={company.name}
                                onChange={(e) =>
                                  updateTenantCompany(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="임차업체명"
                                className="h-9"
                              />
                              <Input
                                value={company.jan}
                                onChange={(e) =>
                                  updateTenantCompany(
                                    index,
                                    "jan",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                type="number"
                                className="h-9"
                              />
                              <Input
                                value={company.aug}
                                onChange={(e) =>
                                  updateTenantCompany(
                                    index,
                                    "aug",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                type="number"
                                className="h-9"
                              />
                              <div className="flex justify-center">
                                {tenantCompanies.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeTenantCompany(index)}
                                    variant="destructive"
                                    size="sm"
                                    className="h-9 px-3"
                                  >
                                    삭제
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 고메타 자료 (공장 제외) */}
                {form.watch("buildingType") &&
                  form.watch("buildingType") !== "FACTORY" && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700">
                        전력사용량 자료
                      </h4>

                      <div>
                        <Label>입주사별 전력사용량(고메타) 자료</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hasGometaData"
                              name="hasGometaData"
                              checked={hasGometaData}
                              onChange={() => setHasGometaData(true)}
                              className="text-blue-600"
                            />
                            <Label htmlFor="hasGometaData">
                              자료 있음 (1월 또는 8월 중 전력사용량이 큰 자료)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="noGometaData"
                              name="hasGometaData"
                              checked={!hasGometaData}
                              onChange={() => setHasGometaData(false)}
                              className="text-blue-600"
                            />
                            <Label htmlFor="noGometaData">자료 없음</Label>
                          </div>
                        </div>
                      </div>

                      {hasGometaData && (
                        <div>
                          <Label>고메타 자료 업로드 (Excel 파일)</Label>
                          <div className="mt-2 flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <span className="text-2xl mb-2">📊</span>
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">
                                    클릭하여 업로드
                                  </span>{" "}
                                  또는 드래그 앤 드롭
                                </p>
                                <p className="text-xs text-gray-500">
                                  Excel 파일만 가능 (.xlsx, .xls)
                                </p>
                              </div>
                              <input
                                ref={gometaFileInputRef}
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={(e) =>
                                  handleFileChange("gometaFile", e.target.files)
                                }
                              />
                            </label>
                          </div>
                          {gometaFile && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">
                                    {getFileIcon(gometaFile.type)}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-purple-800">
                                      {gometaFile.name}
                                    </p>
                                    <p className="text-xs text-purple-600">
                                      {formatFileSize(gometaFile.size)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {gometaFile.type}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => previewFile(gometaFile)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    {gometaFile.type.startsWith("image/") ||
                                    gometaFile.type === "application/pdf"
                                      ? "미리보기"
                                      : "다운로드"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFile("gometaFile")}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    제거
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* 파일 첨부 섹션 */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">
                    첨부 서류
                  </h4>

                  {/* 사업자등록증 */}
                  <div className="space-y-3">
                    <Label>사업자등록증 (1장) *</Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <span className="text-2xl mb-2">📄</span>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              사업자등록증 업로드
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            이미지 파일 (JPG, PNG, PDF)
                          </p>
                        </div>
                        <input
                          ref={businessLicenseInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFileChange("businessLicense", e.target.files)
                          }
                        />
                      </label>
                    </div>
                    {businessLicenseFile && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {getFileIcon(businessLicenseFile.type)}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {businessLicenseFile.name}
                              </p>
                              <p className="text-xs text-green-600">
                                {formatFileSize(businessLicenseFile.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => previewFile(businessLicenseFile)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {businessLicenseFile.type.startsWith("image/") ||
                              businessLicenseFile.type === "application/pdf"
                                ? "미리보기"
                                : "다운로드"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile("businessLicense")}
                              className="text-red-600 hover:text-red-700"
                            >
                              제거
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 변전실도면 */}
                  <div className="space-y-3">
                    <Label>변전실도면(단선결선도) (최대 5장) *</Label>
                    <div className="mb-2 text-sm text-gray-600">
                      현재 {electricalDiagramFiles.length}/5장 업로드됨
                    </div>
                    <div className="flex items-center justify-center w-full">
                      <label
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          electricalDiagramFiles.length >= 5
                            ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <span className="text-2xl mb-2">📋</span>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              변전실도면 업로드
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            이미지 파일 (JPG, PNG, PDF) - 최대 5장
                          </p>
                          {electricalDiagramFiles.length >= 5 && (
                            <p className="text-xs text-red-500 mt-1">
                              최대 업로드 개수에 도달했습니다
                            </p>
                          )}
                        </div>
                        <input
                          ref={electricalDiagramInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          multiple
                          disabled={electricalDiagramFiles.length >= 5}
                          onChange={(e) =>
                            handleFileChange(
                              "electricalDiagram",
                              e.target.files
                            )
                          }
                        />
                      </label>
                    </div>
                    {electricalDiagramFiles.length > 0 && (
                      <div className="space-y-2">
                        {electricalDiagramFiles.map((file, index) => (
                          <div
                            key={index}
                            className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">
                                  {getFileIcon(file.type)}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-blue-800">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewFile(file)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {file.type.startsWith("image/") ||
                                  file.type === "application/pdf"
                                    ? "미리보기"
                                    : "다운로드"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeFile("electricalDiagram", index)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  제거
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">추가</Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
