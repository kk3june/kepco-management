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
import { Textarea } from "@/components/ui/Textarea";
import { Engineer } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const engineerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().min(1, "연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
});

type EngineerFormData = z.infer<typeof engineerSchema>;

interface EngineerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engineer: Engineer | null;
  onSubmit: (data: Omit<Engineer, "id" | "created_at" | "updated_at">) => void;
}

export function EngineerForm({
  open,
  onOpenChange,
  engineer,
  onSubmit,
}: EngineerFormProps) {
  const form = useForm<EngineerFormData>({
    resolver: zodResolver(engineerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (engineer) {
      form.reset({
        name: engineer.name,
        phone: engineer.phone,
        email: engineer.email,
        address: engineer.address,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [engineer, form]);

  const handleSubmit = (data: EngineerFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{engineer ? "기술사 수정" : "기술사 추가"}</DialogTitle>
          <DialogDescription>기술사 정보를 입력해주세요.</DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">{engineer ? "수정" : "추가"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
