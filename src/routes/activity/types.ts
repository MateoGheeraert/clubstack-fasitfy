import { Activity, Organization, User } from "@prisma/client";

export type ActivityWithOrganization = Activity & {
  organization: Pick<Organization, "id" | "name">;
};

export type ActivityWithOrganizationAndAttendees = Activity & {
  organization: Pick<Organization, "id" | "name">;
  attendees: Pick<User, "id" | "email">[];
};

export type CreateActivityInput = {
  organizationId: string;
  title: string;
  starts_at: Date;
  ends_at: Date;
  location?: string;
  description?: string;
  nonUserAttendees?: string[];
};

export type UpdateActivityInput = {
  title?: string;
  starts_at?: Date;
  ends_at?: Date;
  location?: string;
  description?: string;
  nonUserAttendees?: string[];
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

export type AttendeeResponse = Pick<User, "id" | "email" | "createdAt">;
