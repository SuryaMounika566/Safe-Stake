from algosdk.v2client import algod
from algosdk import account, mnemonic
from algosdk.transaction import PaymentTxn
import sys

def fund_manual():
    # Keep file open for duration
    sys.stdout = open("debug_log.txt", "w")
    sys.stderr = sys.stdout
    print("Starting fund_manual script...")

    try:
        # Localnet default config
        algod_token = "a" * 64
        algod_address = "http://localhost:4001"
        client = algod.AlgodClient(algod_token, algod_address)
        
        # Check connection
        status = client.status()
        print(f"Connected to Localnet, last round: {status['last-round']}")

        # Localnet dispenser mnemonic (hardcoded default for sandbox)
        # This is the standard collaborative KMD wallet mnemonic for localnet
        dispenser_mnemonic = "enforce drive foster uniform cradle tired win arrow wasp melt cattle frown oblivious legend unlock total left hike grit guitar fruit knot withdraw ability summer"
        dispenser_sk = mnemonic.to_private_key(dispenser_mnemonic)
        dispenser_addr = account.address_from_private_key(dispenser_sk)

        receiver = "FNUHGPMPHIDIM2W7CJH64O5Y3N2YMIMNSDJLPT32WRVLX777WTCJ75YLFQ"
        print(f"Funding {receiver} from {dispenser_addr}...")

        params = client.suggested_params()
        txn = PaymentTxn(dispenser_addr, params, receiver, 100_000_000) # 100 Algos

        signed_txn = txn.sign(dispenser_sk)
        txid = client.send_transaction(signed_txn)
        print(f"Sent transaction: {txid}")

        # Wait for confirmation
        wait_rounds = 5
        current_round = status['last-round']
        while True:
            try:
                confirmed_txn = client.pending_transaction_info(txid)
                if confirmed_txn.get("confirmed-round", 0) > 0:
                    print(f"Transaction confirmed in round {confirmed_txn.get('confirmed-round')}")
                    break
            except Exception as e:
                pass
            
            client.status_after_block(current_round + 1)
            current_round += 1

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fund_manual()
