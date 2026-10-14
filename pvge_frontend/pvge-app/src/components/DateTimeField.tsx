import { createElement, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
};

const pad = (n: number) => n.toString().padStart(2, "0");
const toInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function DateTimeField({
  label,
  value,
  onChange,
  minimumDate,
}: Props) {
  const [show, setShow] = useState<null | "date" | "time">(null);

  const texto = value
    ? value.toLocaleString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Seleccionar...";

  // Web: input nativo del navegador
  if (Platform.OS === "web") {
    return (
      <View className="flex-1">
        <Text className="font-bold text-gray-700 mb-2 text-sm">{label}</Text>
        {createElement("input", {
          type: "datetime-local",
          value: value ? toInputValue(value) : "",
          min: minimumDate ? toInputValue(minimumDate) : undefined,
          onChange: (e: any) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(d);
          },
          style: {
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            fontSize: 14,
          },
        })}
      </View>
    );
  }

  // Celular: picker del sistema (Android: fecha y luego hora; iOS: ambos juntos)
  const handleChange = (event: any, d?: Date) => {
    if (event.type === "dismissed" || !d) {
      setShow(null);
      return;
    }
    if (Platform.OS === "android") {
      const base = new Date(value ?? d);
      if (show === "date") {
        base.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
        onChange(base);
        setShow("time");
      } else {
        base.setHours(d.getHours(), d.getMinutes());
        onChange(base);
        setShow(null);
      }
    } else {
      onChange(d);
    }
  };

  return (
    <View className="flex-1">
      <Text className="font-bold text-gray-700 mb-2 text-sm">{label}</Text>
      <Pressable
        onPress={() => setShow(Platform.OS === "android" ? "date" : "date")}
        className="p-3 bg-white border border-gray-200 rounded-xl flex-row items-center"
      >
        <Calendar size={16} color="#6b7280" />
        <Text className="ml-2 text-gray-700 text-sm flex-1" numberOfLines={1}>
          {texto}
        </Text>
      </Pressable>

      {show && (
        <>
          <DateTimePicker
            value={value ?? new Date()}
            mode={Platform.OS === "ios" ? "datetime" : show}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
          {Platform.OS === "ios" && (
            <Pressable onPress={() => setShow(null)} className="items-end mt-1">
              <Text className="text-blue-600 font-bold text-sm">Listo</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
