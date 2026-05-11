import { useState, useCallback } from "react";
import { walletsKit } from "../lib/wallet/stellarWalletsKit";
import { loginWithWallet } from "../lib/auth/authClient";

const AUTH_MESSAGE = "Sign in to TitleChain";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await walletsKit.openModal({
        onWalletSelected: async (option) => {
          walletsKit.setWallet(option.id);
          const { address: walletAddress } = await walletsKit.getAddress();
          const { signedMessage } = await walletsKit.signMessage({
            message: AUTH_MESSAGE,
            address: walletAddress,
          });
          const accessToken = await loginWithWallet(walletAddress, signedMessage, AUTH_MESSAGE);
          setAddress(walletAddress);
          setToken(accessToken);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setToken(null);
  }, []);

  return { address, token, loading, error, connect, disconnect };
}
