import { crypto } from 'jsr:@std/crypto@1';
import { encodeHex } from 'jsr:@std/encoding@1/hex';

// Platform-level PayHere account: the marketplace collects payments from renters.
// (Host payouts / commission split are part of the next, billing phase.)
export const payhere = {
  merchantId: Deno.env.get('PAYHERE_MERCHANT_ID') ?? '',
  merchantSecret: Deno.env.get('PAYHERE_MERCHANT_SECRET') ?? '',
  sandbox: (Deno.env.get('PAYHERE_SANDBOX') ?? 'true') !== 'false',
};

export const checkoutEndpoint = () =>
  payhere.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout';

export async function md5Upper(input: string) {
  const digest = await crypto.subtle.digest('MD5', new TextEncoder().encode(input));
  return encodeHex(new Uint8Array(digest)).toUpperCase();
}

export const formatAmount = (n: number) => n.toFixed(2);

/** hash = UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(secret)))) */
export async function checkoutHash(orderId: string, amount: number, currency: string) {
  const secretHash = await md5Upper(payhere.merchantSecret);
  return md5Upper(`${payhere.merchantId}${orderId}${formatAmount(amount)}${currency}${secretHash}`);
}

/** md5sig = UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(MD5(secret)))) */
export async function notifySignature(p: { orderId: string; amount: string; currency: string; statusCode: string }) {
  const secretHash = await md5Upper(payhere.merchantSecret);
  return md5Upper(`${payhere.merchantId}${p.orderId}${p.amount}${p.currency}${p.statusCode}${secretHash}`);
}

/** Only deep links into our own app (or Expo Go in development) may be used as payment return targets. */
export function isAllowedReturnUrl(url: string) {
  const schemes = (Deno.env.get('APP_RETURN_SCHEMES') ?? 'rentora,exp').split(',').map((s) => s.trim());
  try {
    return schemes.includes(new URL(url).protocol.replace(':', ''));
  } catch {
    return false;
  }
}
