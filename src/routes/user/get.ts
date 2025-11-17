import { FastifyInstance } from "fastify";
import { UserService } from "./service";
import {
  userResponseSchema,
  userProfileResponseSchema,
  userStatsResponseSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);
}
