import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface FactoryUsageFormProps {
  customerId: string;
  buildingType: string;
  onChange?: () => void;
}

interface FactoryUsageInput {
  id?: string;
  factory_name: string;
  january_usage: number;
  august_usage: number;
}

export function FactoryUsageForm({
  customerId,
  buildingType,
  onChange,
}: FactoryUsageFormProps) {
  const [factoryUsages, setFactoryUsages] = useState<FactoryUsageInput[]>([
    { factory_name: "", january_usage: 0, august_usage: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchFactoryUsages();
    }
  }, [customerId]);

  const fetchFactoryUsages = async () => {
    try {
      const { data, error } = await supabase
        .from("factory_usage")
        .select("*")
        .eq("customer_id", customerId);

      if (error) {
        console.error("Error fetching factory usages:", error);
        return;
      }

      if (data && data.length > 0) {
        setFactoryUsages(
          data.map((item) => ({
            id: item.id,
            factory_name: item.factory_name,
            january_usage: item.january_usage,
            august_usage: item.august_usage,
          }))
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addFactoryUsage = () => {
    setFactoryUsages([
      ...factoryUsages,
      { factory_name: "", january_usage: 0, august_usage: 0 },
    ]);
  };

  const removeFactoryUsage = async (index: number) => {
    const usage = factoryUsages[index];

    // 이미 저장된 항목이면 DB에서 삭제
    if (usage.id) {
      try {
        const { error } = await supabase
          .from("factory_usage")
          .delete()
          .eq("id", usage.id);

        if (error) {
          console.error("Error deleting factory usage:", error);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        return;
      }
    }

    const newUsages = factoryUsages.filter((_, i) => i !== index);
    setFactoryUsages(newUsages);
    onChange?.();
  };

  const updateFactoryUsage = (
    index: number,
    field: keyof FactoryUsageInput,
    value: string | number
  ) => {
    const newUsages = [...factoryUsages];
    newUsages[index] = { ...newUsages[index], [field]: value };
    setFactoryUsages(newUsages);
  };

  const saveFactoryUsages = async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      // 기존 데이터 삭제 후 새로 저장
      const { error: deleteError } = await supabase
        .from("factory_usage")
        .delete()
        .eq("customer_id", customerId);

      if (deleteError) {
        console.error("Error deleting existing factory usages:", deleteError);
        return;
      }

      // 빈 항목 제외하고 저장
      const validUsages = factoryUsages.filter(
        (usage) =>
          usage.factory_name.trim() !== "" &&
          (usage.january_usage > 0 || usage.august_usage > 0)
      );

      if (validUsages.length > 0) {
        const insertData = validUsages.map((usage) => ({
          customer_id: customerId,
          factory_name: usage.factory_name,
          january_usage: usage.january_usage,
          august_usage: usage.august_usage,
        }));

        const { error: insertError } = await supabase
          .from("factory_usage")
          .insert(insertData);

        if (insertError) {
          console.error("Error inserting factory usages:", insertError);
          return;
        }
      }

      onChange?.();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 공장이 아니거나 단독 사용인 경우 표시하지 않음
  if (buildingType !== "factory") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>공장별 전력사용량</CardTitle>
        <CardDescription>
          임차 공장별로 1월과 8월 전력사용량을 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {factoryUsages.map((usage, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">공장 {index + 1}</h4>
              {factoryUsages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFactoryUsage(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`factory-name-${index}`}>업체명</Label>
                <Input
                  id={`factory-name-${index}`}
                  value={usage.factory_name}
                  onChange={(e) =>
                    updateFactoryUsage(index, "factory_name", e.target.value)
                  }
                  placeholder="업체명을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor={`january-usage-${index}`}>
                  1월 전력사용량 (kWh)
                </Label>
                <Input
                  id={`january-usage-${index}`}
                  type="number"
                  value={usage.january_usage}
                  onChange={(e) =>
                    updateFactoryUsage(
                      index,
                      "january_usage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor={`august-usage-${index}`}>
                  8월 전력사용량 (kWh)
                </Label>
                <Input
                  id={`august-usage-${index}`}
                  type="number"
                  value={usage.august_usage}
                  onChange={(e) =>
                    updateFactoryUsage(
                      index,
                      "august_usage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={addFactoryUsage}>
            <Plus className="mr-2 h-4 w-4" />
            공장 추가
          </Button>

          <Button type="button" onClick={saveFactoryUsages} disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
