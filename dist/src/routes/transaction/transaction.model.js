export class TransactionModel {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.transaction.findUnique({
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
    }
    async create(data) {
        return this.prisma.transaction.create({
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
    async update(id, data) {
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
    async delete(id) {
        return this.prisma.transaction.delete({
            where: { id },
        });
    }
    async findMany(filters) {
        const { accountId, organizationId, transactionType, startDate, endDate, minAmount, maxAmount, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (accountId) {
            where.accountId = accountId;
        }
        else if (organizationId) {
            where.account = {
                organizationId,
            };
        }
        if (transactionType) {
            where.transactionType = transactionType;
        }
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate)
                where.transactionDate.gte = startDate;
            if (endDate)
                where.transactionDate.lte = endDate;
        }
        if (minAmount !== undefined || maxAmount !== undefined) {
            where.amount = {};
            if (minAmount !== undefined)
                where.amount.gte = minAmount;
            if (maxAmount !== undefined)
                where.amount.lte = maxAmount;
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
        return { transactions, total, summary };
    }
    async getSummary(where) {
        const summary = await this.prisma.transaction.groupBy({
            by: ['transactionType'],
            where,
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
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
                case 'DEPOSIT':
                    result.deposits += amount;
                    break;
                case 'WITHDRAWAL':
                    result.withdrawals += amount;
                    break;
                case 'PAYMENT':
                    result.payments += amount;
                    break;
                case 'INCOME':
                    result.income += amount;
                    break;
            }
        });
        return result;
    }
    async updateAccountBalance(accountId, amount, transactionType) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        let balanceChange = 0;
        switch (transactionType) {
            case 'DEPOSIT':
            case 'INCOME':
                balanceChange = amount;
                break;
            case 'WITHDRAWAL':
            case 'PAYMENT':
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
    async reverseAccountBalance(accountId, amount, transactionType) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        let balanceChange = 0;
        // Reverse the original transaction effect
        switch (transactionType) {
            case 'DEPOSIT':
            case 'INCOME':
                balanceChange = -amount;
                break;
            case 'WITHDRAWAL':
            case 'PAYMENT':
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
}
