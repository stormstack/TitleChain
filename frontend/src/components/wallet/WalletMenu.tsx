import React from "react";
import { useWallet } from "../../hooks/useWallet";

export function WalletMenu() {
  const { address, disconnect } = useWallet();

  if (!address) return null;

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div>
      <span title={address}>{short}</span>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
