import { PrismaClient, Activity, Organization } from "@prisma/client";

export type ActivityWithOrganization = Activity & {
  organization: Pick<Organization, "id" | "name">;
};

export type CreateActivityInput = {
  organizationId: string;
  title: string;
  starts_at: Date;
  ends_at: Date;
  location?: string;
  description?: string;
  attendees?: string[];
};

export type UpdateActivityInput = {
  title?: string;
  starts_at?: Date;
  ends_at?: Date;
  location?: string;
  description?: string;
  attendees?: string[];
};

export type ActivityFilters = {
  organizationId?: string;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  page?: number;
  limit?: number;
};

export type ActivitiesResponse = {
  activities: ActivityWithOrganization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class ActivityModel {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.activity.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async create(data: CreateActivityInput) {
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

  async update(id: string, data: UpdateActivityInput) {
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

  async delete(id: string) {
    return this.prisma.activity.delete({
      where: { id },
    });
  }

  async findMany(filters: ActivityFilters) {
    const {
      organizationId,
      title,
      startDate,
      endDate,
      location,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (title) {
      where.title = {
        contains: title,
        mode: "insensitive",
      };
    }

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      where.starts_at = {};
      if (startDate) where.starts_at.gte = startDate;
      if (endDate) where.starts_at.lte = endDate;
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

  async findByOrganizationId(
    organizationId: string,
    filters: Omit<ActivityFilters, "organizationId">
  ) {
    return this.findMany({ ...filters, organizationId });
  }

  async findUpcoming(organizationId?: string, limit: number = 5) {
    const now = new Date();
    const where: any = {
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

  async addAttendee(id: string, attendee: string) {
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

  async removeAttendee(id: string, attendee: string) {
    const activity = await this.findById(id);
    if (!activity) {
      throw new Error("ACTIVITY_NOT_FOUND");
    }

    const updatedAttendees = activity.attendees.filter((a) => a !== attendee);

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
