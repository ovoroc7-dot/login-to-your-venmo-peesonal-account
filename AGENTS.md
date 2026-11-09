<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Amount and note entry use the phone's own keyboard (real inputs with the right input mode), never a drawn keypad, so the recreation behaves like the native app on phones.
- In-app screens (splash → welcome → login or sign up → home tabs → settings → payment methods → pay/request → send money; settings sign-out → signed-out screen → login or create account) are switched with React state in `src/routes/index.tsx` and `src/components/venmo/Home.tsx`, not separate routes, because the app mirrors a single phone recording flow.
- The Venmo balance, transaction history, pending requests and default privacy live in one wallet per account, stored as JSON in the `wallets` table (one row per user, own-row RLS) and synced by `useWallet(userId)`; wallet rules stay pure in `src/components/venmo/wallet.ts` and every balance change (including paid requests) goes through `applyTransaction`, so the balance never goes negative and history matches on every device.
- Sign-in uses Lovable Cloud email/password; the session persists with auto-refresh and the app only signs out when the user taps Sign Out, so reopening on any device lands back on Home.
- Sheets that must cover the bottom bar (pay a request, change a payment's privacy) are rendered from `Home.tsx`, because tab screens animate and trap z-index below the bar.
- Large-payment Pending status is set inside `applyTransaction` (threshold constant in `wallet.ts`), so every send path — Pay screen and paying requests — flags it the same way.
- Transaction receipts open from the Activity list and render from `Home.tsx` like other bar-covering sheets.
- The app shell fills the whole phone (fixed, safe-area aware): screens sit between the status bar and gesture bar, and `useEdgeColors` paints those two strips plus the theme-color with the colors sampled at the screen's top and bottom, so every screen reaches the device edges without per-screen padding.
