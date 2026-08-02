'use client';

/**
 * Browser side of PayHere's checkout.
 *
 * The popup is driven by PayHere's own script, which we load on demand rather
 * than on every page. Everything it needs — including the hash — is built on
 * the server; nothing here decides that a payment succeeded.
 */

const SCRIPT_SRC = "https://www.payhere.lk/lib/payhere.js";

export interface PayHereCheckout {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface PayHereGlobal {
  startPayment: (payment: PayHereCheckout) => void;
  onCompleted?: (orderId: string) => void;
  onDismissed?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    payhere?: PayHereGlobal;
  }
}

let loader: Promise<PayHereGlobal> | null = null;

/** Loads payhere.js once and hands back the global it defines. */
export function loadPayHere(): Promise<PayHereGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("PayHere needs a browser"));
  if (window.payhere) return Promise.resolve(window.payhere);
  if (loader) return loader;

  loader = new Promise<PayHereGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");

    const done = () => {
      if (window.payhere) resolve(window.payhere);
      else reject(new Error("PayHere failed to load"));
    };
    const failed = () => {
      loader = null; // let the next attempt try again
      reject(new Error("Couldn't reach PayHere"));
    };

    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", failed, { once: true });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return loader;
}

interface CheckoutHandlers {
  /** PayHere finished with this order — the result still has to be read from our own records. */
  onCompleted?: (orderId: string) => void;
  /** The student closed the payment window. */
  onDismissed?: () => void;
  onError?: (error: string) => void;
}

/** Opens PayHere's checkout for a payment object built by the server. */
export async function startPayHereCheckout(checkout: PayHereCheckout, handlers: CheckoutHandlers) {
  const payhere = await loadPayHere();

  // PayHere hangs its callbacks off the global, so they are set per checkout.
  payhere.onCompleted = (orderId: string) => handlers.onCompleted?.(orderId);
  payhere.onDismissed = () => handlers.onDismissed?.();
  payhere.onError = (error: string) => handlers.onError?.(error);

  payhere.startPayment(checkout);
}
