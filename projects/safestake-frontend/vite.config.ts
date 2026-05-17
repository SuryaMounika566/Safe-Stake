import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Dev-only mock plugin for /api/chatbot
function mockChatbotPlugin() {
  return {
    name: "vite:mock-chatbot",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === "/api/chatbot" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const question = (parsed.question || parsed.prompt || "").toString();
              // Simple keyword-based answers for development (more useful than an echo)
              const q = question.trim().toLowerCase();
              let answer = "Sorry, I don't have an answer for that in the dev mock.";

              if (!q) {
                answer = "Mock answer: no question provided.";
              } else if (/^hi$|hello|hey|how are you/.test(q)) {
                answer = "Hi — I'm the Safe Stake assistant. Ask about funding, milestones, voting, wallets, contracts, or site help!";
              } else if (/fund|donate|how to fund|donation/.test(q)) {
                answer = "To donate: visit a fundraiser, click Donate, connect your Algorand wallet, and follow confirmation steps. Use funded accounts for Testnet/Mainnet.";
              } else if (/create|start|new fundraiser|fundraiser/.test(q)) {
                answer = "To start a fundraiser: use the 'Create Fundraiser' page, fill in project details and milestones, then deploy on-chain and share your link.";
              } else if (/proposal|contract|app id|app_address|app address/.test(q)) {
                answer = "Find the smart contract code under projects/safestake-contracts/smart_contracts/artifacts/ff/ProposalContract.arc56.json. The client for integration is at src/contracts/ProposalContractClient.ts.";
              } else if (/wallet|connect|perawallet|walletconnect|connect wallet/.test(q)) {
                answer = "Click the wallet connect button in the UI and approve via your Algorand wallet (Pera, WalletConnect, etc).";
              } else if (/what is safe stake|what is safestake|about|info/.test(q)) {
                answer = "Safe Stake is a transparent blockchain crowdfunding platform on Algorand, supporting milestone-based funding releases through community governance.";
              } else if (/help|support|issue/.test(q)) {
                answer = "For issues, check the browser console and frontend dev logs. For smart contract errors, inspect artifact folders and run the client code generator if needed.";
              } else if (/milestone|stage|how many milestones|milestone fund|release funds/.test(q)) {
                answer = "Projects have up to 5 milestones. Funds are released only after each milestone is completed and approved by donors' weighted vote.";
              } else if (/vote|voting|how to vote|approve|reject|how to approve|how to reject/.test(q)) {
                answer = "Donors vote on milestones after proof is submitted. Voting lasts 48 hours and is weighted by donation size. Approved milestones unlock their funds.";
              } else if (/refund|inactive|money back|project inactive|get refund/.test(q)) {
                answer = "If a project is abandoned for 3 months, donors can claim refunds proportionally for unused funds.";
              } else if (/secure|security|escrow|safe/.test(q)) {
                answer = "All donated ALGO is held in an Algorand smart contract escrow until milestone approval, which helps prevent misuse or unauthorized withdrawals.";
              } else if (/algorand network|testnet|mainnet|network/.test(q)) {
                answer = "Deploy contracts and test donations on Algorand Testnet or Mainnet. Use compatible wallets and make sure your test account or mainnet wallet is funded.";
              } else if (/fee|transaction fee|gas fee/.test(q)) {
                answer = "Each blockchain transaction (donations, voting, claims) has a small Algorand network fee. Keep a balance to cover both your donation and fees for smooth operation.";
              } else if (/submit proof|proof|how to submit proof/.test(q)) {
                answer = "After building a milestone, the creator submits proof (like a GitHub link or report). Donors then vote to approve or reject based on the proof provided.";
              } else if (/contact|community|discord|github|contribute/.test(q)) {
                answer = "Join the community via Discord or GitHub (https://github.com/Greeshma370/algorand-hackseries-factfunders). Your questions and contributions are welcome!";
              } else if (/mobile|mobile app|phone/.test(q)) {
                answer = "You can use Safe Stake on mobile browsers. Wallet connection works via WalletConnect-compatible apps.";
              } else if (/language|tech stack|backend|frontend|typescript|python/.test(q)) {
                answer = "Safe Stake uses TypeScript for frontend/smart contract clients, Python (AlgoPy/PyTeal) for contracts, built with React and various Algorand SDK libraries.";
              } else if (/roadmap|future|coming soon|next/.test(q)) {
                answer = "Future updates include more blockchain integrations, social fundraisers, advanced voting models, and faster milestone verification tools.";
              } else if (/audit|audited|security audit/.test(q)) {
                answer = "Smart contracts can be audited using standard Algorand and Python tooling; check the repo for audit reports and documentation before mainnet deployment.";
              } else if (/privacy|data|private/.test(q)) {
                answer = "Safe Stake stores only necessary public data on-chain. Private info and KYC are not handled by us; user accounts are managed on the wallet/provider side.";
              } else if (/admin|moderator|ban|block/.test(q)) {
                answer = "There are no centralized admins; the platform is governed by smart contracts and community votes. Suspicious activity can be flagged but not directly blocked by admins.";
              } else {
                answer = `Sorry, I don't have a direct answer for "${q}". Please contact a Safe Stake representative for personalized help or detailed queries. Go to Contacts and directly reach out to the team by mailing us. Thank you!`;
              }

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ answer }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ message: "Invalid request body" }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // include the mock plugin so POST /api/chatbot will return a dev response
    mockChatbotPlugin(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,

      },
      // Override the default polyfills for specific modules.
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        fs: "memfs",
      },
      // Exclude specific modules from being polyfilled.
      exclude: [
        "http", // Excludes the polyfill for `http` and `node:http`.
        "https", // Excludes the polyfill for `https` and `node:https`.
      ],
    }),
  ],
  base: "./",
  optimizeDeps: {
    exclude: ["lucide-react", "@noble/ed25519", "@perawallet/connect", "@walletconnect/modal", "@walletconnect/sign-client"],
    include: [
      "buffer",
      "process",
      "use-sync-external-store/shim/with-selector",
      "@txnlab/use-wallet",
      "@txnlab/use-wallet-react",
      "@txnlab/use-wallet-ui-react",
    ],
  },

  define: {
    // global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
