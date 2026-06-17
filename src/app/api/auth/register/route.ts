import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = handle(async (req: Request) => {
  const body = schema.parse(await req.json());

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return json({ error: "An account with that email already exists." }, 409);
  }

  const userCount = await prisma.user.count();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  // First registered user, or the configured admin email, becomes admin.
  const isAdmin = userCount === 0 || body.email === adminEmail;

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      isAdmin,
    },
  });

  await createSession(user.id);
  return json({ id: user.id, name: user.name, isAdmin });
});
