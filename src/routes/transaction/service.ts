import { PrismaClient, Role, TransactionType } from "@prisma/client";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from "./types";

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  private async updateAccountBalance(
    accountId: string,
    amount: number,
    transactionType: TransactionType
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    let balanceChange = 0;
    switch (transactionType) {
      case "DEPOSIT":
      case "INCOME":
        balanceChange = amount;
        break;
      case "WITHDRAWAL":
      case "PAYMENT":
        balanceChange = -amount;
        break;
    }

    const newBalance = account.balance + balanceChange;
    if (newBalance < 0) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }

  private async reverseAccountBalance(
    accountId: string,
    amount: number,
    transactionType: TransactionType
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    let balanceChange = 0;
    switch (transactionType) {
      case "DEPOSIT":
      case "INCOME":
        balanceChange = -amount;
        break;
      case "WITHDRAWAL":
      case "PAYMENT":
        balanceChange = amount;
        break;
    }

    const newBalance = account.balance + balanceChange;
    if (newBalance < 0) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }

  private async getSummary(where: any) {
    const summary = await this.prisma.transaction.groupBy({
      by: ["transactionType"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const result = {
      totalAmount: 0,
      deposits: 0,
      withdrawals: 0,
      payments: 0,
      income: 0,
    };

    summary.forEach((item) => {
      const amount = item._sum.amount || 0;
      result.totalAmount += amount;

      switch (item.transactionType) {
        case "DEPOSIT":
          result.deposits += amount;
          break;
        case "WITHDRAWAL":
          result.withdrawals += amount;
          break;
        case "PAYMENT":
          result.payments += amount;
          break;
        case "INCOME":
          result.income += amount;
          break;
      }
    });

    return result;
  }

  async createTransaction(
    data: CreateTransactionInput,
    requesterId: string,
    requesterRole: Role
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
      include: { organization: true },
    });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (requesterRole !== "ADMIN") {
      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          userId: requesterId,
          organizationId: account.organizationId,
        },
      });
      if (!userOrganization) {
        throw new Error("UNAUTHORIZED");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await this.prisma.transaction.create({
        data,
        include: {
          account: {
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      await this.updateAccountBalance(
        data.accountId,
        data.amount,
        data.transactionType
      );

      return transaction;
    });
  }

  async getTransactions(
    filters: TransactionFilters,
    requesterId: string,
    requesterRole: Role
  ) {
    if (requesterRole !== "ADMIN") {
      const userOrganizations = await this.prisma.userOrganization.findMany({
        where: { userId: requesterId },
        select: { organizationId: true },
      });

      if (userOrganizations.length === 0) {
        return {
          transactions: [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0,
          },
          summary: {
            totalAmount: 0,
            deposits: 0,
            withdrawals: 0,
            payments: 0,
            income: 0,
          },
        };
      }

      if (filters.organizationId) {
        const hasAccess = userOrganizations.some(
          (uo) => uo.organizationId === filters.organizationId
        );
        if (!hasAccess) {
          throw new Error("UNAUTHORIZED");
        }
      } else {
        filters.organizationId = userOrganizations[0].organizationId;
      }

      if (filters.accountId) {
        const account = await this.prisma.account.findUnique({
          where: { id: filters.accountId },
        });
        if (!account) {
          throw new Error("ACCOUNT_NOT_FOUND");
        }

        const hasAccess = userOrganizations.some(
          (uo) => uo.organizationId === account.organizationId
        );
        if (!hasAccess) {
          throw new Error("UNAUTHORIZED");
        }
      }
    }

    const {
      accountId,
      organizationId,
      transactionType,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (accountId) {
      where.accountId = accountId;
    } else if (organizationId) {
      where.account = { organizationId };
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = startDate;
      if (endDate) where.transactionDate.lte = endDate;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    const [transactions, total, summary] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: {
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { transactionDate: "desc" },
      }),
      this.prisma.transaction.count({ where }),
      this.getSummary(where),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  async getTransactionById(
    id: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    if (requesterRole !== "ADMIN") {
      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          userId: requesterId,
          organizationId: transaction.account.organization.id,
        },
      });
      if (!userOrganization) {
        throw new Error("UNAUTHORIZED");
      }
    }

    return transaction;
  }

  async updateTransaction(
    id: string,
    data: UpdateTransactionInput,
    requesterId: string,
    requesterRole: Role
  ) {
    const transaction = await this.getTransactionById(
      id,
      requesterId,
      requesterRole
    );

    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    if (data.amount !== undefined || data.transactionType !== undefined) {
      return this.prisma.$transaction(async (tx) => {
        await this.reverseAccountBalance(
          transaction.accountId,
          transaction.amount,
          transaction.transactionType
        );

        const updatedTransaction = await this.prisma.transaction.update({
          where: { id },
          data,
          include: {
            account: {
              include: {
                organization: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        await this.updateAccountBalance(
          transaction.accountId,
          data.amount ?? transaction.amount,
          data.transactionType ?? transaction.transactionType
        );

        return updatedTransaction;
      });
    } else {
      return this.prisma.transaction.update({
        where: { id },
        data,
        include: {
          account: {
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    }
  }

  async deleteTransaction(
    id: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const transaction = await this.getTransactionById(
      id,
      requesterId,
      requesterRole
    );

    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.reverseAccountBalance(
        transaction.accountId,
        transaction.amount,
        transaction.transactionType
      );

      await this.prisma.transaction.delete({
        where: { id },
      });

      return { message: "Transaction deleted successfully" };
    });
  }

  async getAccountTransactions(
    accountId: string,
    filters: Omit<TransactionFilters, "accountId">,
    requesterId: string,
    requesterRole: Role
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { organization: true },
    });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (requesterRole !== "ADMIN") {
      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          userId: requesterId,
          organizationId: account.organizationId,
        },
      });
      if (!userOrganization) {
        throw new Error("UNAUTHORIZED");
      }
    }

    return this.getTransactions(
      { ...filters, accountId },
      requesterId,
      requesterRole
    );
  }

  async getMyTransactions(
    userId: string,
    filters: Omit<TransactionFilters, "organizationId">
  ) {
    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    if (userOrganizations.length === 0) {
      return {
        transactions: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        },
        summary: {
          totalAmount: 0,
          deposits: 0,
          withdrawals: 0,
          payments: 0,
          income: 0,
        },
      };
    }

    const organizationId = userOrganizations[0].organizationId;
    return this.getTransactions({ ...filters, organizationId }, userId, "USER");
  }
}
