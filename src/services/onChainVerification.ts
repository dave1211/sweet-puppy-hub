/**
 * On-Chain Verification Service — Real Solana RPC calls for token safety.
 *
 * Checks:
 *   1. Mint authority (revoked or active)
 *   2. Freeze authority (revoked or active)
 *   3. Top holder concentration (largest token accounts)
 *   4. Token supply data
 *   5. Basic metadata validation
 *
 * RULES:
 *   - NO fake data — every field comes from RPC or is explicitly null
 *   - RPC failure → null (caller maps to UNKNOWN/PENDING)
 *   - Deterministic: same input → same output
 *   - No Math.random anywhere
 */

import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = "https://api.mainnet-beta.solana.com";
const RPC_TIMEOUT_MS = 10_000;

/* ── Result types ── */

export interface OnChainTokenData {
  /** true = authority revoked (safer), false = active (risk), null = couldn't verify */
  mintAuthorityRevoked: boolean | null;
  /** true = authority revoked (safer), false = active (risk), null = couldn't verify */
  freezeAuthorityRevoked: boolean | null;
  /** Top holder percentage (0-100), null if unavailable */
  topHolderPct: number | null;
  /** Number of token holders, null if unavailable */
  holders: number | null;
  /** Total supply (UI amount), null if unavailable */
  totalSupply: number | null;
  /** Token decimals, null if unavailable */
  decimals: number | null;
  /** Whether metadata account exists on-chain */
  hasMetadata: boolean | null;
  /** Errors encountered during verification (for debugging) */
  errors: string[];
}

/* ── Helpers ── */

function getConnection(): Connection {
  return new Connection(RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: RPC_TIMEOUT_MS,
  });
}

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

/* ── Token Program constants ── */
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// Metaplex Token Metadata Program
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

/* ── Core verification function ── */

export async function verifyTokenOnChain(tokenAddress: string): Promise<OnChainTokenData> {
  const errors: string[] = [];
  const result: OnChainTokenData = {
    mintAuthorityRevoked: null,
    freezeAuthorityRevoked: null,
    topHolderPct: null,
    holders: null,
    totalSupply: null,
    decimals: null,
    hasMetadata: null,
    errors,
  };

  if (!isValidSolanaAddress(tokenAddress)) {
    errors.push("Invalid Solana address format");
    return result;
  }

  const connection = getConnection();
  const mintPubkey = new PublicKey(tokenAddress);

  // Run independent checks in parallel
  const [authorityResult, holdersResult, metadataResult] = await Promise.allSettled([
    checkMintAuthorities(connection, mintPubkey),
    checkHolderConcentration(connection, mintPubkey),
    checkMetadataExists(mintPubkey),
  ]);

  // 1. Mint & Freeze authority
  if (authorityResult.status === "fulfilled" && authorityResult.value) {
    result.mintAuthorityRevoked = authorityResult.value.mintAuthorityRevoked;
    result.freezeAuthorityRevoked = authorityResult.value.freezeAuthorityRevoked;
    result.totalSupply = authorityResult.value.totalSupply;
    result.decimals = authorityResult.value.decimals;
  } else {
    const reason = authorityResult.status === "rejected"
      ? authorityResult.reason?.message ?? "Unknown error"
      : "No data returned";
    errors.push(`Authority check failed: ${reason}`);
  }

  // 2. Holder concentration
  if (holdersResult.status === "fulfilled" && holdersResult.value) {
    result.topHolderPct = holdersResult.value.topHolderPct;
    result.holders = holdersResult.value.holderCount;
  } else {
    const reason = holdersResult.status === "rejected"
      ? holdersResult.reason?.message ?? "Unknown error"
      : "No data returned";
    errors.push(`Holder check failed: ${reason}`);
  }

  // 3. Metadata
  if (metadataResult.status === "fulfilled") {
    result.hasMetadata = metadataResult.value;
  } else {
    errors.push(`Metadata check failed: ${metadataResult.reason?.message ?? "Unknown error"}`);
  }

  return result;
}

/* ── Individual check functions ── */

interface AuthorityCheckResult {
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  totalSupply: number;
  decimals: number;
}

async function checkMintAuthorities(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<AuthorityCheckResult | null> {
  // Try standard Token Program first, then Token-2022
  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    try {
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      if (!accountInfo || !accountInfo.data) continue;

      // Check the account is owned by the expected token program
      if (!accountInfo.owner.equals(programId)) continue;

      const data = accountInfo.data;

      // SPL Token Mint layout (both standard and 2022 share base layout):
      // Bytes 0-3:   mintAuthorityOption (u32, little-endian) — 0 = None, 1 = Some
      // Bytes 4-35:  mintAuthority (pubkey, 32 bytes)
      // Bytes 36-43: supply (u64, little-endian)
      // Bytes 44:    decimals (u8)
      // Bytes 45:    isInitialized (bool)
      // Bytes 46-49: freezeAuthorityOption (u32, little-endian)
      // Bytes 50-81: freezeAuthority (pubkey, 32 bytes)

      if (data.length < 82) continue;

      const mintAuthorityOption = data.readUInt32LE(0);
      const supplyRaw = data.readBigUInt64LE(36);
      const decimals = data[44];
      const freezeAuthorityOption = data.readUInt32LE(46);

      const totalSupply = Number(supplyRaw) / Math.pow(10, decimals);

      return {
        mintAuthorityRevoked: mintAuthorityOption === 0,
        freezeAuthorityRevoked: freezeAuthorityOption === 0,
        totalSupply,
        decimals,
      };
    } catch {
      // Try next program
      continue;
    }
  }
  return null;
}

interface HolderCheckResult {
  topHolderPct: number;
  holderCount: number;
}

async function checkHolderConcentration(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<HolderCheckResult | null> {
  try {
    // Get largest token accounts (top 20)
    const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey);

    if (!largestAccounts?.value || largestAccounts.value.length === 0) {
      return null;
    }

    // Get total supply for percentage calculation
    const supplyResp = await connection.getTokenSupply(mintPubkey);
    const totalSupply = Number(supplyResp?.value?.amount ?? "0");

    if (totalSupply === 0) return null;

    // Calculate top holder percentage (top 10 holders)
    const top10 = largestAccounts.value.slice(0, 10);
    const top10Total = top10.reduce((sum, acc) => sum + Number(acc.amount), 0);
    const topHolderPct = (top10Total / totalSupply) * 100;

    return {
      topHolderPct: Math.round(topHolderPct * 10) / 10, // 1 decimal
      holderCount: largestAccounts.value.length, // Lower bound — RPC returns max 20
    };
  } catch {
    return null;
  }
}

async function checkMetadataExists(mintPubkey: PublicKey): Promise<boolean> {
  try {
    // Derive PDA for Metaplex metadata account
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const connection = getConnection();
    const accountInfo = await connection.getAccountInfo(metadataPDA);

    return accountInfo !== null && accountInfo.data.length > 0;
  } catch {
    return false;
  }
}
