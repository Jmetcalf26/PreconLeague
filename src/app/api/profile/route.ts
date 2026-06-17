import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid hex color")
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export const PATCH = handle(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.avatarColor !== undefined) data.avatarColor = body.avatarColor;

  if (body.newPassword) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
    if (
      !body.currentPassword ||
      !(await verifyPassword(body.currentPassword, user.passwordHash))
    ) {
      return json({ error: "Your current password is incorrect." }, 400);
    }
    data.passwordHash = await hashPassword(body.newPassword);
  }

  await prisma.user.update({ where: { id: me.id }, data });
  return json({ ok: true });
});
