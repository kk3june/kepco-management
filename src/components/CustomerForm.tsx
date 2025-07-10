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
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { Customer, Engineer, SalesRep } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const customerSchema = z.object({
  company_name: z.string().min(1, "업체명을 입력해주세요"),
  representative: z.string().min(1, "대표자를 입력해주세요"),
  business_number: z.string().min(1, "사업자등록번호를 입력해주세요"),
  business_type: z.string().min(1, "업종을 입력해주세요"),
  business_category: z.string().min(1, "업태를 입력해주세요"),
  business_address: z.string().min(1, "사업장 주소를 입력해주세요"),
  contact_name: z.string().min(1, "담당자명을 입력해주세요"),
  company_phone: z.string().min(1, "회사전화를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  mobile_phone: z.string().min(1, "휴대전화를 입력해주세요"),
  kepco_planner_id: z.string().min(1, "한전파워플래너 아이디를 입력해주세요"),
  kepco_planner_password: z
    .string()
    .min(1, "한전파워플래너 패스워드를 입력해주세요"),
  building_type: z.enum(["factory", "mixed_building", "office", "residential"]),
  sales_rep_id: z.string().min(1, "담당 영업자를 선택해주세요"),
  engineer_id: z.string().min(1, "담당 기술사를 선택해주세요"),
  acquisition_channel: z.enum(["direct", "website"]),
  progress_status: z.enum([
    "feasibility",
    "survey",
    "report",
    "contract",
    "construction",
    "confirmation",
    "settlement",
  ]),
  project_cost: z.number().optional(),
  power_saving_rate: z.number().optional(),
  kepco_payment: z.number().optional(),
  project_period: z.string().optional(),
  notes: z.string().optional(),
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
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: "",
      representative: "",
      business_number: "",
      business_type: "",
      business_category: "",
      business_address: "",
      contact_name: "",
      company_phone: "",
      email: "",
      mobile_phone: "",
      kepco_planner_id: "",
      kepco_planner_password: "",
      building_type: "factory",
      sales_rep_id: "",
      engineer_id: "",
      acquisition_channel: "direct",
      progress_status: "feasibility",
      project_cost: undefined,
      power_saving_rate: undefined,
      kepco_payment: undefined,
      project_period: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchSalesReps();
      fetchEngineers();
    }
  }, [open]);

  useEffect(() => {
    if (customer) {
      form.reset({
        company_name: customer.company_name,
        representative: customer.representative,
        business_number: customer.business_number,
        business_type: customer.business_type,
        business_category: customer.business_category,
        business_address: customer.business_address,
        contact_name: customer.contact_name,
        company_phone: customer.company_phone,
        email: customer.email,
        mobile_phone: customer.mobile_phone,
        kepco_planner_id: customer.kepco_planner_id,
        kepco_planner_password: customer.kepco_planner_password,
        building_type: customer.building_type,
        sales_rep_id: customer.sales_rep_id,
        engineer_id: customer.engineer_id,
        acquisition_channel: customer.acquisition_channel,
        progress_status: customer.progress_status,
        project_cost: customer.project_cost,
        power_saving_rate: customer.power_saving_rate,
        kepco_payment: customer.kepco_payment,
        project_period: customer.project_period || "",
        notes: customer.notes || "",
      });
    } else {
      form.reset({
        company_name: "",
        representative: "",
        business_number: "",
        business_type: "",
        business_category: "",
        business_address: "",
        contact_name: "",
        company_phone: "",
        email: "",
        mobile_phone: "",
        kepco_planner_id: "",
        kepco_planner_password: "",
        building_type: "factory",
        sales_rep_id: "",
        engineer_id: "",
        acquisition_channel: "direct",
        progress_status: "feasibility",
        project_cost: undefined,
        power_saving_rate: undefined,
        kepco_payment: undefined,
        project_period: "",
        notes: "",
      });
    }
  }, [customer, form]);

  const fetchSalesReps = async () => {
    const response = await apiClient.get<SalesRep[]>(
      API_ENDPOINTS.SALES_REPS.LIST
    );
    if (response.data) {
      setSalesReps(response.data);
    }
  };

  const fetchEngineers = async () => {
    const response = await apiClient.get<Engineer[]>(
      API_ENDPOINTS.ENGINEERS.LIST
    );
    if (response.data) {
      setEngineers(response.data);
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="contact">연락처 정보</TabsTrigger>
                <TabsTrigger value="project">사업 정보</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_name"
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
                    name="business_number"
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
                    name="building_type"
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
                            <SelectItem value="factory">공장</SelectItem>
                            <SelectItem value="mixed_building">
                              집합건물
                            </SelectItem>
                            <SelectItem value="office">
                              사옥 단독 사용
                            </SelectItem>
                            <SelectItem value="residential">
                              주상복합 및 아파트단지
                            </SelectItem>
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
                    name="business_type"
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
                    name="business_category"
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
                  name="business_address"
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
                    name="contact_name"
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
                    name="company_phone"
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
                    name="mobile_phone"
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
                      name="kepco_planner_id"
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
                      name="kepco_planner_password"
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
                    name="sales_rep_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>담당 영업자 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="영업자를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesReps.map((rep) => (
                              <SelectItem key={rep.id} value={rep.id}>
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
                    name="engineer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>담당 기술사 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="기술사를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {engineers.map((engineer) => (
                              <SelectItem key={engineer.id} value={engineer.id}>
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
                    name="acquisition_channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>가입 경로 *</FormLabel>
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
                            <SelectItem value="direct">직영</SelectItem>
                            <SelectItem value="website">사이트</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="progress_status"
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
                            <SelectItem value="feasibility">
                              타당성 검토
                            </SelectItem>
                            <SelectItem value="survey">실사</SelectItem>
                            <SelectItem value="report">실사보고서</SelectItem>
                            <SelectItem value="contract">계약</SelectItem>
                            <SelectItem value="construction">시공</SelectItem>
                            <SelectItem value="confirmation">
                              사업확인서
                            </SelectItem>
                            <SelectItem value="settlement">
                              수수료 정산
                            </SelectItem>
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
                    name="project_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사업비용 (원)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
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
                    name="power_saving_rate"
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
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
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
                    name="kepco_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>한전수불금 (원)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
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
                  name="project_period"
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비고</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
