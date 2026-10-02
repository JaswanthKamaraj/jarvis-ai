# 🎯 ROG AI - Ultimate Study Assistant

![ROG AI Banner](https://via.placeholder.com/1200x400/130000/980000?text=ROG+AI+-+Study+Assistant)

**ROG AI** is a production-grade, highly interactive educational platform designed to generate complete, exam-ready study materials instantly. Rather than simple short-form chat answers, ROG AI is specialized to construct detailed notes, rapid revision sheets, and interactive 3D flashcards.

Designed with a premium "ROG-inspired" dark aesthetic, the application provides an unparalleled user experience featuring smooth glassmorphism, fluid micro-animations, and custom scrolling mechanics.

---

## ✨ Core Features

- 🧠 **Dynamic Study Modes**: Seamlessly switch the AI's internal processing context between:
  - **Full Notes**: Comprehensive, heavily detailed topic breakdowns.
  - **Quick Revision**: Rapid-fire, condensed bullet points for last-minute reading.
  - **Explain Like I'm 5**: Deconstructs complex topics into basic analogies.
  - **Exam Prep**: Predicts and solves 2/5/10-mark questions based on the topic.
- 🎴 **Interactive 3D Flashcards**: Dynamically generate strict JSON from the AI to construct responsive, interactive 3D CSS flip-cards.
- ⚡ **Real-Time Streaming**: Vercel AI SDK integration provides lightning-fast chunked streaming responses.
- 💾 **Database Persistence**: Fully integrated database saving user sessions, chats, and individual messages.
- ⬇️ **Markdown Export**: Hover over any AI response to instantly download it as a local `.md` file.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **UI Components**: shadcn/ui, Framer Motion, Radix UI
- **Backend**: Next.js API Routes (Serverless), Vercel AI SDK
- **Database**: Prisma ORM, SQLite (Easily swappable to PostgreSQL)
- **Formatting**: Marked (Markdown parsing), Tailwind Typography

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
Clone the repository and install the required dependencies:
```bash
git clone https://github.com/yourusername/rog-ai.git
cd rog-ai
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following keys. You will need a valid OpenAI API key (or an alternative OpenAI-compatible provider).
```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-api-key-here"
```

### 4. Database Setup
Push the Prisma schema to initialize the SQLite database and generate the Prisma Client:
```bash
npx prisma db push
```

### 5. Running the Development Server
Start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start studying!

---

## 📂 Project Structure

```text
rog-ai/
├── prisma/
│   └── schema.prisma       # Database models (User, Chat, Message, Folder)
├── src/
│   ├── app/                # Next.js App Router (Pages, Layouts)
│   │   ├── actions/        # Server Actions for DB CRUD operations
│   │   ├── api/            # Serverless API routes (Chat streaming, Flashcards)
│   ├── components/
│   │   ├── chat/           # Core Chat Interface & Modals
│   │   ├── layout/         # Sidebar, Theme Toggles
│   │   └── ui/             # shadcn/ui generic components + Flashcards
```

---

*Built for educational excellence and modern web architecture demonstration.*
