import { Activity, Organization } from "@prisma/client";

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
