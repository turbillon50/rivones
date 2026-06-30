import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/emergencia-publica(.*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
