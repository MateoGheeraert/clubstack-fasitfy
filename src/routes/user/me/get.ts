import { FastifyInstance } from "fastify";
import { UserService } from "../service";
import { userResponseSchema } from "../schema";

export default async function meRoute(fastify: FastifyInstance) {
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
}
