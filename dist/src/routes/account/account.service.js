import { AccountModel } from "./account.model";
export class AccountService {
    constructor(prisma) {
        this.prisma = prisma;
        this.accountModel = new AccountModel(prisma);
    }
    async createAccount(data, requesterRole) {
        // Only admins can create accounts
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        // Check if organization exists
        const organization = await this.prisma.organization.findUnique({
            where: { id: data.organizationId },
        });
        if (!organization) {
            throw new Error("ORGANIZATION_NOT_FOUND");
        }
        // Check if organization already has an account (one-to-one relationship)
        const existingAccount = await this.accountModel.findByOrganizationId(data.organizationId);
        if (existingAccount) {
            throw new Error("ORGANIZATION_ALREADY_HAS_ACCOUNT");
        }
        return this.accountModel.create(data);
    }
    async getAccounts(filters, requesterId, requesterRole) {
        // If not admin, check if user has access to the organization
        if (requesterRole !== "ADMIN" && filters.organizationId) {
            const userOrganization = await this.prisma.userOrganization.findFirst({
                where: {
                    userId: requesterId,
                    organizationId: filters.organizationId,
                },
            });
            if (!userOrganization) {
                throw new Error("UNAUTHORIZED");
            }
        }
        // If not admin and no organizationId specified, only show accounts from user's organizations
        if (requesterRole !== "ADMIN" && !filters.organizationId) {
            const userOrganizations = await this.prisma.userOrganization.findMany({
                where: { userId: requesterId },
                select: { organizationId: true },
            });
            if (userOrganizations.length === 0) {
                return {
                    accounts: [],
                    pagination: {
                        page: filters.page || 1,
                        limit: filters.limit || 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            }
            // Override filters to include only user's organizations
            const orgIds = userOrganizations.map(uo => uo.organizationId);
            // For simplicity, we'll filter to the first organization if no specific org is requested
            filters.organizationId = orgIds[0];
        }
        const [accounts, total] = await this.accountModel.findMany(filters);
        return {
            accounts,
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 10,
                total,
                totalPages: Math.ceil(total / (filters.limit || 10)),
            },
        };
    }
    async getAccountById(id, requesterId, requesterRole) {
        const account = await this.accountModel.findById(id);
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
        return account;
    }
    async getAccountByOrganization(organizationId, requesterId, requesterRole) {
        // Check if user has access to this organization
        if (requesterRole !== "ADMIN") {
            const userOrganization = await this.prisma.userOrganization.findFirst({
                where: {
                    userId: requesterId,
                    organizationId,
                },
            });
            if (!userOrganization) {
                throw new Error("UNAUTHORIZED");
            }
        }
        const account = await this.accountModel.findByOrganizationId(organizationId);
        if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        return account;
    }
    async updateAccount(id, data, requesterId, requesterRole) {
        const account = await this.getAccountById(id, requesterId, requesterRole);
        // Only admins can update accounts
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        return this.accountModel.update(id, data);
    }
    async deleteAccount(id, requesterId, requesterRole) {
        const account = await this.getAccountById(id, requesterId, requesterRole);
        // Only admins can delete accounts
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        // Check if account has transactions
        const transactionCount = await this.prisma.transaction.count({
            where: { accountId: id },
        });
        if (transactionCount > 0) {
            throw new Error("ACCOUNT_HAS_TRANSACTIONS");
        }
        await this.accountModel.delete(id);
        return { message: "Account deleted successfully" };
    }
    async getMyAccounts(userId) {
        const userOrganizations = await this.prisma.userOrganization.findMany({
            where: { userId },
            include: {
                organization: {
                    include: {
                        Account: {
                            include: {
                                Transaction: {
                                    orderBy: { createdAt: "desc" },
                                    take: 5,
                                },
                                _count: {
                                    select: {
                                        Transaction: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return userOrganizations
            .filter(uo => uo.organization.Account)
            .map(uo => ({
            ...uo.organization.Account,
            organization: {
                id: uo.organization.id,
                name: uo.organization.name,
            },
        }));
    }
}
