import { useMemo } from "react";
import { useTrackedWallets } from "./useTrackedWallets";
import { useWalletActivity } from "./useWalletActivity";
import {
  classifyWalletFromTxs,
  buildSmartMoneyEvents,
  type WalletClassification,
  type SmartMoneyEvent,
} from "@/services/walletClassification";

export interface ClassifiedWallet {
  address: string;
  label: string;
  classification: WalletClassification;
}

export function useSmartMoneyFeed() {
  const { wallets } = useTrackedWallets();
  const w0 = wallets[0]?.address ?? null;
  const w1 = wallets[1]?.address ?? null;
  const w2 = wallets[2]?.address ?? null;
  const w3 = wallets[3]?.address ?? null;
  const w4 = wallets[4]?.address ?? null;

  const a0 = useWalletActivity(w0);
  const a1 = useWalletActivity(w1);
  const a2 = useWalletActivity(w2);
  const a3 = useWalletActivity(w3);
  const a4 = useWalletActivity(w4);

  const isLoading = a0.isLoading || a1.isLoading || a2.isLoading || a3.isLoading || a4.isLoading;

  const { classifiedWallets, events } = useMemo(() => {
    const sources = [
      { addr: w0, data: a0.data, label: wallets[0]?.label },
      { addr: w1, data: a1.data, label: wallets[1]?.label },
      { addr: w2, data: a2.data, label: wallets[2]?.label },
      { addr: w3, data: a3.data, label: wallets[3]?.label },
      { addr: w4, data: a4.data, label: wallets[4]?.label },
    ];

    const classifiedWallets: ClassifiedWallet[] = [];
    const allEvents: SmartMoneyEvent[] = [];

    for (const s of sources) {
      if (!s.addr || !s.data) continue;
      const lbl = s.label || `${s.addr.slice(0, 4)}…${s.addr.slice(-4)}`;
      const classification = classifyWalletFromTxs(s.addr, lbl, s.data);
      classifiedWallets.push({ address: s.addr, label: lbl, classification });
      const walletEvents = buildSmartMoneyEvents(s.addr, lbl, classification.category, s.data);
      allEvents.push(...walletEvents);
    }

    // Sort events by timestamp descending, significant first
    allEvents.sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return b.timestamp - a.timestamp;
    });

    return { classifiedWallets, events: allEvents };
  }, [w0, w1, w2, w3, w4, a0.data, a1.data, a2.data, a3.data, a4.data, wallets]);

  return { classifiedWallets, events, isLoading };
}
