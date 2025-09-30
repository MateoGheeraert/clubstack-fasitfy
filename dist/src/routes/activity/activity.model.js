export class ActivityModel {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.activity.findUnique({
            where: { id },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async create(data) {
        return this.prisma.activity.create({
            data: {
                ...data,
                attendees: data.attendees || [],
            },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async update(id, data) {
        return this.prisma.activity.update({
            where: { id },
            data,
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async delete(id) {
        return this.prisma.activity.delete({
            where: { id },
        });
    }
    async findMany(filters) {
        const { organizationId, title, startDate, endDate, location, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (organizationId) {
            where.organizationId = organizationId;
        }
        if (title) {
            where.title = {
                contains: title,
                mode: 'insensitive',
            };
        }
        if (location) {
            where.location = {
                contains: location,
                mode: 'insensitive',
            };
        }
        if (startDate || endDate) {
            where.starts_at = {};
            if (startDate)
                where.starts_at.gte = startDate;
            if (endDate)
                where.starts_at.lte = endDate;
        }
        return Promise.all([
            this.prisma.activity.findMany({
                where,
                skip,
                take: limit,
                include: {
                    organization: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { starts_at: "asc" },
            }),
            this.prisma.activity.count({ where }),
        ]);
    }
    async findByOrganizationId(organizationId, filters) {
        return this.findMany({ ...filters, organizationId });
    }
    async findUpcoming(organizationId, limit = 5) {
        const now = new Date();
        const where = {
            starts_at: {
                gte: now,
            },
        };
        if (organizationId) {
            where.organizationId = organizationId;
        }
        return this.prisma.activity.findMany({
            where,
            take: limit,
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { starts_at: "asc" },
        });
    }
    async addAttendee(id, attendee) {
        const activity = await this.findById(id);
        if (!activity) {
            throw new Error("ACTIVITY_NOT_FOUND");
        }
        if (activity.attendees.includes(attendee)) {
            throw new Error("ATTENDEE_ALREADY_EXISTS");
        }
        return this.prisma.activity.update({
            where: { id },
            data: {
                attendees: {
                    push: attendee,
                },
            },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async removeAttendee(id, attendee) {
        const activity = await this.findById(id);
        if (!activity) {
            throw new Error("ACTIVITY_NOT_FOUND");
        }
        const updatedAttendees = activity.attendees.filter(a => a !== attendee);
        return this.prisma.activity.update({
            where: { id },
            data: {
                attendees: updatedAttendees,
            },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        });
    }
}
