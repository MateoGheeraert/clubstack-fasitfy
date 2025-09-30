import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    const email = "admin@example.com";
    const passwordHash = await hash("Admin1234!", 10);
    await prisma.user.upsert({
        where: { email },
        update: { role: Role.ADMIN },
        create: { email, passwordHash, role: Role.ADMIN },
    });
    console.log("Seeded admin:", email, "password: Admin1234!");
}
main().finally(() => prisma.$disconnect());
