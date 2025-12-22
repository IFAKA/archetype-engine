---
sidebar_position: 7
---

# Authentication

Archetype integrates with NextAuth.js (Auth.js) v5 to provide authentication out of the box.

## Enabling Auth

Add the `auth` option to your config:

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'

export default defineConfig({
  entities: [...],
  database: { type: 'sqlite', file: './sqlite.db' },
  auth: {
    enabled: true,
    providers: ['credentials', 'google', 'github'],
    sessionStrategy: 'jwt',  // or 'database'
  },
})
```

## Available Providers

| Provider | Description |
|----------|-------------|
| `credentials` | Email/password login |
| `google` | Google OAuth |
| `github` | GitHub OAuth |
| `discord` | Discord OAuth |

## Init Flow

When running `npx archetype init`, you'll be prompted:

```
? Enable authentication? (y/N) y
? Select auth providers:
  ◉ Credentials (email/password)
  ◯ Google
  ◯ GitHub
  ◯ Discord
```

## Generated Files

After running `npx archetype generate` with auth enabled:

```
src/
├── server/
│   └── auth.ts              # NextAuth configuration
└── app/
    └── api/
        └── auth/
            └── [...nextauth]/
                └── route.ts  # Auth API routes

generated/
└── db/
    └── auth-schema.ts       # Auth tables (users, accounts, sessions)
```

### auth.ts

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Implement your credential validation
        return null
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
})
```

### Auth Schema

```typescript
// generated/db/auth-schema.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('email_verified'),
  image: text('image'),
})

export const accounts = sqliteTable('accounts', { ... })
export const sessions = sqliteTable('sessions', { ... })
export const verificationTokens = sqliteTable('verification_tokens', { ... })
```

## Environment Variables

Add to `.env`:

```bash
# Required
AUTH_SECRET="generate-a-secret-here"

# For Google provider
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# For GitHub provider
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

Generate a secret:
```bash
npx auth secret
```

## Using Auth in Your App

### Get Current Session

```typescript
import { auth } from '@/server/auth'

export default async function Page() {
  const session = await auth()

  if (!session) {
    return <p>Not logged in</p>
  }

  return <p>Hello, {session.user.name}</p>
}
```

### Sign In/Out

```typescript
import { signIn, signOut } from '@/server/auth'

// Server action
async function handleSignIn() {
  'use server'
  await signIn('google')
}

async function handleSignOut() {
  'use server'
  await signOut()
}
```

## Protected Entities

Once auth is enabled, you can protect entity operations. See [Protection](/docs/protection) for details.
