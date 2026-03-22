import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  formatCheckoutUrl,
  isCartNotFoundError,
  ShopifyProductNode,
  storefrontApiRequest,
} from "@/lib/shopify";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProductNode;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

async function createShopifyCart(item: Omit<CartItem, "lineId">) {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
  });

  const userErrors = data?.data?.cartCreate?.userErrors || [];
  if (userErrors.length > 0) return null;

  const cart = data?.data?.cartCreate?.cart;
  const lineId = cart?.lines?.edges?.[0]?.node?.id;
  if (!cart?.id || !cart?.checkoutUrl || !lineId) return null;

  return {
    cartId: cart.id as string,
    lineId: lineId as string,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl as string),
  };
}

async function addLineToShopifyCart(cartId: string, item: Omit<CartItem, "lineId">) {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
  });

  const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false, cartNotFound: false };

  const cart = data?.data?.cartLinesAdd?.cart;
  const edges = cart?.lines?.edges || [];
  const matched = edges.find(
    (edge: { node: { id: string; merchandise: { id: string } } }) => edge.node.merchandise.id === item.variantId,
  );

  return {
    success: true,
    cartNotFound: false,
    lineId: matched?.node?.id as string | undefined,
    checkoutUrl: cart?.checkoutUrl ? formatCheckoutUrl(cart.checkoutUrl as string) : undefined,
  };
}

async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false, cartNotFound: false };

  return { success: true, cartNotFound: false };
}

async function removeLineFromShopifyCart(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false, cartNotFound: false };

  return { success: true, cartNotFound: false };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (item) => {
        const { cartId, items, clearCart } = get();
        const existing = items.find((cartItem) => cartItem.variantId === item.variantId);

        set({ isLoading: true });
        try {
          if (!cartId) {
            const created = await createShopifyCart(item);
            if (!created) return;

            set({
              cartId: created.cartId,
              checkoutUrl: created.checkoutUrl,
              items: [{ ...item, lineId: created.lineId }],
            });
            return;
          }

          if (existing && existing.lineId) {
            const result = await updateShopifyCartLine(cartId, existing.lineId, existing.quantity + item.quantity);
            if (result.cartNotFound) {
              clearCart();
              return;
            }
            if (!result.success) return;

            set({
              items: get().items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem,
              ),
            });
            return;
          }

          const added = await addLineToShopifyCart(cartId, item);
          if (added.cartNotFound) {
            clearCart();
            return;
          }
          if (!added.success) return;

          set({
            checkoutUrl: added.checkoutUrl || get().checkoutUrl,
            items: [...get().items, { ...item, lineId: added.lineId ?? null }],
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }

        const { cartId, items, clearCart } = get();
        const item = items.find((entry) => entry.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.cartNotFound) {
            clearCart();
            return;
          }
          if (!result.success) return;

          set({
            items: get().items.map((entry) => (entry.variantId === variantId ? { ...entry, quantity } : entry)),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { cartId, items, clearCart } = get();
        const item = items.find((entry) => entry.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.cartNotFound) {
            clearCart();
            return;
          }
          if (!result.success) return;

          const remaining = get().items.filter((entry) => entry.variantId !== variantId);
          if (remaining.length === 0) {
            clearCart();
          } else {
            set({ items: remaining });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) {
            clearCart();
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      getCheckoutUrl: () => get().checkoutUrl,
    }),
    {
      name: "shopify-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl }),
    },
  ),
);
