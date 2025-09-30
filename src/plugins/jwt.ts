import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { Role } from "@prisma/client";

export default fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: "15m" },
  });
});

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; role: Role }; // for signing
    user: { id: string; role: Role }; // after verify
  }
}
