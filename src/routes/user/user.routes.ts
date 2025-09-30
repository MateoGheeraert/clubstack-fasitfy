import { FastifyPluginAsync } from "fastify";
import { UserService } from "./user.service";
import {
  userResponseSchema,
  userProfileResponseSchema,
  userStatsResponseSchema,
} from "./user.schema";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify.prisma);

  // Get basic user profile
  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user basic profile",
        response: { 200: userResponseSchema },
      },
    },
    async (req: any) => {
      return await userService.getProfile(req.user.id);
    }
  );

  // Get detailed user profile with organizations and recent tasks
  fastify.get(
    "/profile",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary:
          "Get current user detailed profile with organizations and tasks",
        response: { 200: userProfileResponseSchema },
      },
    },
    async (req: any) => {
      return await userService.getProfileWithOrganizations(req.user.id);
    }
  );

  // Get user statistics
  fastify.get(
    "/stats",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user statistics",
        response: { 200: userStatsResponseSchema },
      },
    },
    async (req: any) => {
      return await userService.getUserStats(req.user.id);
    }
  );
};

export default userRoutes;
