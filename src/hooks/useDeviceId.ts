import { useState } from "react";

const DEVICE_ID_KEY = "tanner_terminal_device_id";

function generateDeviceId(): string {
  return crypto.randomUUID();
}

export function useDeviceId(): string {
  const [deviceId] = useState<string>(() => {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const newId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  });
  return deviceId;
}