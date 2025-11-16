import { FastifyInstance } from "fastify";
import { UserService } from "./service";
import {
  userResponseSchema,
  userProfileResponseSchema,
  userStatsResponseSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

  // GET /user/me - Get basic user profile
  fastify.get(
    "/user/me",
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

  // GET /user/profile - Get detailed user profile
  fastify.get(
    "/user/profile",
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

  // GET /user/stats - Get user statistics
  fastify.get(
    "/user/stats",
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

  // GET /user/all - List all users (admin endpoint)
  fastify.get(
    "/user/all",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary: "List all users (requires admin privileges)",
      },
    },
    async () => {
      return userService.listAllUsers();
    }
  );
}
