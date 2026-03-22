/**
 * XRPL WebSocket service — singleton client for real-time data.
 */

import { Client } from "xrpl";
import type {
  OrderBookSnapshot,
  OrderBookEntry,
  TokenBalance,
  NetworkStatus,
  XRPLNft,
} from "@/types/xrpl";

const MAINNET = "wss://xrplcluster.com";

class XRPLService {
  private client: Client;
  private _ready: Promise<void> | null = null;
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  constructor(server = MAINNET) {
    this.client = new Client(server);
  }

  /* ── Connection ── */

  async connect(): Promise<void> {
    if (this.client.isConnected()) return;
    if (this._ready) return this._ready;

    this._ready = this.client.connect().then(() => {
      this.client.on("disconnected", () => {
        this.emit("network", { connected: false } as Partial<NetworkStatus>);
        setTimeout(() => this.connect(), 3000);
      });

      this.client.on("ledgerClosed", (ledger: Record<string, unknown>) => {
        this.emit("ledger", ledger);
        this.emit("network", {
          connected: true,
          ledgerIndex: ledger.ledger_index as number,
        } as Partial<NetworkStatus>);
      });

      this.client.request({ command: "subscribe", streams: ["ledger"] }).catch(() => {});

      this.emit("network", {
        connected: true,
        server: MAINNET,
      } as Partial<NetworkStatus>);
    });

    return this._ready;
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
    this._ready = null;
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  /* ── Account ── */

  async getAccountInfo(address: string) {
    await this.connect();
    try {
      const res = await this.client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });
      return res.result.account_data;
    } catch {
      return null;
    }
  }

  async getBalances(address: string): Promise<{
    xrpDrops: string;
    tokens: TokenBalance[];
  }> {
    await this.connect();
    try {
      const info = await this.getAccountInfo(address);
      const xrpDrops = info?.Balance ?? "0";

      const lines = await this.client.request({
        command: "account_lines",
        account: address,
        ledger_index: "validated",
      });

      const tokens: TokenBalance[] = (lines.result.lines ?? []).map(
        (l) => ({
          currency: l.currency,
          issuer: l.account,
          value: l.balance,
          limit: l.limit,
        })
      );

      return { xrpDrops, tokens };
    } catch {
      return { xrpDrops: "0", tokens: [] };
    }
  }

  /* ── Trust Lines ── */

  async setTrustLine(
    address: string,
    currency: string,
    issuer: string,
    limit: string = "1000000000"
  ): Promise<Record<string, unknown>> {
    await this.connect();
    return {
      TransactionType: "TrustSet",
      Account: address,
      LimitAmount: {
        currency,
        issuer,
        value: limit,
      },
    };
  }

  async removeTrustLine(
    address: string,
    currency: string,
    issuer: string
  ): Promise<Record<string, unknown>> {
    await this.connect();
    return {
      TransactionType: "TrustSet",
      Account: address,
      LimitAmount: {
        currency,
        issuer,
        value: "0",
      },
      Flags: 0x00020000, // tfClearNoRipple
    };
  }

  /* ── Pathfinding ── */

  async findPath(
    sourceAccount: string,
    destinationAccount: string,
    destinationAmount: { currency: string; issuer?: string; value: string }
  ) {
    await this.connect();
    try {
      const destAmt = destinationAmount.issuer
        ? destinationAmount
        : destinationAmount.currency === "XRP"
          ? { currency: "XRP", value: destinationAmount.value }
          : destinationAmount;

      const res = await this.client.request({
        command: "ripple_path_find",
        source_account: sourceAccount,
        destination_account: destinationAccount,
        destination_amount: destAmt.currency === "XRP"
          ? String(Math.round(Number(destAmt.value) * 1_000_000))
          : destAmt as any,
      });

      return res.result.alternatives ?? [];
    } catch (e) {
      console.warn("[XRPL] Path find failed:", e);
      return [];
    }
  }

  /* ── Payment ── */

  buildPaymentTx(
    sourceAccount: string,
    destinationAccount: string,
    amount: { currency: string; issuer?: string; value: string },
    paths?: unknown[],
    sendMax?: unknown
  ): Record<string, unknown> {
    const deliverAmount = amount.currency === "XRP"
      ? String(Math.round(Number(amount.value) * 1_000_000))
      : { currency: amount.currency, issuer: amount.issuer, value: amount.value };

    const tx: Record<string, unknown> = {
      TransactionType: "Payment",
      Account: sourceAccount,
      Destination: destinationAccount,
      Amount: deliverAmount,
    };

    if (paths && paths.length > 0) {
      tx.Paths = paths;
    }
    if (sendMax) {
      tx.SendMax = sendMax;
    }

    return tx;
  }

  /* ── NFTs ── */

  async getAccountNFTs(address: string): Promise<XRPLNft[]> {
    await this.connect();
    try {
      const res = await this.client.request({
        command: "account_nfts",
        account: address,
        ledger_index: "validated",
      } as any);

      const raw = (res.result as any).account_nfts ?? [];

      return raw.map((nft: any) => {
        let name: string | undefined;
        let description: string | undefined;
        let imageUrl: string | undefined;
        let collection: string | undefined;

        // Decode URI if present (hex-encoded)
        if (nft.URI) {
          try {
            const decoded = this.hexToString(nft.URI);
            // If it's a JSON URI, try to parse
            if (decoded.startsWith("{")) {
              const meta = JSON.parse(decoded);
              name = meta.name;
              description = meta.description;
              imageUrl = meta.image;
              collection = meta.collection?.name;
            } else {
              // It's likely an IPFS or HTTP URL
              imageUrl = decoded.startsWith("ipfs://")
                ? `https://ipfs.io/ipfs/${decoded.slice(7)}`
                : decoded;
            }
          } catch {
            // URI decode failed, skip
          }
        }

        return {
          nftokenId: nft.NFTokenID,
          issuer: nft.Issuer,
          uri: nft.URI ?? "",
          taxon: nft.NFTokenTaxon ?? 0,
          serial: nft.nft_serial ?? 0,
          flags: nft.Flags ?? 0,
          transferFee: nft.TransferFee,
          name,
          description,
          imageUrl,
          collection,
        };
      });
    } catch (e) {
      console.warn("[XRPL] Failed to fetch NFTs:", e);
      return [];
    }
  }

  private hexToString(hex: string): string {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  /* ── Order Book ── */

  async getOrderBook(
    baseCurrency: string,
    baseIssuer: string | undefined,
    quoteCurrency: string,
    quoteIssuer: string | undefined,
    limit = 25
  ): Promise<OrderBookSnapshot> {
    await this.connect();

    const takerGets = baseIssuer
      ? { currency: baseCurrency, issuer: baseIssuer }
      : { currency: baseCurrency };
    const takerPays = quoteIssuer
      ? { currency: quoteCurrency, issuer: quoteIssuer }
      : { currency: quoteCurrency };

    try {
      const [askRes, bidRes] = await Promise.all([
        this.client.request({
          command: "book_offers",
          taker_gets: takerGets as any,
          taker_pays: takerPays as any,
          limit,
        }),
        this.client.request({
          command: "book_offers",
          taker_gets: takerPays as any,
          taker_pays: takerGets as any,
          limit,
        }),
      ]);

      const asks = this.parseOffers(askRes.result.offers as any[] ?? [], "ask");
      const bids = this.parseOffers(bidRes.result.offers as any[] ?? [], "bid");

      const bestBid = bids[0]?.price ?? 0;
      const bestAsk = asks[0]?.price ?? 0;
      const spread = bestAsk - bestBid;
      const spreadPct = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

      return { bids, asks, spread, spreadPct, lastUpdated: Date.now() };
    } catch {
      return { bids: [], asks: [], spread: 0, spreadPct: 0, lastUpdated: Date.now() };
    }
  }

  private parseOffers(
    offers: Record<string, unknown>[],
    side: "bid" | "ask"
  ): OrderBookEntry[] {
    let cumulative = 0;
    return offers.map((o) => {
      const gets = o.TakerGets;
      const pays = o.TakerPays;
      const getsVal =
        typeof gets === "string" ? Number(gets) / 1_000_000 : Number((gets as any).value);
      const paysVal =
        typeof pays === "string" ? Number(pays) / 1_000_000 : Number((pays as any).value);

      const price = side === "ask" ? paysVal / getsVal : getsVal / paysVal;
      const size = side === "ask" ? getsVal : paysVal;
      cumulative += size;

      return { price, size, total: cumulative, numOrders: 1 };
    });
  }

  /* ── Transactions ── */

  async getTransactions(address: string, limit = 20) {
    await this.connect();
    try {
      const res = await this.client.request({
        command: "account_tx",
        account: address,
        limit,
        ledger_index_min: -1,
        ledger_index_max: -1,
      });
      return res.result.transactions ?? [];
    } catch {
      return [];
    }
  }

  /* ── Event system ── */

  on(event: string, cb: (data: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

// Singleton
export const xrplService = new XRPLService(MAINNET);
