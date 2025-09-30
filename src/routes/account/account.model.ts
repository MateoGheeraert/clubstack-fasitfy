import {
  PrismaClient,
  Account,
  Transaction,
  Organization,
} from "@prisma/client";

export type AccountWithTransactions = Account & {
  organization: Pick<Organization, "id" | "name">;
  Transaction: Transaction[];
  _count: {
    Transaction: number;
  };
};

export type AccountWithDetails = Account & {
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

export class AccountModel {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.account.findUnique({
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
  }

  async findByOrganizationId(organizationId: string) {
    return this.prisma.account.findUnique({
      where: { organizationId },
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

  async create(data: CreateAccountInput) {
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

  async update(id: string, data: UpdateAccountInput) {
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

  async delete(id: string) {
    return this.prisma.account.delete({
      where: { id },
    });
  }

  async findMany(filters: AccountFilters) {
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

    return Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
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
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.account.count({ where }),
    ]);
  }
}
