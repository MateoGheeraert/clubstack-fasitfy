import { PrismaClient, Role } from "@prisma/client";
import {
  CreateAccountInput,
  UpdateAccountInput,
  AccountFilters,
} from "./types";

export class AccountService {
  constructor(private prisma: PrismaClient) {}

  async createAccount(data: CreateAccountInput, requesterRole: Role) {
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

    return this.prisma.account.create({
      data: {
        ...data,
        balance: data.balance ?? 0.0,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        Transaction: true,
        _count: {
          select: {
            Transaction: true,
          },
        },
      },
    });
  }

  async getAccounts(
    filters: AccountFilters,
    requesterId: string,
    requesterRole: Role
  ) {
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

      filters.organizationId = userOrganizations[0].organizationId;
    }

    const { organizationId, type, accountName, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (type) where.type = type;
    if (accountName) {
      where.accountName = {
        contains: accountName,
        mode: "insensitive",
      };
    }

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAccountById(id: string, requesterId: string, requesterRole: Role) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        Transaction: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            Transaction: true,
          },
        },
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

    return account;
  }

  async getAccountByOrganization(
    organizationId: string,
    requesterId: string,
    requesterRole: Role
  ) {
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

    const accounts = await this.prisma.account.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            Transaction: true,
          },
        },
      },
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("ACCOUNTS_NOT_FOUND");
    }

    return accounts;
  }

  async updateAccount(
    id: string,
    data: UpdateAccountInput,
    requesterId: string,
    requesterRole: Role
  ) {
    await this.getAccountById(id, requesterId, requesterRole);

    // Only admins can update accounts
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    return this.prisma.account.update({
      where: { id },
      data,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        Transaction: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            Transaction: true,
          },
        },
      },
    });
  }

  async deleteAccount(id: string, requesterId: string, requesterRole: Role) {
    await this.getAccountById(id, requesterId, requesterRole);

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

    await this.prisma.account.delete({
      where: { id },
    });

    return { message: "Account deleted successfully" };
  }

  async getMyAccounts(userId: string) {
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
      .flatMap((uo) => 
        uo.organization.Account.map((account) => ({
          ...account,
          organization: {
            id: uo.organization.id,
            name: uo.organization.name,
          },
        }))
      );
  }
}
