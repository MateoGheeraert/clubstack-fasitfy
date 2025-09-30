import fp from "fastify-plugin";
import { Role } from "@prisma/client";

export default fp(async (fastify) => {
  fastify.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.decorate("authorize", (roles: Role[]) => {
    return async (request: any, reply: any) => {
      const user = request.user as { id: string; role: Role } | undefined;
      if (!user || !roles.includes(user.role)) {
        return reply.forbidden("Insufficient role");
      }
    };
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    authorize: (roles: Role[]) => (request: any, reply: any) => Promise<void>;
  }
}
