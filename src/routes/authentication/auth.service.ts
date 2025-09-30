import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string) {
    const passwordHash = await hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash },
      });
      return { id: user.id, email: user.email, role: user.role };
    } catch (e: any) {
      if (e.code === "P2002") {
        throw new Error("EMAIL_EXISTS");
      }
      throw e;
    }
  }

  async login(email: string, password: string, sign: (payload: any) => string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const ok = await compare(password, user.passwordHash);
    if (!ok) throw new Error("INVALID_CREDENTIALS");

    const token = sign({ id: user.id, role: user.role });
    return { token };
  }
}
