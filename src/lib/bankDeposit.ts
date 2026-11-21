/**
 * Where students send a bank transfer to top up their wallet.
 *
 * A student deposits to this account, then uploads the slip; an admin checks
 * the amount and approves, which credits the wallet.
 */
export interface BankDepositAccount {
  accountName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
}

export const BANK_DEPOSIT_ACCOUNT: BankDepositAccount = {
  accountName: "A V H Janinda",
  bankName: "Cargills Bank",
  accountNumber: "005101003002",
  branch: "Maharagama",
};
