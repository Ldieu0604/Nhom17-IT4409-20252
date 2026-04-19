const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
const secretKey = process.env.CLERK_SECRET_KEY ?? ""

function isLikelyValidPublishableKey(key: string) {
  return /^(pk_test_|pk_live_)[A-Za-z0-9_]+$/.test(key)
}

function isLikelyValidSecretKey(key: string) {
  return /^(sk_test_|sk_live_)[A-Za-z0-9]+$/.test(key)
}

export const clerkEnabled =
  isLikelyValidPublishableKey(publishableKey) &&
  isLikelyValidSecretKey(secretKey)

export const clerkPublishableKey = clerkEnabled ? publishableKey : undefined
