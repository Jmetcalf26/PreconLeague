import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export const POST = handle(async (req: Request) => {
  const body = schema.parse(await req.json());

  const user = await prisma.user.findUnique({
    where: { username: body.username },
  });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return json({ error: "Incorrect username or password." }, 401);
  }

  await createSession(user.id);
  return json({ id: user.id, name: user.name, isAdmin: user.isAdmin });
});
