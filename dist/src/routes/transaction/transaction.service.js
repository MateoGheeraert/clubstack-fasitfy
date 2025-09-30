import { TransactionModel } from "./transaction.model";
export class TransactionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.transactionModel = new TransactionModel(prisma);
    }
    async createTransaction(data, requesterId, requesterRole) {
        // Check if account exists and user has access
        const account = await this.prisma.account.findUnique({
            where: { id: data.accountId },
            include: {
                organization: true,
            },
        });
        if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        // Check if user has access to this account
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
        // Start a transaction to ensure data consistency
        return this.prisma.$transaction(async (tx) => {
            // Create the transaction
            const transaction = await this.transactionModel.create(data);
            // Update account balance
            await this.transactionModel.updateAccountBalance(data.accountId, data.amount, data.transactionType);
            return transaction;
        });
    }
    async getTransactions(filters, requesterId, requesterRole) {
        // If not admin, filter by user's organizations
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
            // If organizationId is specified, check if user has access
            if (filters.organizationId) {
                const hasAccess = userOrganizations.some(uo => uo.organizationId === filters.organizationId);
                if (!hasAccess) {
                    throw new Error("UNAUTHORIZED");
                }
            }
            else {
                // If no organizationId specified, default to the first one
                filters.organizationId = userOrganizations[0].organizationId;
            }
            // If accountId is specified, verify it belongs to user's organizations
            if (filters.accountId) {
                const account = await this.prisma.account.findUnique({
                    where: { id: filters.accountId },
                });
                if (!account) {
                    throw new Error("ACCOUNT_NOT_FOUND");
                }
                const hasAccess = userOrganizations.some(uo => uo.organizationId === account.organizationId);
                if (!hasAccess) {
                    throw new Error("UNAUTHORIZED");
                }
            }
        }
        const { transactions, total, summary } = await this.transactionModel.findMany(filters);
        return {
            transactions,
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 10,
                total,
                totalPages: Math.ceil(total / (filters.limit || 10)),
            },
            summary,
        };
    }
    async getTransactionById(id, requesterId, requesterRole) {
        const transaction = await this.transactionModel.findById(id);
        if (!transaction) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        // Check if user has access to this transaction
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
    async updateTransaction(id, data, requesterId, requesterRole) {
        const transaction = await this.getTransactionById(id, requesterId, requesterRole);
        // Only admins can update transactions
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        // If amount or transaction type is being updated, we need to adjust the account balance
        if (data.amount !== undefined || data.transactionType !== undefined) {
            return this.prisma.$transaction(async (tx) => {
                // Reverse the original transaction's effect on the balance
                await this.transactionModel.reverseAccountBalance(transaction.accountId, transaction.amount, transaction.transactionType);
                // Update the transaction
                const updatedTransaction = await this.transactionModel.update(id, data);
                // Apply the new transaction's effect on the balance
                await this.transactionModel.updateAccountBalance(transaction.accountId, data.amount ?? transaction.amount, data.transactionType ?? transaction.transactionType);
                return updatedTransaction;
            });
        }
        else {
            // No balance changes needed, just update the transaction
            return this.transactionModel.update(id, data);
        }
    }
    async deleteTransaction(id, requesterId, requesterRole) {
        const transaction = await this.getTransactionById(id, requesterId, requesterRole);
        // Only admins can delete transactions
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        return this.prisma.$transaction(async (tx) => {
            // Reverse the transaction's effect on the account balance
            await this.transactionModel.reverseAccountBalance(transaction.accountId, transaction.amount, transaction.transactionType);
            // Delete the transaction
            await this.transactionModel.delete(id);
            return { message: "Transaction deleted successfully" };
        });
    }
    async getAccountTransactions(accountId, filters, requesterId, requesterRole) {
        // Check if account exists and user has access
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                organization: true,
            },
        });
        if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        // Check if user has access to this account
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
        return this.getTransactions({ ...filters, accountId }, requesterId, requesterRole);
    }
    async getMyTransactions(userId, filters) {
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
        // Get transactions from the first organization (or could be expanded to all organizations)
        const organizationId = userOrganizations[0].organizationId;
        return this.getTransactions({ ...filters, organizationId }, userId, "USER");
    }
}
