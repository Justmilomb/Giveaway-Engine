import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = fetch("/api/config")
      .then((res) => res.json())
      .then((data) => loadStripe(data.stripePublishableKey));
  }
  return stripePromise;
}
