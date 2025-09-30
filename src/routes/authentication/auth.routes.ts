import { FastifyPluginAsync } from "fastify";
import { AuthService } from "./auth.service";
import {
  authBodySchema,
  authRegisterResponse,
  authLoginResponse,
} from "./auth.schema";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["auth"],
        summary: "Create a user",
        body: authBodySchema,
        response: authRegisterResponse,
      },
    },
    async (req, reply) => {
      const { email, password } = req.body as any;
      try {
        const user = await authService.register(email, password);
        reply.code(201).send(user);
      } catch (e: any) {
        if (e.message === "EMAIL_EXISTS") {
          return reply.code(409).send({ message: "Email already exists" });
        }
        throw e;
      }
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Login and get a JWT",
        body: authBodySchema,
        response: authLoginResponse,
      },
    },
    async (req, reply) => {
      const { email, password } = req.body as any;
      try {
        const result = await authService.login(
          email,
          password,
          fastify.jwt.sign
        );
        return result;
      } catch (e: any) {
        if (e.message === "INVALID_CREDENTIALS") {
          return reply.code(401).send({ message: "Invalid credentials" });
        }
        throw e;
      }
    }
  );
};

export default authRoutes;
