import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { API_ENDPOINTS, apiClient, ApiResponse } from "@/lib/api";
import {
  Customer,
  Engineer,
  EngineerResponse,
  Salesman,
  SalesmanResponse,
} from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const customerSchema = z.object({
  companyName: z.string().min(1, "업체명을 입력해주세요"),
  representative: z.string().min(1, "대표자를 입력해주세요"),
  businessNumber: z.string().min(1, "사업자등록번호를 입력해주세요"),
  businessType: z.string().min(1, "업종을 입력해주세요"),
  businessItem: z.string().min(1, "업태를 입력해주세요"),
  businessAddress: z.string().min(1, "사업장 주소를 입력해주세요"),
  managerName: z.string().min(1, "담당자명을 입력해주세요"),
  companyPhone: z.string().min(1, "회사전화를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phoneNumber: z.string().min(1, "휴대전화를 입력해주세요"),
  powerPlannerId: z.string().min(1, "한전파워플래너 아이디를 입력해주세요"),
  powerPlannerPassword: z
    .string()
    .min(1, "한전파워플래너 패스워드를 입력해주세요"),
  buildingType: z.enum([
    "FACTORY",
    "KNOWLEDGE_INDUSTRY_CENTER",
    "BUILDING",
    "MIXED_USE_COMPLEX",
    "APARTMENT_COMPLEX",
    "SCHOOL",
    "HOTEL",
    "OTHER",
  ]),
  januaryElectricUsage: z.number().min(0, "1월 전기사용량을 입력해주세요"),
  augustElectricUsage: z.number().min(0, "8월 전기사용량을 입력해주세요"),
  salesmanId: z.number().min(1, "담당 영업자를 선택해주세요"),
  engineerId: z.number().min(0, "담당 기술사를 선택해주세요"),
  projectCost: z.number().min(0, "사업비용을 입력해주세요"),
  electricitySavingRate: z.number().min(0, "전기요금 절감율을 입력해주세요"),
  subsidy: z.number().min(0, "보조금을 입력해주세요"),
  projectPeriod: z.string().min(1, "사업기간을 입력해주세요"),
  progressStatus: z.enum(["REQUESTED", "IN_PROGRESS", "COMPLETE", "REJECTED"]),
  tenantFactory: z.boolean().default(false),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSubmit: (
    data: Omit<
      Customer,
      "id" | "created_at" | "updated_at" | "sales_rep" | "engineer"
    >
  ) => void;
}

export function CustomerForm({
  open,
  onOpenChange,
  customer,
  onSubmit,
}: CustomerFormProps) {
  const [salesmans, setSalesmans] = useState<Salesman[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
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
      buildingType: "FACTORY",
      januaryElectricUsage: 0,
      augustElectricUsage: 0,
      salesmanId: 0,
      engineerId: 0,
      projectCost: 0,
      electricitySavingRate: 0,
      subsidy: 0,
      projectPeriod: "",
      progressStatus: "REQUESTED",
      tenantFactory: false,
    },
  });

  useEffect(() => {
    if (open) {
      fetchSalesmans();
      fetchEngineers();
    }
  }, [open]);

  useEffect(() => {
    if (customer) {
      form.reset({
        companyName: customer.companyName || "",
        representative: customer.representative || "",
        businessNumber: customer.businessNumber || "",
        businessType: customer.businessType || "",
        businessItem: customer.businessItem || "",
        businessAddress: customer.businessAddress || "",
        managerName: customer.managerName || "",
        companyPhone: customer.companyPhone || "",
        email: customer.email || "",
        phoneNumber: customer.phoneNumber || "",
        powerPlannerId: customer.powerPlannerId || "",
        powerPlannerPassword: customer.powerPlannerPassword || "",
        buildingType: customer.buildingType || "FACTORY",
        januaryElectricUsage: customer.januaryElectricUsage || 0,
        augustElectricUsage: customer.augustElectricUsage || 0,
        salesmanId: customer.salesmanId || 0,
        engineerId: customer.engineerId || 0,
        projectCost: customer.projectCost || 0,
        electricitySavingRate: customer.electricitySavingRate || 0,
        subsidy: customer.subsidy || 0,
        projectPeriod: customer.projectPeriod || "",
        progressStatus: customer.progressStatus || "REQUESTED",
        tenantFactory: customer.tenantFactory || false,
      });
    } else {
      form.reset({
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
        buildingType: "FACTORY",
        januaryElectricUsage: 0,
        augustElectricUsage: 0,
        salesmanId: 0,
        engineerId: 0,
        projectCost: 0,
        electricitySavingRate: 0,
        subsidy: 0,
        projectPeriod: "",
        progressStatus: "REQUESTED",
        tenantFactory: false,
      });
    }
  }, [customer, form]);

  const fetchSalesmans = async () => {
    const response = await apiClient.get<ApiResponse<SalesmanResponse>>(
      API_ENDPOINTS.SALES_REPS.LIST
    );
    if (response.data) {
      setSalesmans(response.data.data?.adminSalesmanList || []);
    }
  };

  const fetchEngineers = async () => {
    const response = await apiClient.get<ApiResponse<EngineerResponse>>(
      API_ENDPOINTS.ENGINEERS.LIST
    );
    if (response.data) {
      setEngineers(response.data.data?.engineerList || []);
    }
  };

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "수용가 수정" : "수용가 추가"}</DialogTitle>
          <DialogDescription>
            수용가 정보를 입력해주세요. *는 필수 입력 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="contact">연락처 정보</TabsTrigger>
                <TabsTrigger value="project">사업 정보</TabsTrigger>
                <TabsTrigger value="electricity">전기 사용량</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
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
                          <Input {...field} placeholder="123-45-67890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>건물형태 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                            <SelectItem value="OTHER">기타</SelectItem>
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
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
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
                          <Input {...field} placeholder="02-1234-5678" />
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
                          <Input {...field} placeholder="010-1234-5678" />
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
                  <h3 className="text-lg font-medium">한전파워플래너</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="powerPlannerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>아이디 *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
              </TabsContent>

              <TabsContent value="project" className="space-y-4">
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
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="영업자를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                          defaultValue={field.value?.toString()}
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
                    name="progressStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>진행상황 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REQUESTED">의뢰</SelectItem>
                            <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                            <SelectItem value="COMPLETE">완료</SelectItem>
                            <SelectItem value="REJECTED">거절</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenantFactory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>임대공장 여부</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="false">자체공장</SelectItem>
                            <SelectItem value="true">임대공장</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="projectCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사업비용 (원)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : 0
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
                    name="electricitySavingRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>전기요금 절감율 (%)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : 0
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
                    name="subsidy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>보조금 (원)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="projectPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업기간</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="예: 2024.01 ~ 2024.12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="electricity" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="januaryElectricUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1월 전기사용량 (kWh) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : 0
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
                    name="augustElectricUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>8월 전기사용량 (kWh) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
              <Button type="submit">{customer ? "수정" : "추가"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
