/**
 * Where students send a bank transfer to top up their wallet.
 *
 * Mock details for now — swap these for the real MiniUni account before going
 * live. A student deposits to this account, then uploads the slip; an admin
 * checks the amount and approves, which credits the wallet.
 */
export interface BankDepositAccount {
  accountName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
}

export const BANK_DEPOSIT_ACCOUNT: BankDepositAccount = {
  accountName: "MiniUni (Pvt) Ltd",
  bankName: "Bank of Ceylon",
  accountNumber: "0000 1234 5678",
  branch: "Colombo 03",
};
