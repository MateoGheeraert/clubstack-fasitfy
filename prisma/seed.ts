import { PrismaClient, Role, TransactionType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // ADMIN USER
  const email1 = "admin@example.com";
  const passwordHash1 = await hash("Admin1234!", 10);

  const admin = await prisma.user.upsert({
    where: { email: email1 },
    update: {},
    create: { email: email1, passwordHash: passwordHash1 },
  });

  // ORGANIZATIONS
  const organizations = [
    {
      id: "org-klj-merkem",
      name: "KLJ Merkem",
    },
    {
      id: "org-merkem-sport",
      name: "Merkem Sport",
    },
  ];

  const createdOrgs = [];
  for (const orgData of organizations) {
    const org = await prisma.organization.upsert({
      where: { id: orgData.id },
      update: { name: orgData.name },
      create: orgData,
    });
    createdOrgs.push(org);
  }

  // MEMBERS
  const email2 = "mateo@gmail.com";
  const passwordHash2 = await hash("Mateo1234!", 10);
  const mateo = await prisma.user.upsert({
    where: { email: email2 },
    update: {},
    create: { email: email2, passwordHash: passwordHash2 },
  });

  const email5 = "simon@gmail.com";
  const passwordHash5 = await hash("Simon1234!", 10);
  const simon = await prisma.user.upsert({
    where: { email: email5 },
    update: {},
    create: { email: email5, passwordHash: passwordHash5 },
  });

  const email6 = "mathias@gmail.com";
  const passwordHash6 = await hash("Mathias1234!", 10);
  const mathias = await prisma.user.upsert({
    where: { email: email6 },
    update: {},
    create: { email: email6, passwordHash: passwordHash6 },
  });

  const email7 = "thomas@gmail.com";
  const passwordHash7 = await hash("Thomas1234!", 10);
  const thomas = await prisma.user.upsert({
    where: { email: email7 },
    update: {},
    create: { email: email7, passwordHash: passwordHash7 },
  });

  const email8 = "lucas@gmail.com";
  const passwordHash8 = await hash("Lucas1234!", 10);
  const lucas = await prisma.user.upsert({
    where: { email: email8 },
    update: {},
    create: { email: email8, passwordHash: passwordHash8 },
  });

  // USER-ORGANIZATION RELATIONSHIPS
  const userOrgRelations = [
    { userId: admin.id, organizationId: createdOrgs[0].id, role: Role.ADMIN }, // admin -> KLJ Merkem
    { userId: admin.id, organizationId: createdOrgs[1].id, role: Role.ADMIN }, // admin -> Merkem Sport
    {
      userId: mateo.id,
      organizationId: createdOrgs[0].id,
      role: Role.MODERATOR,
    }, // mateo -> KLJ Merkem (MODERATOR)
    { userId: simon.id, organizationId: createdOrgs[0].id, role: Role.USER }, // simon -> KLJ Merkem
    { userId: mathias.id, organizationId: createdOrgs[0].id, role: Role.USER }, // mathias -> KLJ Merkem
    { userId: mateo.id, organizationId: createdOrgs[1].id, role: Role.USER }, // mateo -> Merkem Sport (USER in different org)
    {
      userId: thomas.id,
      organizationId: createdOrgs[1].id,
      role: Role.MODERATOR,
    }, // thomas -> Merkem Sport (MODERATOR)
    { userId: lucas.id, organizationId: createdOrgs[1].id, role: Role.USER }, // lucas -> Merkem Sport
  ];

  for (const relation of userOrgRelations) {
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: relation.userId,
          organizationId: relation.organizationId,
        },
      },
      update: { role: relation.role },
      create: {
        id: `user-org-${relation.userId}-${relation.organizationId}`,
        ...relation,
      },
    });
  }

  // ACCOUNTS
  const accounts = [
    {
      id: "acc-klj-cash",
      organizationId: createdOrgs[0].id,
      accountName: "Kassa",
      balance: 500.0,
      type: "Cash",
    },
    {
      id: "acc-klj-current",
      organizationId: createdOrgs[0].id,
      accountName: "Zichtrekening",
      balance: 2500.0,
      type: "Current Account",
    },
    {
      id: "acc-klj-savings",
      organizationId: createdOrgs[0].id,
      accountName: "Spaarrekening",
      balance: 1000.0,
      type: "Savings Account",
    },
    {
      id: "acc-merkem-sport-main",
      organizationId: createdOrgs[1].id,
      accountName: "Hoofdrekening",
      balance: 3000.0,
      type: "Current Account",
    },
  ];

  const createdAccounts = [];
  for (const accountData of accounts) {
    const account = await prisma.account.upsert({
      where: { id: accountData.id },
      update: {
        accountName: accountData.accountName,
        balance: accountData.balance,
        type: accountData.type,
      },
      create: accountData,
    });
    createdAccounts.push(account);
  }

  // ACTIVITIES (in Dutch)
  const activities = [
    {
      id: "act-klj-001",
      organizationId: createdOrgs[0].id,
      title: "Wekelijkse vergadering",
      starts_at: new Date("2025-10-10T19:00:00Z"),
      ends_at: new Date("2025-10-10T21:00:00Z"),
      location: "Gemeentezaal Merkem",
      description: "Bespreking van de activiteiten voor de komende maand.",
      attendees: ["mateo@gmail.com", "simon@gmail.com", "mathias@gmail.com"],
    },
    {
      id: "act-merkem-sport-001",
      organizationId: createdOrgs[1].id,
      title: "Voetbaltraining",
      starts_at: new Date("2025-10-12T18:00:00Z"),
      ends_at: new Date("2025-10-12T20:00:00Z"),
      location: "Sportveld Merkem",
      description: "Wekelijkse training voor het team.",
      attendees: ["mateo@gmail.com", "thomas@gmail.com", "lucas@gmail.com"],
    },
  ];

  for (const activityData of activities) {
    await prisma.activity.upsert({
      where: { id: activityData.id },
      update: {
        title: activityData.title,
        starts_at: activityData.starts_at,
        ends_at: activityData.ends_at,
        location: activityData.location,
        description: activityData.description,
        attendees: activityData.attendees,
      },
      create: activityData,
    });
  }

  // TASKS (in Dutch)
  const tasks = [
    {
      id: "task-klj-mateo-001",
      title: "Voorbereiden van de quiz",
      description: "Maak de vragen en antwoorden voor de jaarlijkse quiz.",
      status: "pending",
      userId: mateo.id,
      organizationId: createdOrgs[0].id,
    },
    {
      id: "task-klj-simon-001",
      title: "Organiseren van de fuif",
      description: "Regel de zaal, muziek en drank voor de fuif.",
      status: "in_progress",
      userId: simon.id,
      organizationId: createdOrgs[0].id,
    },
    {
      id: "task-klj-mathias-001",
      title: "Promotie voor het evenement",
      description: "Maak affiches en verspreid ze in het dorp.",
      status: "pending",
      userId: mathias.id,
      organizationId: createdOrgs[0].id,
    },
    {
      id: "task-merkem-sport-mateo-001",
      title: "Bijwerken van de ledenlijst",
      description: "Controleer en update de gegevens van alle leden.",
      status: "in_progress",
      userId: mateo.id,
      organizationId: createdOrgs[1].id,
    },
    {
      id: "task-merkem-sport-thomas-001",
      title: "Voorbereiden van de wedstrijd",
      description: "Zorg voor de uitrusting en het veld.",
      status: "pending",
      userId: thomas.id,
      organizationId: createdOrgs[1].id,
    },
    {
      id: "task-merkem-sport-lucas-001",
      title: "Beheer van de financiën",
      description: "Controleer de inkomsten en uitgaven van de club.",
      status: "completed",
      userId: lucas.id,
      organizationId: createdOrgs[1].id,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        userId: taskData.userId,
        organizationId: taskData.organizationId,
      },
      create: taskData,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("👥 Users created:");
  console.log(`   Admin: ${admin.email}`);
  console.log(`   User: ${mateo.email}`);
  console.log(`   User: ${simon.email}`);
  console.log(`   User: ${mathias.email}`);
  console.log(`   User: ${thomas.email}`);
  console.log(`   User: ${lucas.email}`);
  console.log("");
  console.log("🏢 Organizations created:");
  createdOrgs.forEach((org) => console.log(`   ${org.name} (${org.id})`));
  console.log("");
  console.log("💳 Accounts created:");
  createdAccounts.forEach((acc) =>
    console.log(`   ${acc.accountName} - Balance: $${acc.balance}`)
  );
  console.log("");
  console.log("💰 Transactions created: 0");
  console.log("📅 Activities created:", activities.length);
  console.log("📋 Tasks created:", tasks.length);
  console.log(
    "🔗 User-Organization relations created:",
    userOrgRelations.length
  );
  console.log("");
  console.log("🎭 User Roles per Organization:");
  console.log(`   ${admin.email}:`);
  console.log(`      - ${createdOrgs[0].name}: ADMIN`);
  console.log(`      - ${createdOrgs[1].name}: ADMIN`);
  console.log(`   ${mateo.email}:`);
  console.log(`      - ${createdOrgs[0].name}: MODERATOR`);
  console.log(`      - ${createdOrgs[1].name}: USER`);
  console.log(`   ${simon.email}: ${createdOrgs[0].name} - USER`);
  console.log(`   ${mathias.email}: ${createdOrgs[0].name} - USER`);
  console.log(`   ${thomas.email}: ${createdOrgs[1].name} - MODERATOR`);
  console.log(`   ${lucas.email}: ${createdOrgs[1].name} - USER`);
}

main().finally(() => prisma.$disconnect());
