# Capturing real Pulse Chat screenshots

The repository currently contains app icons and a favicon, but no verified screenshots from a running chat session. Capture screenshots from the actual app; do not substitute mockups or generated product images.

## Recommended captures

- `01-login.png` — username entry screen before sign-in.
- `02-chat-empty.png` — conversation screen before messages are sent.
- `03-chat-conversation.png` — two or more messages from different demo users.
- `04-presence-typing.png` — connected state, online user count/list, and typing indicator if visible.

## Capture steps

1. Start the backend with its Supabase environment configured and verify `/api/health`.
2. Start the Expo web client with `EXPO_PUBLIC_API_BASE` pointing at that backend.
3. Open the app in a browser at a consistent viewport (for example, 1440 × 900).
4. Use two browser profiles to create two distinct demo users and exchange messages.
5. Capture each state without browser developer tools, loading skeletons, or error banners.
6. Remove personal information and ensure no environment variables or credentials appear in the frame.
7. Save optimized PNGs in this folder and embed the strongest two or three in the README using relative paths.

A successful health response alone is not enough to capture a working chat demo: confirm that the database migration has run and that login, history, and realtime message persistence work first.
