import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  WEEK_IN_SECONDS,
  encodeAdminSession,
} from "@/lib/admin-session";

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const identifier = (body?.identifier as string | undefined)?.trim();
  const password = body?.password as string | undefined;

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "请输入账号和密码" },
      { status: 400 }
    );
  }

  const isPhone = PHONE_REGEX.test(identifier);

  const user = await prisma.user.findFirst({
    where: {
      AND: [isPhone ? { phone: identifier } : { nickname: identifier }, { isAdmin: true }],
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const token = encodeAdminSession(user.id);
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      phone: user.phone,
    },
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // secure: process.env.NODE_ENV === "production",
    secure: false,
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  });

  return response;
}
