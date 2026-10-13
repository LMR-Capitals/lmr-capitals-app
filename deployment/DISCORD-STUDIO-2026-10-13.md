# Discord delivery for Studio

Live sessions, Announcements and Callouts have separate administrator-only webhook setup panels. A saved webhook enables automatic server-side sending after the corresponding LMR record is saved/published. Session status/group changes also send their current public room summary. Callouts attach the saved circle-media image. No historical backfill or automatic publication of Journal drafts occurs.

`netlify/functions/studio-discord.mjs` verifies the existing Supabase user and `circle_is_admin` MFA check, then reads the existing saved record through RLS. Settings are site-level configuration objects in private Netlify Blobs store `lmr-studio-discord`, under `settings/callouts`, `settings/sessions`, and `settings/announcements`. URLs are accepted only for Discord webhook endpoints and never returned to the browser. Setup/disconnect happens only on explicit administrator action. No database migration or record rewrite is needed. Existing Journal integration settings are not read/copied.

The endpoint refuses all non-production deploy contexts before opening the site-wide store. Preview UI never sends requests or Discord messages. Delivery markers suppress duplicate unchanged records; definite HTTP failures release the marker, while ambiguous network failures remain pending to avoid duplicate messages. The UI reports when delivery cannot be confirmed; LMR publication stays saved. No automatic retries or guaranteed background queue is claimed. Private notifications and raw stream URLs are excluded; mention parsing is disabled. Channel access is controlled in Discord.

Webhooks must be supplied by the administrator in each live section. The same URL can be used for a shared channel or distinct URLs for separate channels. Saving settings sends no test or historical messages.

Validation includes isolated handler tests for auth, production isolation, destination validation, all categories, private notification/source owner checks, attached image, duplicate delivery, session state changes, failures and disconnect. Existing publication/privacy tests and full root production build remain required.
