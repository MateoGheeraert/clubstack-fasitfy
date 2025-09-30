export class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUsers() {
        return this.prisma.user.findMany({
            select: { id: true, email: true, role: true },
        });
    }
}
