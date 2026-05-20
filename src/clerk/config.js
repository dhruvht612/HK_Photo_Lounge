/** True when VITE_CLERK_PUBLISHABLE_KEY is set (read automatically by ClerkProvider). */
export const isClerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim());
