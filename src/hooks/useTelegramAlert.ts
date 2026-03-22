import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeviceId } from "./useDeviceId";

export function useTelegramAlert() {
  const deviceId = useDeviceId();

  return useMutation({
    mutationFn: async ({ chatId, message }: { chatId: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke("telegram-alert", {
        body: { chat_id: chatId, message },
        headers: { "x-device-id": deviceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success("Alert sent to Telegram!"),
    onError: (err) => toast.error(`Telegram error: ${err.message}`),
  });
}
