# OAText

**OAText** is a full-stack online reading, writing, and community publishing platform where authors can compose and publish multi-chapter literature and readers can bookmark stories and discuss them in real-time chatrooms.

## System Architecture

- **Frontend (`./client`)**: React 18, TypeScript, Vite, Tailwind CSS, and `browser-image-compression` for client-side cover artwork optimization.
- **Backend (`./server`)**: Express 5.0, MongoDB, native WebSockets (`ws`), Zod schema validation, and Jest 29 / Supertest for automated testing.
- **Specifications**: System endpoints and schemas are documented in `OAText API Dictionary.xlsx` and `OAText Data Dictionary.xlsx`.

## Key Features

- **Authoring Studio**: Multi-chapter story drafting (`WritingPage`), genre categorization, and cover artwork uploads with automatic client-side compression.
- **Reader Hub**: Personal library management (`LibraryPage`, `ReadingPage`) with saved bookmarks, customizable typography, and paginated chapter navigation.
- **Real-Time Community Chat**: Persistent WebSocket chatrooms (`WebSocketContext`) for live reader–author discussions.
- **Account Security**: Email verification tokens, custom CAPTCHA verification, encrypted session cookies (`crypto-js`), and Zod request validation.

## Setup & Running

1. Install dependencies and start both frontend and backend concurrently:

   ```bash
   make -j2
   ```

2. Open `http://localhost:5173/login` (or the assigned Vite port) and wait for the backend to connect to MongoDB.
