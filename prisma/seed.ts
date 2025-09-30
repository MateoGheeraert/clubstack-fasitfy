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
    update: { role: Role.ADMIN },
    create: { email: email1, passwordHash: passwordHash1, role: Role.ADMIN },
  });

  // REGULAR USERS
  const email2 = "mateo@gmail.com";
  const passwordHash2 = await hash("Mateo1234!", 10);

  const user = await prisma.user.upsert({
    where: { email: email2 },
    update: { role: Role.USER },
    create: { email: email2, passwordHash: passwordHash2, role: Role.USER },
  });

  const email3 = "sarah@gmail.com";
  const passwordHash3 = await hash("Sarah1234!", 10);

  const user2 = await prisma.user.upsert({
    where: { email: email3 },
    update: { role: Role.USER },
    create: { email: email3, passwordHash: passwordHash3, role: Role.USER },
  });

  const email4 = "john@gmail.com";
  const passwordHash4 = await hash("John1234!", 10);

  const user3 = await prisma.user.upsert({
    where: { email: email4 },
    update: { role: Role.USER },
    create: { email: email4, passwordHash: passwordHash4, role: Role.USER },
  });

  // SAMPLE ORGANIZATIONS
  const organizations = [
    {
      id: "org-tech-innovators",
      name: "Tech Innovators Inc",
    },
    {
      id: "org-creative-studio",
      name: "Creative Studio LLC",
    },
    {
      id: "org-green-energy",
      name: "Green Energy Solutions",
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

  // USER-ORGANIZATION RELATIONSHIPS
  const userOrgRelations = [
    { userId: user.id, organizationId: createdOrgs[0].id }, // mateo -> Tech Innovators
    { userId: user.id, organizationId: createdOrgs[1].id }, // mateo -> Creative Studio
    { userId: user2.id, organizationId: createdOrgs[0].id }, // sarah -> Tech Innovators
    { userId: user2.id, organizationId: createdOrgs[2].id }, // sarah -> Green Energy
    { userId: user3.id, organizationId: createdOrgs[1].id }, // john -> Creative Studio
    { userId: user3.id, organizationId: createdOrgs[2].id }, // john -> Green Energy
  ];

  for (const relation of userOrgRelations) {
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: relation.userId,
          organizationId: relation.organizationId,
        },
      },
      update: {},
      create: {
        id: `user-org-${relation.userId}-${relation.organizationId}`,
        ...relation,
      },
    });
  }

  // SAMPLE ACCOUNTS (one per organization)
  const accounts = [
    {
      id: "acc-tech-main",
      organizationId: createdOrgs[0].id,
      accountName: "Tech Innovators Main Account",
      balance: 25000.5,
      type: "Business Checking",
    },
    {
      id: "acc-creative-main",
      organizationId: createdOrgs[1].id,
      accountName: "Creative Studio Operating Account",
      balance: 18750.25,
      type: "Business Savings",
    },
    {
      id: "acc-green-main",
      organizationId: createdOrgs[2].id,
      accountName: "Green Energy Project Fund",
      balance: 42300.75,
      type: "Investment Account",
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

  // SAMPLE TRANSACTIONS
  const transactions = [
    // Tech Innovators transactions
    {
      id: "txn-tech-001",
      accountId: createdAccounts[0].id,
      amount: 15000.0,
      transactionType: TransactionType.DEPOSIT,
      description: "Initial funding from investors",
      transactionDate: new Date("2024-01-15"),
      transactionCode: "INV-2024-001",
    },
    {
      id: "txn-tech-002",
      accountId: createdAccounts[0].id,
      amount: 5500.0,
      transactionType: TransactionType.INCOME,
      description: "Software licensing revenue",
      transactionDate: new Date("2024-02-01"),
      transactionCode: "REV-2024-001",
    },
    {
      id: "txn-tech-003",
      accountId: createdAccounts[0].id,
      amount: 2200.0,
      transactionType: TransactionType.PAYMENT,
      description: "Office rent payment",
      transactionDate: new Date("2024-02-05"),
      transactionCode: "RENT-2024-02",
    },
    {
      id: "txn-tech-004",
      accountId: createdAccounts[0].id,
      amount: 800.0,
      transactionType: TransactionType.WITHDRAWAL,
      description: "Equipment purchase",
      transactionDate: new Date("2024-02-10"),
      transactionCode: "EQP-2024-001",
    },

    // Creative Studio transactions
    {
      id: "txn-creative-001",
      accountId: createdAccounts[1].id,
      amount: 12000.0,
      transactionType: TransactionType.DEPOSIT,
      description: "Client project advance payment",
      transactionDate: new Date("2024-01-20"),
      transactionCode: "CLI-2024-001",
    },
    {
      id: "txn-creative-002",
      accountId: createdAccounts[1].id,
      amount: 3500.0,
      transactionType: TransactionType.INCOME,
      description: "Design consultation fees",
      transactionDate: new Date("2024-02-15"),
      transactionCode: "CONS-2024-001",
    },
    {
      id: "txn-creative-003",
      accountId: createdAccounts[1].id,
      amount: 1200.0,
      transactionType: TransactionType.PAYMENT,
      description: "Software subscriptions",
      transactionDate: new Date("2024-02-20"),
      transactionCode: "SUB-2024-001",
    },

    // Green Energy transactions
    {
      id: "txn-green-001",
      accountId: createdAccounts[2].id,
      amount: 35000.0,
      transactionType: TransactionType.DEPOSIT,
      description: "Government grant funding",
      transactionDate: new Date("2024-01-10"),
      transactionCode: "GRANT-2024-001",
    },
    {
      id: "txn-green-002",
      accountId: createdAccounts[2].id,
      amount: 8500.0,
      transactionType: TransactionType.INCOME,
      description: "Solar panel installation revenue",
      transactionDate: new Date("2024-02-25"),
      transactionCode: "SOLAR-2024-001",
    },
    {
      id: "txn-green-003",
      accountId: createdAccounts[2].id,
      amount: 1200.0,
      transactionType: TransactionType.WITHDRAWAL,
      description: "Research materials",
      transactionDate: new Date("2024-03-01"),
      transactionCode: "RES-2024-001",
    },
  ];

  for (const txnData of transactions) {
    await prisma.transaction.upsert({
      where: { id: txnData.id },
      update: {
        amount: txnData.amount,
        transactionType: txnData.transactionType,
        description: txnData.description,
        transactionDate: txnData.transactionDate,
        transactionCode: txnData.transactionCode,
      },
      create: txnData,
    });
  }

  // SAMPLE ACTIVITIES
  const activities = [
    // Tech Innovators activities
    {
      id: "act-tech-001",
      organizationId: createdOrgs[0].id,
      title: "Weekly Team Standup",
      starts_at: new Date("2024-04-01T09:00:00Z"),
      ends_at: new Date("2024-04-01T10:00:00Z"),
      location: "Conference Room A",
      description: "Weekly team synchronization and planning meeting",
      attendees: [
        "mateo@gmail.com",
        "sarah@gmail.com",
        "team-lead@techinnovators.com",
      ],
    },
    {
      id: "act-tech-002",
      organizationId: createdOrgs[0].id,
      title: "Product Launch Event",
      starts_at: new Date("2024-04-15T18:00:00Z"),
      ends_at: new Date("2024-04-15T21:00:00Z"),
      location: "Downtown Convention Center",
      description: "Official launch event for our new software platform",
      attendees: [
        "mateo@gmail.com",
        "sarah@gmail.com",
        "investors@example.com",
      ],
    },

    // Creative Studio activities
    {
      id: "act-creative-001",
      organizationId: createdOrgs[1].id,
      title: "Client Design Review",
      starts_at: new Date("2024-04-03T14:00:00Z"),
      ends_at: new Date("2024-04-03T16:00:00Z"),
      location: "Studio Meeting Room",
      description:
        "Review and feedback session for the new brand identity project",
      attendees: ["mateo@gmail.com", "john@gmail.com", "client@company.com"],
    },
    {
      id: "act-creative-002",
      organizationId: createdOrgs[1].id,
      title: "Creative Workshop",
      starts_at: new Date("2024-04-10T10:00:00Z"),
      ends_at: new Date("2024-04-10T17:00:00Z"),
      location: "Main Studio",
      description: "Team creative workshop for generating new project ideas",
      attendees: ["mateo@gmail.com", "john@gmail.com", "freelancer@design.com"],
    },

    // Green Energy activities
    {
      id: "act-green-001",
      organizationId: createdOrgs[2].id,
      title: "Solar Panel Installation Training",
      starts_at: new Date("2024-04-05T08:00:00Z"),
      ends_at: new Date("2024-04-05T17:00:00Z"),
      location: "Training Facility",
      description:
        "Comprehensive training session for new installation techniques",
      attendees: ["sarah@gmail.com", "john@gmail.com", "trainer@solar.com"],
    },
    {
      id: "act-green-003",
      organizationId: createdOrgs[2].id,
      title: "Sustainability Conference",
      starts_at: new Date("2024-04-20T09:00:00Z"),
      ends_at: new Date("2024-04-21T18:00:00Z"),
      location: "Green Energy Expo Center",
      description:
        "Annual conference on renewable energy and sustainability practices",
      attendees: [
        "sarah@gmail.com",
        "john@gmail.com",
        "speakers@conference.org",
      ],
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

  // SAMPLE TASKS FOR USERS
  const tasks = [
    // Mateo's tasks
    {
      id: "task-mateo-001",
      title: "Complete project documentation",
      description:
        "Write comprehensive documentation for the current project including API endpoints and usage examples",
      status: "pending",
      userId: user.id,
    },
    {
      id: "task-mateo-002",
      title: "Review code changes",
      description: "Review and provide feedback on the latest pull requests",
      status: "in_progress",
      userId: user.id,
    },
    {
      id: "task-mateo-003",
      title: "Update user interface",
      description: "Implement the new design changes for the dashboard",
      status: "pending",
      userId: user.id,
    },
    {
      id: "task-mateo-004",
      title: "Fix authentication bug",
      description: "Resolve the issue with JWT token expiration handling",
      status: "completed",
      userId: user.id,
    },
    {
      id: "task-mateo-005",
      title: "Prepare presentation",
      description: "Create slides for the upcoming team meeting",
      status: "pending",
      userId: user.id,
    },

    // Sarah's tasks
    {
      id: "task-sarah-001",
      title: "Solar panel efficiency analysis",
      description: "Analyze the performance data from recent installations",
      status: "in_progress",
      userId: user2.id,
    },
    {
      id: "task-sarah-002",
      title: "Update installation procedures",
      description:
        "Revise the standard operating procedures for panel installation",
      status: "pending",
      userId: user2.id,
    },
    {
      id: "task-sarah-003",
      title: "Client meeting preparation",
      description: "Prepare materials for the upcoming client presentation",
      status: "completed",
      userId: user2.id,
    },

    // John's tasks
    {
      id: "task-john-001",
      title: "Design brand identity mockups",
      description: "Create initial design concepts for the new client's brand",
      status: "in_progress",
      userId: user3.id,
    },
    {
      id: "task-john-002",
      title: "Research sustainable materials",
      description: "Investigate eco-friendly materials for upcoming projects",
      status: "pending",
      userId: user3.id,
    },
    {
      id: "task-john-003",
      title: "Workshop facilitation",
      description: "Prepare and lead the creative workshop session",
      status: "completed",
      userId: user3.id,
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
      },
      create: taskData,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("👥 Users created:");
  console.log(`   Admin: ${admin.email} (Role: ${admin.role})`);
  console.log(`   User: ${user.email} (Role: ${user.role})`);
  console.log(`   User: ${user2.email} (Role: ${user2.role})`);
  console.log(`   User: ${user3.email} (Role: ${user3.role})`);
  console.log("");
  console.log("🏢 Organizations created:");
  createdOrgs.forEach((org) => console.log(`   ${org.name} (${org.id})`));
  console.log("");
  console.log("💳 Accounts created:");
  createdAccounts.forEach((acc) =>
    console.log(`   ${acc.accountName} - Balance: $${acc.balance}`)
  );
  console.log("");
  console.log("💰 Transactions created:", transactions.length);
  console.log("📅 Activities created:", activities.length);
  console.log("📋 Tasks created:", tasks.length);
  console.log(
    "🔗 User-Organization relations created:",
    userOrgRelations.length
  );
}

main().finally(() => prisma.$disconnect());
