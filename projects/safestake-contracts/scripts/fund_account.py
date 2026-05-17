from algokit_utils import AlgorandClient, PaymentParams, AlgoAmount
import logging

logging.basicConfig(level=logging.INFO)

def fund():
    try:
        # Initialize Algorand client explicitly for localnet
        algorand = AlgorandClient.default_localnet()
        # Alternatively, force explicit connection if auto-detect fails:
        # algorand = AlgorandClient.from_config(algod_config={"server": "http://localhost:4001", "token": "a"*64}, indexer_config={"server": "http://localhost:8980", "token": "a"*64})

        # The address to fund (from user error message)
        receiver_address = "FNUHGPMPHIDIM2W7CJH64O5Y3N2YMIMNSDJLPT32WRVLX777WTCJ75YLFQ"
        
        # Get the default dispenser account (rich account on localnet)
        dispenser = algorand.account.dispenser()

        print(f"Funding {receiver_address} from {dispenser.address}...")

        # Send 100 Algos
        result = algorand.send.payment(
            PaymentParams(
                sender=dispenser.address,
                receiver=receiver_address,
                amount=AlgoAmount.from_algo(100),
                signer=dispenser.signer
            )
        )

        print(f"Payment successful! TxID: {result.tx_id}")
        print(f"Funded {receiver_address} with 100 Algos.")

    except Exception as e:
        print(f"Error funding account: {e}")

if __name__ == "__main__":
    fund()
