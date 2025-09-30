export class OrganizationModel {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    include: {
                        user: {
                            select: { id: true, email: true, role: true },
                        },
                    },
                },
                Account: true,
                Activity: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                _count: {
                    select: {
                        users: true,
                        Activity: true,
                    },
                },
            },
        });
    }
    async findByName(name) {
        return this.prisma.organization.findUnique({
            where: { name },
        });
    }
    async create(data) {
        return this.prisma.organization.create({
            data,
            include: {
                users: {
                    include: {
                        user: {
                            select: { id: true, email: true, role: true },
                        },
                    },
                },
            },
        });
    }
    async update(id, data) {
        return this.prisma.organization.update({
            where: { id },
            data,
            include: {
                users: {
                    include: {
                        user: {
                            select: { id: true, email: true, role: true },
                        },
                    },
                },
            },
        });
    }
    async delete(id) {
        return this.prisma.organization.delete({
            where: { id },
        });
    }
    async findMany(filters) {
        const { name, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            };
        }
        return Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take: limit,
                include: {
                    users: {
                        include: {
                            user: {
                                select: { id: true, email: true, role: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.organization.count({ where }),
        ]);
    }
    async addUser(organizationId, userId) {
        return this.prisma.userOrganization.create({
            data: {
                organizationId,
                userId,
            },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
                organization: true,
            },
        });
    }
    async removeUser(organizationId, userId) {
        return this.prisma.userOrganization.deleteMany({
            where: {
                organizationId,
                userId,
            },
        });
    }
    async getUserOrganizations(userId) {
        return this.prisma.userOrganization.findMany({
            where: { userId },
            include: {
                organization: true,
            },
        });
    }
}
