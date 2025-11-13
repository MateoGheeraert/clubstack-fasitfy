import { Account, Transaction, Organization } from "@prisma/client";

export type AccountWithTransactions = Account & {
  organization: Pick<Organization, "id" | "name">;
  Transaction: Transaction[];
  _count: {
    Transaction: number;
  };
};

export type CreateAccountInput = {
  organizationId: string;
  accountName: string;
  type: string;
  balance?: number;
};

export type UpdateAccountInput = {
  accountName?: string;
  type?: string;
  balance?: number;
};

export type AccountFilters = {
  organizationId?: string;
  type?: string;
  accountName?: string;
  page?: number;
  limit?: number;
};

export type AccountsResponse = {
  accounts: AccountWithTransactions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
