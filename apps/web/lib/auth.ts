import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifySmsCode, isSmsVerificationEnabled } from "@/lib/sms";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: "phone",
      name: "手机号登录",
      credentials: {
        phone: { label: "手机号", type: "tel" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string;
        const code = credentials?.code as string;

        if (!phone) {
          throw new Error("请输入手机号");
        }

        // 检查是否需要短信验证
        if (isSmsVerificationEnabled()) {
          if (!code) {
            throw new Error("请输入验证码");
          }
          
          // 验证短信验证码
          const verifyResult = await verifySmsCode(phone, code);
          if (!verifyResult.success) {
            throw new Error(verifyResult.message);
          }
        }

        // 查找或创建用户
        let user = await prisma.user.findFirst({
          where: { phone },
        });

        if (!user) {
          // 新用户，自动注册
          user = await prisma.user.create({
            data: {
              phone,
              nickname: `用户${phone.slice(-4)}`,
            },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.nickname,
          image: user.avatarUrl,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { phone?: string }).phone = token.phone as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
