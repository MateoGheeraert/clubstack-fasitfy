import { FastifyInstance } from "fastify";
import { OrganizationService } from "./service";
import {
  createOrganizationSchema,
  organizationResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function postRoutes(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // POST /organizations - Create a new organization (Admin only)
  fastify.post(
    "/organizations",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new organization (Admin only)",
        body: createOrganizationSchema,
        response: {
          201: organizationResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          name: string;
        };

        const organization = await organizationService.createOrganization(body);
        reply.code(201).send(organization);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_ALREADY_EXISTS") {
          return reply
            .code(409)
            .send({ error: "Organization with this name already exists" });
        }
        throw error;
      }
    }
  );
}
