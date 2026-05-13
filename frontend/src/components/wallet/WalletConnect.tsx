import React from "react";
import { useWallet } from "../../hooks/useWallet";

export function WalletConnect() {
  const { address, loading, error, connect } = useWallet();

  if (address) return null;

  return (
    <div>
      <button onClick={connect} disabled={loading} aria-busy={loading}>
        {loading ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
