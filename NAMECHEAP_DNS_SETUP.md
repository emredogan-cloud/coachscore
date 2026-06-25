# NAMECHEAP DNS SETUP — coachscore.app → Vercel

**For:** pointing `coachscore.app` (registered at **Namecheap**) at the Vercel deployment.
**Audience:** assumes you have **never configured DNS before** — every click is spelled out.

> You only need to touch DNS **once**. After Vercel verifies the domain, HTTPS is automatic.

---

## What you'll end up with
- `https://coachscore.app` → your live site (primary).
- `https://www.coachscore.app` → redirects to `https://coachscore.app`.
- A `TXT` record for Google Search Console verification (Phase 6).

---

## Step 0 — Add the domain in Vercel first
In the Vercel dashboard: **Project `coachscore` → Settings → Domains → Add** → type `coachscore.app` → **Add**. Repeat for `www.coachscore.app`. Vercel will then **show you the exact records to create** and mark them "Invalid Configuration" until DNS is set. The values below are Vercel's standard ones; **if Vercel shows different values, use Vercel's.** `screenshots/dns/vercel-add-domain.png`

---

## Step 1 — Open Namecheap Advanced DNS
1. Log in at **namecheap.com** → top-right **Account → Dashboard**.
2. Find `coachscore.app` in the **Domain List** → click **MANAGE**. `screenshots/dns/namecheap-domain-list.png`
3. Confirm **Nameservers** says **"Namecheap BasicDNS"** (Domain tab → Nameservers section). If it says "Custom DNS", switch it to **Namecheap BasicDNS** (otherwise these records won't apply).
4. Click the **Advanced DNS** tab. `screenshots/dns/namecheap-advanced-dns.png`

## Step 2 — Remove the default parking records
Namecheap pre-creates parking records that will conflict. In the **Host Records** table, **delete** (trash icon) any of these if present:
- `CNAME Record` · Host `www` · Value `parkingpage.namecheap.com`
- `URL Redirect Record` · Host `@` · Value (a parking URL)

## Step 3 — Add the two records that point at Vercel
Click **ADD NEW RECORD** for each:

| # | Type | Host | Value | TTL |
|---|---|---|---|---|
| 1 | **A Record** | `@` | `76.76.21.21` | Automatic |
| 2 | **CNAME Record** | `www` | `cname.vercel-dns.com` | Automatic |

Notes:
- `@` means the apex (`coachscore.app` itself). Namecheap does **not** allow a CNAME on `@`, which is why the apex uses an **A Record** (the `76.76.21.21` IP), not a CNAME.
- For the CNAME **Value**, Namecheap may auto-append a dot — `cname.vercel-dns.com.` is fine.
- Click the green **✓ checkmark** to save each row. `screenshots/dns/namecheap-records-saved.png`

## Step 4 — (Phase 6) Add the Google verification TXT record
When Google Search Console gives you a verification string (see `PRODUCTION_SEARCH_CONSOLE_CHECKLIST.md`), add:

| Type | Host | Value | TTL |
|---|---|---|---|
| **TXT Record** | `@` | `google-site-verification=XXXXXXXX` (paste the exact string) | Automatic |

This does not conflict with anything — keep it alongside the A/CNAME records.

---

## Step 5 — Wait, then verify
- **Propagation:** usually **5–30 minutes**; can take up to **48 hours**. TTL "Automatic" ≈ 30 min.
- **Check propagation:** `dig coachscore.app +short` should return `76.76.21.21`; `dig www.coachscore.app +short` should show `cname.vercel-dns.com`. (Or use https://dnschecker.org → enter `coachscore.app`, type `A`.)
- **Verify in Vercel:** the Domains page flips from "Invalid Configuration" to **"Valid Configuration"** with a green check, and issues the TLS certificate automatically. `screenshots/dns/vercel-domain-valid.png`
- **Final check:** `curl -I https://coachscore.app` → `HTTP/2 200`; `curl -I https://www.coachscore.app` → `301/308` redirect to the apex.

---

## Troubleshooting
| Symptom | Fix |
|---|---|
| Vercel still says "Invalid Configuration" after 1h | Re-check the A value is exactly `76.76.21.21` and Host is `@` (not `coachscore.app`). Confirm nameservers = Namecheap BasicDNS. |
| `dig` returns a different IP | An old parking A record remains — delete it (Step 2). |
| `www` doesn't redirect | Confirm the `www` CNAME → `cname.vercel-dns.com`, and that Vercel's Domains page has `www.coachscore.app` set to **Redirect to coachscore.app**. |
| Browser shows "not secure" | The TLS cert is still issuing (wait a few minutes after "Valid Configuration"); `.app` is HSTS-preloaded so HTTP always upgrades to HTTPS. |
| Changes not taking effect | DNS caches — try a different network / `dig @8.8.8.8 coachscore.app`, or wait out the TTL. |

---

## Alternative (optional): let Vercel run DNS
Instead of the A/CNAME above, you can point Namecheap's **Custom DNS** nameservers to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) and manage all records in Vercel. Simpler long-term, but it moves **all** DNS (including email/MX) to Vercel — only do this if you don't have other records on the domain. The A/CNAME method above is recommended for most cases.
