import { Buffer } from 'buffer';
// Ensure Buffer is available globally for wallet libraries
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import 'react-toastify/dist/ReactToastify.css';
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";
import { WalletUIProvider } from "@txnlab/use-wallet-ui-react";
import { USE_WALLET_NETWORK_ID } from "./data/config";

let wallets = [];
if (USE_WALLET_NETWORK_ID === NetworkId.LOCALNET) {
  wallets = [WalletId.KMD, WalletId.LUTE];
} else {
  wallets = [WalletId.PERA, WalletId.DEFLY, WalletId.LUTE];
}

const walletManager = new WalletManager({
  wallets: wallets,
  defaultNetwork: USE_WALLET_NETWORK_ID,
});

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <WalletProvider manager={walletManager}>
        <WalletUIProvider>
          <App />
        </WalletUIProvider>
      </WalletProvider>
    </StrictMode>
  );
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  document.body.innerHTML = `<div style="color:red; padding: 20px; font-family: monospace;"><h1>Runtime Error</h1><pre>${msg}</pre><p>Check console for more details.</p></div>`;
  console.error("APP CRASHED:", e);
}
