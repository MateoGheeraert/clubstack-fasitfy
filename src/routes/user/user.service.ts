import { UserModel } from "./user.model";
import { PrismaClient } from "@prisma/client";

export class UserService {
  private userModel: UserModel;

  constructor(prisma: PrismaClient) {
    this.userModel = new UserModel(prisma);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error("User not found");
    return { id: user.id, email: user.email, role: user.role };
  }
}
