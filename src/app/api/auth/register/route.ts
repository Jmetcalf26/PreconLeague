import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_.-]+$/,
      "Use only letters, numbers, and . _ -",
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = handle(async (req: Request) => {
  const body = schema.parse(await req.json());

  const existing = await prisma.user.findUnique({
    where: { username: body.username },
  });
  if (existing) {
    return json({ error: "That username is already taken." }, 409);
  }

  const userCount = await prisma.user.count();
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  // First registered user, or the configured admin username, becomes admin.
  const isAdmin = userCount === 0 || body.username === adminUsername;

  const user = await prisma.user.create({
    data: {
      name: body.name,
      username: body.username,
      passwordHash: await hashPassword(body.password),
      isAdmin,
    },
  });

  await createSession(user.id);
  return json({ id: user.id, name: user.name, isAdmin });
});
