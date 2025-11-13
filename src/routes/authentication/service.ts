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
      return { id: user.id, email: user.email };
    } catch (e: any) {
      if (e.code === "P2002") {
        throw new Error("EMAIL_EXISTS");
      }
      throw e;
    }
  }

  async login(
    email: string,
    password: string,
    sign: (payload: any) => string,
    generateRefreshToken: (payload: any) => string
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const ok = await compare(password, user.passwordHash);
    if (!ok) throw new Error("INVALID_CREDENTIALS");

    // No longer include role in JWT since it's per-organization
    const payload = { id: user.id };
    const token = sign(payload);
    const refreshToken = await this.createRefreshToken(
      user.id,
      generateRefreshToken(payload)
    );

    return { token, refreshToken };
  }

  async createRefreshToken(userId: string, token: string) {
    // Create refresh token that expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Clean up old expired tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    // Store the refresh token
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(
    refreshToken: string,
    verify: (token: string) => any,
    sign: (payload: any) => string
  ) {
    // Verify the refresh token JWT signature
    let decoded;
    try {
      decoded = verify(refreshToken);
    } catch (e) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    // Generate new access token (no role since it's per-organization)
    const payload = { id: storedToken.user.id };
    const newAccessToken = sign(payload);

    return { token: newAccessToken };
  }

  async logout(refreshToken: string) {
    // Delete the refresh token from database
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}
