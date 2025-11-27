import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifySmsCode, isSmsVerificationEnabled } from "@/lib/sms";
import bcrypt from "bcryptjs";

console.log("[auth config] loaded from apps/web/lib/auth.ts");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // 通用账号/手机号 + 密码登录（前台使用）
    Credentials({
      id: "credentials",
      name: "账号登录",
      credentials: {
        identifier: { label: "账号或手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.identifier as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) {
          throw new Error("请输入账号和密码");
        }

        // 判断是手机号还是昵称（或将来单独 username）
        const isPhone = /^1[3-9]\d{9}$/.test(identifier);

        const user = await prisma.user.findFirst({
          where: isPhone
            ? { phone: identifier }
            : { nickname: identifier },
        });

        if (!user || !user.passwordHash) {
          throw new Error("账号或密码错误");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("账号或密码错误");
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.nickname,
          image: user.avatarUrl,
          isAdmin: user.isAdmin,
        };
      },
    }),

    // 后台管理员登录，仅允许 isAdmin = true
    Credentials({
      id: "admin",
      name: "管理员登录",
      credentials: {
        identifier: { label: "账号或手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.identifier as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        console.log("[admin login] raw credentials", credentials);

        if (!identifier || !password) {
          throw new Error("请输入账号和密码");
        }

        const isPhone = /^1[3-9]\d{9}$/.test(identifier);

        const user = await prisma.user.findFirst({
          where: {
            AND: [
              isPhone ? { phone: identifier } : { nickname: identifier },
              { isAdmin: true },
            ],
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("账号或密码错误");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("账号或密码错误");
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.nickname,
          image: user.avatarUrl,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone?: string }).phone;
        (token as { isAdmin?: boolean }).isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { phone?: string }).phone = token.phone as string;
        (session.user as { isAdmin?: boolean }).isAdmin = (token as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
