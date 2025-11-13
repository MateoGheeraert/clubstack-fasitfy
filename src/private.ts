import { FastifyInstance } from "fastify";

// Account routes
import getAccountRoutes from "./routes/account/get";
import postAccountRoute from "./routes/account/post";
import getAccountByIdRoute from "./routes/account/[id]/get";
import patchAccountRoute from "./routes/account/[id]/patch";
import deleteAccountRoute from "./routes/account/[id]/delete";
import getAccountByOrganizationRoute from "./routes/account/organization/[organizationId]/get";

// Activity routes
import getActivityRoutes from "./routes/activity/get";
import postActivityRoute from "./routes/activity/post";
import getActivityByIdRoute from "./routes/activity/[id]/get";
import patchActivityRoute from "./routes/activity/[id]/patch";
import deleteActivityRoute from "./routes/activity/[id]/delete";
import postActivityAttendeesRoute from "./routes/activity/[id]/attendees/post";
import deleteActivityAttendeeRoute from "./routes/activity/[id]/attendees/[attendee]/delete";
import getActivityByOrganizationRoute from "./routes/activity/organization/[organizationId]/get";

// Task routes
import getTaskRoutes from "./routes/task/get";
import postTaskRoute from "./routes/task/post";
import getTaskByIdRoute from "./routes/task/[id]/get";
import patchTaskRoute from "./routes/task/[id]/patch";
import deleteTaskRoute from "./routes/task/[id]/delete";
import getTaskByOrganizationRoute from "./routes/task/organization/[organizationId]/get";

// Transaction routes
import getTransactionRoutes from "./routes/transaction/get";
import postTransactionRoute from "./routes/transaction/post";
import getTransactionByIdRoute from "./routes/transaction/[id]/get";
import patchTransactionRoute from "./routes/transaction/[id]/patch";
import deleteTransactionRoute from "./routes/transaction/[id]/delete";
import getTransactionByAccountRoute from "./routes/transaction/account/[accountId]/get";

// User routes
import getUserRoutes from "./routes/user/get";

// Organization routes
import getOrganizationRoutes from "./routes/organization/get";
import postOrganizationRoute from "./routes/organization/post";
import getOrganizationByIdRoute from "./routes/organization/[id]/get";
import patchOrganizationRoute from "./routes/organization/[id]/patch";
import deleteOrganizationRoute from "./routes/organization/[id]/delete";
import postOrganizationUsersRoute from "./routes/organization/[id]/users/post";
import deleteOrganizationUserRoute from "./routes/organization/[id]/users/[userId]/delete";

// Authentication routes
import postAuthRoutes from "./routes/authentication/post";

// Admin routes
import getAdminRoutes from "./routes/admin/get";

export default async function (app: FastifyInstance) {
  // Accounts
  app.register(getAccountRoutes);
  app.register(postAccountRoute);
  app.register(getAccountByIdRoute);
  app.register(patchAccountRoute);
  app.register(deleteAccountRoute);
  app.register(getAccountByOrganizationRoute);

  // Activities
  app.register(getActivityRoutes);
  app.register(postActivityRoute);
  app.register(getActivityByIdRoute);
  app.register(patchActivityRoute);
  app.register(deleteActivityRoute);
  app.register(postActivityAttendeesRoute);
  app.register(deleteActivityAttendeeRoute);
  app.register(getActivityByOrganizationRoute);

  // Tasks
  app.register(getTaskRoutes);
  app.register(postTaskRoute);
  app.register(getTaskByIdRoute);
  app.register(patchTaskRoute);
  app.register(deleteTaskRoute);
  app.register(getTaskByOrganizationRoute);

  // Transactions
  app.register(getTransactionRoutes);
  app.register(postTransactionRoute);
  app.register(getTransactionByIdRoute);
  app.register(patchTransactionRoute);
  app.register(deleteTransactionRoute);
  app.register(getTransactionByAccountRoute);

  // User
  app.register(getUserRoutes);

  // Organizations
  app.register(getOrganizationRoutes);
  app.register(postOrganizationRoute);
  app.register(getOrganizationByIdRoute);
  app.register(patchOrganizationRoute);
  app.register(deleteOrganizationRoute);
  app.register(postOrganizationUsersRoute);
  app.register(deleteOrganizationUserRoute);

  // Authentication
  app.register(postAuthRoutes);

  // Admin
  app.register(getAdminRoutes);
}
