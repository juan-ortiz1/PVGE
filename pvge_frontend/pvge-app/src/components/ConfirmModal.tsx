// components/ConfirmModal.tsx
import { Modal, View, Text, Pressable } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
          <Text className="text-gray-500 text-sm mb-6">{message}</Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 h-11 items-center justify-center rounded-xl bg-gray-100"
            >
              <Text className="text-gray-700 font-bold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 h-11 items-center justify-center rounded-xl ${
                destructive ? "bg-red-600" : "bg-blue-600"
              }`}
            >
              <Text className="text-white font-bold">{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
