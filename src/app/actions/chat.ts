"use server";

import { revalidatePath } from "next/cache";

// Dummy implementations to allow Vercel deployment without a database

export async function createChat(title: string) {
  return { id: Date.now().toString(), title, createdAt: new Date(), updatedAt: new Date(), userId: "user-1" };
}

export async function getRecentChats() {
  return []; // Return empty list since we don't have a database on Vercel
}

export async function saveMessage(chatId: string, role: string, content: string) {
  // Do nothing
}

export async function deleteChat(chatId: string) {
  revalidatePath("/");
}

export async function clearAllChats() {
  revalidatePath("/");
}
