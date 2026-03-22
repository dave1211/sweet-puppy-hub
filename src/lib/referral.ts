const REFERRAL_KEY = "tanner-referral-code";
const REFERRAL_CLICKS_KEY = "tanner-referral-clicks";
export function getReferralCode(): string {
  let code = localStorage.getItem(REFERRAL_KEY);
  if (!code) { code = "TT-" + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem(REFERRAL_KEY, code); }
  return code;
}
export function getReferralLink(): string { return `${window.location.origin}?ref=${getReferralCode()}`; }
export function getReferralClicks(): number { return parseInt(localStorage.getItem(REFERRAL_CLICKS_KEY) || "0", 10); }
export function trackReferralClick(): void { const current = getReferralClicks(); localStorage.setItem(REFERRAL_CLICKS_KEY, String(current + 1)); }
export function checkIncomingReferral(): string | null { const params = new URLSearchParams(window.location.search); const ref = params.get("ref"); if (ref) trackReferralClick(); return ref; }
