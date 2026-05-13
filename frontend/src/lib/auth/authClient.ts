const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function loginWithWallet(
  walletAddress: string,
  signature: string,
  message: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature, message }),
    credentials: "include",
  });

  if (!res.ok) throw new Error("Authentication failed");

  const data = await res.json();
  return data.access_token as string;
}
