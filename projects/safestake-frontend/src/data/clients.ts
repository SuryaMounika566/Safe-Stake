import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { CURRENT_NETWORK, APP_ID } from "./config";
import { ProposalContractClient } from "../contracts/ProposalContractClient";

let algorandClient: AlgorandClient;

if (CURRENT_NETWORK === "testnet") {
  algorandClient = AlgorandClient.testNet();
} else if (CURRENT_NETWORK === "mainnet") {
  algorandClient = AlgorandClient.mainNet();
} else {
  algorandClient = AlgorandClient.defaultLocalNet();
}

const appClient = new ProposalContractClient({ algorand: algorandClient, appId: BigInt(APP_ID) });

const syncTimeOffsetInLocalNet = async () => {
  if (CURRENT_NETWORK === "localnet") {
    try {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      const status = await algorandClient.client.algod.status().do();
      
      // Use raw fetch to bypass algosdk v3.3.1 block decode bug
      const blockRes = await fetch(`http://127.0.0.1:4001/v2/blocks/${status.lastRound}?format=json`, {
        headers: { 'X-Algo-API-Token': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }
      });
      const roundTime = await blockRes.json();
      
      const blockTimestamp = Number(roundTime.block?.ts || 0);
      
      if (blockTimestamp > 0) {
        const timeOffset = BigInt(currentTimeInSeconds) - BigInt(blockTimestamp);
        console.log("Time Sync:", { current: currentTimeInSeconds, block: blockTimestamp, offset: timeOffset });
        
        // Let's force update the localnet time!
        await algorandClient.client.algod.setBlockOffsetTimestamp(Number(timeOffset)).do();
        console.log("Successfully synced LocalNet time offset to", timeOffset);
      }
    } catch (error) {
      console.error("Warning: Failed to sync LocalNet time offset:", error);
    }
  }
};

export { algorandClient, appClient, syncTimeOffsetInLocalNet };
