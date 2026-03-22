import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SelectedTokenContextValue {
  selectedAddress: string | null;
  selectToken: (address: string) => void;
}

const SelectedTokenContext = createContext<SelectedTokenContextValue>({
  selectedAddress: null,
  selectToken: () => {},
});

export function SelectedTokenProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const selectToken = useCallback((address: string) => {
    setSelectedAddress(address);
  }, []);

  return (
    <SelectedTokenContext.Provider value={{ selectedAddress, selectToken }}>
      {children}
    </SelectedTokenContext.Provider>
  );
}

export function useSelectedToken() {
  return useContext(SelectedTokenContext);
}
