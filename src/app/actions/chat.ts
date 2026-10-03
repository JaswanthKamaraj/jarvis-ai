"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// For demonstration without full auth, we will use a dummy user ID
// In production, you would use auth() from NextAuth here.
const DUMMY_USER_ID = "user-1";

// Ensure dummy user exists
async function getOrCreateUser() {
  let user = await prisma.user.findUnique({ where: { id: DUMMY_USER_ID } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: DUMMY_USER_ID,
        email: "demo@jarvis.ai",
        name: "Demo User",
      },
    });
  }
  return user.id;
}

export async function createChat(title: string) {
  const userId = await getOrCreateUser();
  const chat = await prisma.chat.create({
    data: {
      title,
      userId,
    },
  });
  revalidatePath("/");
  return chat;
}

export async function getRecentChats() {
  const userId = await getOrCreateUser();
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });
  return chats;
}

export async function saveMessage(chatId: string, role: string, content: string) {
  await prisma.message.create({
    data: {
      chatId,
      role,
      content,
    },
  });
}

export async function deleteChat(chatId: string) {
  const userId = await getOrCreateUser();
  await prisma.chat.deleteMany({
    where: { id: chatId, userId },
  });
  revalidatePath("/");
}

export async function clearAllChats() {
  const userId = await getOrCreateUser();
  await prisma.chat.deleteMany({
    where: { userId },
  });
  revalidatePath("/");
}
