import { useQuery } from "@tanstack/react-query";
import {
  ShopifyProductEdge,
  ShopifyProductNode,
  STOREFRONT_PRODUCT_BY_HANDLE_QUERY,
  STOREFRONT_PRODUCTS_QUERY,
  storefrontApiRequest,
} from "@/lib/shopify";

export function useShopifyProducts(searchQuery?: string) {
  return useQuery({
    queryKey: ["shopify-products", searchQuery ?? "all"],
    queryFn: async () => {
      const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50, query: searchQuery ?? null });
      return (data?.data?.products?.edges || []) as ShopifyProductEdge[];
    },
  });
}

export function useShopifyProductByHandle(handle?: string) {
  return useQuery({
    queryKey: ["shopify-product", handle],
    enabled: Boolean(handle),
    queryFn: async () => {
      const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle });
      return (data?.data?.product || null) as ShopifyProductNode | null;
    },
  });
}
