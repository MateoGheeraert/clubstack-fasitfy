export class AccountModel {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
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
    async findByOrganizationId(organizationId) {
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
    async create(data) {
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
    async update(id, data) {
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
    async delete(id) {
        return this.prisma.account.delete({
            where: { id },
        });
    }
    async findMany(filters) {
        const { organizationId, type, accountName, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (type)
            where.type = type;
        if (accountName) {
            where.accountName = {
                contains: accountName,
                mode: 'insensitive',
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
