import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Push notification hook for Capacitor native apps.
 * On web, this is a no-op. On native, it registers for push
 * and logs the token for backend wiring.
 */
export function usePushNotifications() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    if (!Capacitor.isNativePlatform()) return;

    registered.current = true;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          console.warn("[Push] Permission denied");
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener("registration", (token) => {
          console.log("[Push] Token:", token.value);
          // TODO: send token.value to backend for alert delivery
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("[Push] Registration error:", err);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("[Push] Received:", notification);
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("[Push] Action:", action);
        });
      } catch (e) {
        console.error("[Push] Init error:", e);
      }
    })();
  }, []);
}
