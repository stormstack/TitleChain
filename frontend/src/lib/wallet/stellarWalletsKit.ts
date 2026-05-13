import { StellarWalletsKit, WalletNetwork, FREIGHTER_ID } from "@stellar/wallets-kit";

export const walletsKit = new StellarWalletsKit({
  network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as WalletNetwork) ?? WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
});
