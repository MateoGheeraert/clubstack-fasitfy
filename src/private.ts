import { FastifyInstance } from "fastify";

// Account routes
import getAccountRoutes from "./routes/account/get";
import postAccountRoute from "./routes/account/post";
import getAccountByIdRoute from "./routes/account/[id]/get";
import patchAccountRoute from "./routes/account/[id]/patch";
import deleteAccountRoute from "./routes/account/[id]/delete";
import getAccountByOrganizationRoute from "./routes/account/organization/[organizationId]/get";
import getMyAccountsRoute from "./routes/account/my/get";

// Activity routes
import getActivityRoutes from "./routes/activity/get";
import postActivityRoute from "./routes/activity/post";
import getActivityByIdRoute from "./routes/activity/[id]/get";
import patchActivityRoute from "./routes/activity/[id]/patch";
import deleteActivityRoute from "./routes/activity/[id]/delete";
import postActivityAttendeesRoute from "./routes/activity/[id]/attendees/post";
import deleteActivityAttendeeRoute from "./routes/activity/[id]/attendees/[attendee]/delete";
import getActivityByOrganizationRoute from "./routes/activity/organization/[organizationId]/get";
import getMyActivitiesRoute from "./routes/activity/my/get";
import getUpcomingActivitiesRoute from "./routes/activity/upcoming/get";

// Task routes
import getTaskRoutes from "./routes/task/get";
import postTaskRoute from "./routes/task/post";
import getTaskByIdRoute from "./routes/task/[id]/get";
import patchTaskRoute from "./routes/task/[id]/patch";
import deleteTaskRoute from "./routes/task/[id]/delete";
import getTaskByOrganizationRoute from "./routes/task/organization/[organizationId]/get";
import getMyTasksRoute from "./routes/task/my/get";
import getTaskStatisticsRoute from "./routes/task/statistics/get";

// Transaction routes
import getTransactionRoutes from "./routes/transaction/get";
import postTransactionRoute from "./routes/transaction/post";
import getTransactionByIdRoute from "./routes/transaction/[id]/get";
import patchTransactionRoute from "./routes/transaction/[id]/patch";
import deleteTransactionRoute from "./routes/transaction/[id]/delete";
import getTransactionByAccountRoute from "./routes/transaction/account/[accountId]/get";
import getMyTransactionsRoute from "./routes/transaction/my/get";

// User routes
import getUserMeRoute from "./routes/user/me/get";
import getUserProfileRoute from "./routes/user/profile/get";
import getUserStatsRoute from "./routes/user/stats/get";
import getAllUsersRoute from "./routes/user/all/get";

// Organization routes
import getOrganizationRoutes from "./routes/organization/get";
import postOrganizationRoute from "./routes/organization/post";
import getOrganizationByIdRoute from "./routes/organization/[id]/get";
import patchOrganizationRoute from "./routes/organization/[id]/patch";
import deleteOrganizationRoute from "./routes/organization/[id]/delete";
import getOrganizationUsersRoute from "./routes/organization/[id]/users/get";
import postOrganizationUsersRoute from "./routes/organization/[id]/users/post";
import postOrganizationUserByEmailRoute from "./routes/organization/[id]/users/email/post";
import patchOrganizationUserRoleRoute from "./routes/organization/[id]/users/[userId]/patch";
import deleteOrganizationUserRoute from "./routes/organization/[id]/users/[userId]/delete";
import getMyOrganizationsRoute from "./routes/organization/my/get";
import getUserOrganizationsRoute from "./routes/organization/users/[userId]/get";

// Authentication routes
import postAuthRoutes from "./routes/authentication/post";

export default async function (app: FastifyInstance) {
  // Accounts
  app.register(getAccountRoutes);
  app.register(postAccountRoute);
  app.register(getAccountByIdRoute);
  app.register(patchAccountRoute);
  app.register(deleteAccountRoute);
  app.register(getAccountByOrganizationRoute);
  app.register(getMyAccountsRoute);

  // Activities
  app.register(getActivityRoutes);
  app.register(postActivityRoute);
  app.register(getActivityByIdRoute);
  app.register(patchActivityRoute);
  app.register(deleteActivityRoute);
  app.register(postActivityAttendeesRoute);
  app.register(deleteActivityAttendeeRoute);
  app.register(getActivityByOrganizationRoute);
  app.register(getMyActivitiesRoute);
  app.register(getUpcomingActivitiesRoute);

  // Tasks
  app.register(getTaskRoutes);
  app.register(postTaskRoute);
  app.register(getTaskByIdRoute);
  app.register(patchTaskRoute);
  app.register(deleteTaskRoute);
  app.register(getTaskByOrganizationRoute);
  app.register(getMyTasksRoute);
  app.register(getTaskStatisticsRoute);

  // Transactions
  app.register(getTransactionRoutes);
  app.register(postTransactionRoute);
  app.register(getTransactionByIdRoute);
  app.register(patchTransactionRoute);
  app.register(deleteTransactionRoute);
  app.register(getTransactionByAccountRoute);
  app.register(getMyTransactionsRoute);

  // User
  app.register(getUserMeRoute);
  app.register(getUserProfileRoute);
  app.register(getUserStatsRoute);
  app.register(getAllUsersRoute);

  // Organizations
  app.register(getOrganizationRoutes);
  app.register(postOrganizationRoute);
  app.register(getOrganizationByIdRoute);
  app.register(patchOrganizationRoute);
  app.register(deleteOrganizationRoute);
  app.register(getOrganizationUsersRoute);
  app.register(postOrganizationUsersRoute);
  app.register(postOrganizationUserByEmailRoute);
  app.register(patchOrganizationUserRoleRoute);
  app.register(deleteOrganizationUserRoute);
  app.register(getMyOrganizationsRoute);
  app.register(getUserOrganizationsRoute);

  // Authentication
  app.register(postAuthRoutes);
}
