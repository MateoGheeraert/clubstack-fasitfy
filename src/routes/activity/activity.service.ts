import { PrismaClient, Role } from "@prisma/client";
import {
  ActivityModel,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilters,
} from "./activity.model";

export class ActivityService {
  private activityModel: ActivityModel;

  constructor(private prisma: PrismaClient) {
    this.activityModel = new ActivityModel(prisma);
  }

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

    return this.activityModel.create(data);
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

    const [activities, total] = await this.activityModel.findMany(filters);

    return {
      activities,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
    };
  }

  async getActivityById(id: string, requesterId: string, requesterRole: Role) {
    const activity = await this.activityModel.findById(id);
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

    return this.activityModel.update(id, data);
  }

  async deleteActivity(id: string, requesterId: string, requesterRole: Role) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can delete activities
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    await this.activityModel.delete(id);
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

    const [activities, total] = await this.activityModel.findByOrganizationId(
      organizationId,
      filters
    );

    return {
      activities,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
    };
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

    // Get activities from the first organization (or could be expanded to all organizations)
    const organizationId = userOrganizations[0].organizationId;
    return this.getActivities({ ...filters, organizationId }, userId, "USER");
  }

  async getUpcomingActivities(
    requesterId: string,
    requesterRole: Role,
    limit: number = 5
  ) {
    if (requesterRole === "ADMIN") {
      return this.activityModel.findUpcoming(undefined, limit);
    }

    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { userId: requesterId },
      select: { organizationId: true },
    });

    if (userOrganizations.length === 0) {
      return [];
    }

    // Get upcoming activities from the first organization
    const organizationId = userOrganizations[0].organizationId;
    return this.activityModel.findUpcoming(organizationId, limit);
  }

  async addAttendee(
    id: string,
    attendee: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can add attendees
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    return this.activityModel.addAttendee(id, attendee);
  }

  async removeAttendee(
    id: string,
    attendee: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const activity = await this.getActivityById(id, requesterId, requesterRole);

    // Only admins can remove attendees
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    return this.activityModel.removeAttendee(id, attendee);
  }
}
