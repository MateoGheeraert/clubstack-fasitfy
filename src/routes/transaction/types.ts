import { Transaction, TransactionType, Account, Organization } from "@prisma/client";

export type TransactionWithAccount = Transaction & {
  account: Account & {
    organization: Pick<Organization, "id" | "name">;
  };
};

export type CreateTransactionInput = {
  accountId: string;
  amount: number;
  transactionType: TransactionType;
  description?: string;
  transactionDate: Date;
  transactionCode: string;
};

export type UpdateTransactionInput = {
  amount?: number;
  transactionType?: TransactionType;
  description?: string;
  transactionDate?: Date;
  transactionCode?: string;
};

export type TransactionFilters = {
  accountId?: string;
  organizationId?: string;
  transactionType?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
};

export type TransactionsResponse = {
  transactions: TransactionWithAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    deposits: number;
    withdrawals: number;
    payments: number;
    income: number;
  };
};
