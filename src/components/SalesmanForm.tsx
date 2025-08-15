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
import { Textarea } from "@/components/ui/Textarea";
import { Salesman, SalesmanRequest } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const salesmanSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().min(1, "연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
  commissionRate: z.number().min(0).max(100),
  settlementMethod: z.enum(["INVOICE", "WITHHOLDING_TAX"]),
  bankName: z.string().min(1, "은행명을 입력해주세요"),
  bankAccount: z.string().min(1, "계좌번호를 입력해주세요"),
  businessNumber: z.string().optional(),
  representative: z.string().optional(),
  businessItem: z.string().optional(),
  businessType: z.string().optional(),
  businessAddress: z.string().optional(),
});

type SalesmanFormData = z.infer<typeof salesmanSchema>;

interface SalesmanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesman: Salesman | null;
  onSubmit: (data: SalesmanRequest) => void;
}

export function SalesmanForm({
  open,
  onOpenChange,
  salesman,
  onSubmit,
}: SalesmanFormProps) {
  const form = useForm<SalesmanFormData>({
    resolver: zodResolver(salesmanSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      commissionRate: 0,
      settlementMethod: "INVOICE",
      bankName: "",
      bankAccount: "",
      businessNumber: "",
      representative: "",
      businessItem: "",
      businessType: "",
      businessAddress: "",
    },
  });

  useEffect(() => {
    if (salesman) {
      form.reset({
        username: "", // 기존 Salesman에는 username이 없음
        password: "", // 기존 Salesman에는 password가 없음
        name: salesman.name || "",
        phone: salesman.phoneNumber || "", // phoneNumber를 phone으로 매핑
        email: salesman.email || "",
        address: salesman.address || "",
        commissionRate: salesman.commissionRate,
        settlementMethod: salesman.settlementMethod,
        bankName: salesman.bankName || "",
        bankAccount: salesman.bankAccount || "",
        businessNumber: salesman.businessNumber || "",
        representative: salesman.representative || "",
        businessItem: salesman.business_category || "", // business_category를 businessItem으로 매핑
        businessType: salesman.business_type || "", // business_type을 businessType으로 매핑
        businessAddress: salesman.business_address || "", // business_address를 businessAddress로 매핑
      });
    } else {
      form.reset({
        username: "",
        password: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        commissionRate: 0,
        settlementMethod: "INVOICE",
        bankName: "",
        bankAccount: "",
        businessNumber: "",
        representative: "",
        businessItem: "",
        businessType: "",
        businessAddress: "",
      });
    }
  }, [salesman, form]);

  const handleSubmit = (data: SalesmanFormData) => {
    // 폼 데이터를 SalesmanRequest 타입으로 변환
    const transformedData: SalesmanRequest = {
      username: data.username,
      password: data.password,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      commissionRate: data.commissionRate,
      settlementMethod: data.settlementMethod,
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      businessNumber: data.businessNumber,
      representative: data.representative,
      businessItem: data.businessItem,
      businessType: data.businessType,
      businessAddress: data.businessAddress,
    };

    onSubmit(transformedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{salesman ? "영업자 수정" : "영업자 추가"}</DialogTitle>
          <DialogDescription>
            영업자 정보를 입력해주세요. *는 필수 입력 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">기본 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사용자명 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호 *</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>연락처 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="010-1234-5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 수수료 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">수수료 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수수료율 (%) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settlementMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>정산방법 *</FormLabel>
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
                          <SelectItem value="INVOICE">계산서</SelectItem>
                          <SelectItem value="WITHHOLDING_TAX">
                            원천징수
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
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>은행명 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계좌번호 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 사업자 정보 (선택사항) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">사업자 정보 (선택사항)</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업자등록번호</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123-45-67890" />
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
                      <FormLabel>대표자</FormLabel>
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
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>업태</FormLabel>
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
                      <FormLabel>업종</FormLabel>
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
                    <FormLabel>사업장 주소</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">{salesman ? "수정" : "추가"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
