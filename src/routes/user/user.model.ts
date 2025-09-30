import { PrismaClient } from "@prisma/client";

export class UserModel {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
