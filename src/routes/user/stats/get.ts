import { FastifyInstance } from "fastify";
import { UserService } from "../service";
import { userStatsResponseSchema } from "../schema";

export default async function statsRoute(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

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
}
