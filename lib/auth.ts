import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { config } from 'dotenv';
import { serverEnv } from "@/env/server";

config({
    path: '.env.local',
});

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "pg",
    }),
    socialProviders: {
        github: {
            clientId: serverEnv.GITHUB_CLIENT_ID,
            clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
        },
        google: { 
            clientId: serverEnv.GOOGLE_CLIENT_ID, 
            clientSecret: serverEnv.GOOGLE_CLIENT_SECRET, 
        },
        twitter: { 
            clientId: serverEnv.TWITTER_CLIENT_ID, 
            clientSecret: serverEnv.TWITTER_CLIENT_SECRET, 
        },
    },
    plugins: [nextCookies()],
    trustedOrigins: ["http://localhost:3000", "https://scira.ai", "https://www.scira.ai"],
});