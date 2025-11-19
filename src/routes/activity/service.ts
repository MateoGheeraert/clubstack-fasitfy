import { PrismaClient, Role } from "@prisma/client";
import {
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilters,
} from "./types";

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  async createActivity(
    data: CreateActivityInput,
    requesterId: string,
    requesterRole: Role
  ) {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    // Check if user has access to this organization
    if (requesterRole !== "ADMIN") {
      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          userId: requesterId,
          organizationId: data.organizationId,
        },
      });
      if (!userOrganization) {
        throw new Error("UNAUTHORIZED");
      }
    }

    // Validate dates
    if (data.starts_at >= data.ends_at) {
      throw new Error("INVALID_DATE_RANGE");
    }

    return this.prisma.activity.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        location: data.location,
        description: data.description,
        nonUserAttendees: data.nonUserAttendees || [],
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getActivities(
    filters: ActivityFilters,
    requesterId: string,
    requesterRole: Role
  ) {
    // If not admin, filter by user's organizations
    if (requesterRole !== "ADMIN") {
      const userOrganizations = await this.prisma.userOrganization.findMany({
        where: { userId: requesterId },
        select: { organizationId: true },
      });

      if (userOrganizations.length === 0) {
        return {
          activities: [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // If organizationId is specified, check if user has access
      if (filters.organizationId) {
        const hasAccess = userOrganizations.some(
          (uo) => uo.organizationId === filters.organizationId
        );
        if (!hasAccess) {
          throw new Error("UNAUTHORIZED");
        }
      } else {
        // If no organizationId specified, default to the first one
        filters.organizationId = userOrganizations[0].organizationId;
      }
    }

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

    const [activities, total] = await Promise.all([
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

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityById(id: string, requesterId: string, requesterRole: Role) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!activity) {
      throw new Error("ACTIVITY_NOT_FOUND");
    }

    // Check if user has access to this activity
    if (requesterRole !== "ADMIN") {
      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          userId: requesterId,
          organizationId: activity.organizationId,
        },
      });
      if (!userOrganization) {
        throw new Error("UNAUTHORIZED");
      }
    }

    return activity;
  }

  async updateActivity(
    id: string,
    data: UpdateActivityInput,
    requesterId: string,
    requesterRole: Role
  ) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can update activities
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Validate dates if both are provided
    if (data.starts_at && data.ends_at && data.starts_at >= data.ends_at) {
      throw new Error("INVALID_DATE_RANGE");
    }

    // Validate dates if only one is provided
    if (data.starts_at && !data.ends_at && data.starts_at >= activity.ends_at) {
      throw new Error("INVALID_DATE_RANGE");
    }

    if (data.ends_at && !data.starts_at && activity.starts_at >= data.ends_at) {
      throw new Error("INVALID_DATE_RANGE");
    }

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

  async deleteActivity(id: string, requesterId: string, requesterRole: Role) {
    await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can delete activities
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    await this.prisma.activity.delete({
      where: { id },
    });

    return { message: "Activity deleted successfully" };
  }

  async getOrganizationActivities(
    organizationId: string,
    filters: Omit<ActivityFilters, "organizationId">,
    requesterId: string,
    requesterRole: Role
  ) {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

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

    return this.getActivities({ ...filters, organizationId }, requesterId, requesterRole);
  }

  async getMyActivities(
    userId: string,
    filters: Omit<ActivityFilters, "organizationId">
  ) {
    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    if (userOrganizations.length === 0) {
      return {
        activities: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Get activities from the first organization
    const organizationId = userOrganizations[0].organizationId;
    return this.getActivities({ ...filters, organizationId }, userId, "USER");
  }

  async getUpcomingActivities(
    requesterId: string,
    requesterRole: Role,
    limit: number = 5
  ) {
    const now = new Date();
    const where: any = {
      starts_at: {
        gte: now,
      },
    };

    if (requesterRole !== "ADMIN") {
      const userOrganizations = await this.prisma.userOrganization.findMany({
        where: { userId: requesterId },
        select: { organizationId: true },
      });

      if (userOrganizations.length === 0) {
        return [];
      }

      // Get upcoming activities from the first organization
      where.organizationId = userOrganizations[0].organizationId;
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

  async addAttendee(
    id: string,
    attendee: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can add non-user attendees
    if (requesterRole !== "ADMIN" && requesterRole !== "MODERATOR") {
      throw new Error("UNAUTHORIZED");
    }

    if (activity.nonUserAttendees.includes(attendee)) {
      throw new Error("ATTENDEE_ALREADY_EXISTS");
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        nonUserAttendees: {
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

  async removeAttendee(
    id: string,
    attendee: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can remove non-user attendees
    if (requesterRole !== "ADMIN" && requesterRole !== "MODERATOR") {
      throw new Error("UNAUTHORIZED");
    }

    const updatedAttendees = activity.nonUserAttendees.filter((a: string) => a !== attendee);

    return this.prisma.activity.update({
      where: { id },
      data: {
        nonUserAttendees: updatedAttendees,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async joinActivity(id: string, userId: string) {
    // Check if activity exists
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        attendees: {
          where: { id: userId },
        },
      },
    });

    if (!activity) {
      throw new Error("ACTIVITY_NOT_FOUND");
    }

    // Check if user has access to this organization
    const userOrganization = await this.prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: activity.organizationId,
      },
    });
    if (!userOrganization) {
      throw new Error("UNAUTHORIZED");
    }

    // Check if user is already attending
    if (activity.attendees.length > 0) {
      throw new Error("ALREADY_ATTENDING");
    }

    // Add user to activity attendees
    return this.prisma.activity.update({
      where: { id },
      data: {
        attendees: {
          connect: { id: userId },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        attendees: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async leaveActivity(id: string, userId: string) {
    // Check if activity exists
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        attendees: {
          where: { id: userId },
        },
      },
    });

    if (!activity) {
      throw new Error("ACTIVITY_NOT_FOUND");
    }

    // Check if user is actually attending
    if (activity.attendees.length === 0) {
      throw new Error("NOT_ATTENDING");
    }

    // Remove user from activity attendees
    return this.prisma.activity.update({
      where: { id },
      data: {
        attendees: {
          disconnect: { id: userId },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        attendees: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getActivityAttendees(
    id: string,
    requesterId: string,
    requesterRole: Role
  ) {
    // Check if activity exists
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!activity) {
      throw new Error("ACTIVITY_NOT_FOUND");
    }

    // Check if user is admin/moderator of the organization
    const userOrganization = await this.prisma.userOrganization.findFirst({
      where: {
        userId: requesterId,
        organizationId: activity.organizationId,
      },
    });

    if (!userOrganization) {
      throw new Error("UNAUTHORIZED");
    }

    if (userOrganization.role !== "ADMIN" && userOrganization.role !== "MODERATOR") {
      throw new Error("UNAUTHORIZED");
    }

    // Get all attendees
    const activityWithAttendees = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        attendees: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return activityWithAttendees?.attendees || [];
  }
}
