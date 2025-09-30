import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    //ADMIN USER
    const email1 = "admin@example.com";
    const passwordHash1 = await hash("Admin1234!", 10);
    const admin = await prisma.user.upsert({
        where: { email: email1 },
        update: { role: Role.ADMIN },
        create: { email: email1, passwordHash: passwordHash1, role: Role.ADMIN },
    });
    // REGULAR USER
    const email2 = "mateo@gmail.com";
    const passwordHash2 = await hash("Mateo1234!", 10);
    const user = await prisma.user.upsert({
        where: { email: email2 },
        update: { role: Role.USER },
        create: { email: email2, passwordHash: passwordHash2, role: Role.USER },
    });
    // SAMPLE TASKS FOR THE REGULAR USER
    const tasks = [
        {
            title: "Complete project documentation",
            description: "Write comprehensive documentation for the current project including API endpoints and usage examples",
            status: "pending",
            userId: user.id,
        },
        {
            title: "Review code changes",
            description: "Review and provide feedback on the latest pull requests",
            status: "in_progress",
            userId: user.id,
        },
        {
            title: "Update user interface",
            description: "Implement the new design changes for the dashboard",
            status: "pending",
            userId: user.id,
        },
        {
            title: "Fix authentication bug",
            description: "Resolve the issue with JWT token expiration handling",
            status: "completed",
            userId: user.id,
        },
        {
            title: "Prepare presentation",
            description: "Create slides for the upcoming team meeting",
            status: "pending",
            userId: user.id,
        },
    ];
    for (const taskData of tasks) {
        await prisma.task.upsert({
            where: {
                // Using a composite approach since we don't have a unique constraint on title+userId
                id: `seed-task-${taskData.title.toLowerCase().replace(/\s+/g, "-")}-${user.id}`,
            },
            update: taskData,
            create: {
                ...taskData,
                id: `seed-task-${taskData.title.toLowerCase().replace(/\s+/g, "-")}-${user.id}`,
            },
        });
    }
    console.log("Database seeded successfully!");
    console.log(`Admin user: ${admin.email} (Role: ${admin.role})`);
    console.log(`Regular user: ${user.email} (Role: ${user.role})`);
    console.log(`Created ${tasks.length} sample tasks for ${user.email}`);
}
main().finally(() => prisma.$disconnect());
