import { UserModel } from "./user.model";
export class UserService {
    constructor(prisma) {
        this.userModel = new UserModel(prisma);
    }
    async getProfile(userId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new Error("User not found");
        return { id: user.id, email: user.email, role: user.role };
    }
}
