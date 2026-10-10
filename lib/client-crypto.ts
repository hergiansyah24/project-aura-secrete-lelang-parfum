"use client";

/**
 * Client-Side Cryptographic Engine for Sealed-Bid Commitments
 * Operates purely inside the user's browser via the Web Cryptography API (W3C standard).
 * The bid amount and secret nonce never touch the network during the Commit Phase!
 */

export interface BidProof {
  auctionId: number;
  auctionTitle: string;
  bidAmount: number;
  nonce: string;
  commitmentHash: string;
  timestamp: string;
}

/**
 * Generate cryptographically secure random 256-bit nonce (64 hex characters)
 */
export function generateClientNonce(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback if crypto is unavailable
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Compute SHA-256 hash in browser using Web Crypto API
 */
export async function computeClientSHA256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute commitment hash according to protocol:
 * H = SHA-256(auctionId:bidAmount:nonce)
 */
export async function computeClientCommitment(
  auctionId: number | string,
  bidAmount: number | string,
  nonce: string
): Promise<string> {
  const payload = `${auctionId}:${bidAmount}:${nonce.trim()}`;
  return computeClientSHA256(payload);
}

const STORAGE_KEY = "aura_secrete_bid_proofs";

/**
 * Persist proof to browser local storage so user can reveal easily with 1 click
 */
export function saveBidProofToStorage(proof: BidProof): void {
  if (typeof window === "undefined") return;
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: Record<number, BidProof> = existingStr ? JSON.parse(existingStr) : {};
    existing[proof.auctionId] = proof;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error("Failed to save bid proof locally:", err);
  }
}

/**
 * Retrieve saved proof for an auction
 */
export function getBidProofFromStorage(auctionId: number): BidProof | null {
  if (typeof window === "undefined") return null;
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    if (!existingStr) return null;
    const existing: Record<number, BidProof> = JSON.parse(existingStr);
    return existing[auctionId] || null;
  } catch {
    return null;
  }
}

/**
 * Download Bid Proof Receipt as a JSON file for tamper-evident digital backup
 */
export function downloadBidProofFile(proof: BidProof): void {
  if (typeof window === "undefined") return;
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(
      JSON.stringify(
        {
          application: "Aura Secrète — Rare Perfume Sealed-Bid Auction",
          cryptographicProtocol: "SHA-256 Commit-Reveal Scheme",
          receipt: {
            ...proof,
            verificationFormula: "SHA256(auctionId + ':' + bidAmount + ':' + nonce) === commitmentHash",
          },
        },
        null,
        2
      )
    );
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `BidProof_Auction_${proof.auctionId}_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

