import algosdk
import sys

def check():
    try:
        # Connect to localnet algod
        algod_token = "a" * 64
        algod_address = "http://localhost:4001"
        client = algosdk.v2client.algod.AlgodClient(algod_token, algod_address)
        
        status = client.status()
        print(f"Algod Status: {status['last-round']}")
        
        # Check balance of the account
        address = "FNUHGPMPHIDIM2W7CJH64O5Y3N2YMIMNSDJLPT32WRVLX777WTCJ75YLFQ"
        account_info = client.account_info(address)
        print(f"Account Balance: {account_info.get('amount')} microAlgos")
        
    except Exception as e:
        print(f"Error connecting to Algod: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check()
