# Chrome Web Store Listing Copy

## Title (max 45 characters)

```
EU Tariff & Landed Cost Calculator
```
(34 characters)

## Short description (max 132 characters)

```
Estimate EU duty, VAT & total landed cost under the new July 2026 tariff rules. For cross-border and DTC sellers.
```
(113 characters)

## Detailed description

```
Starting July 1, 2026, the EU removed the duty exemption for packages under €150. Instead, every distinct HS6 product category in a shipment is charged a flat €3 duty (Council Regulation (EU) 2026/382, approved February 11, 2026) — and VAT still applies from the first euro, at each destination country's own rate.

If you sell to EU customers from a Shopify, WooCommerce, or other independent storefront, this changes the real landed cost of nearly every order — and most existing duty calculators haven't caught up yet.

EU Tariff & Landed Cost Calculator is a lightweight popup tool built for exactly this moment. Enter a product's declared value, the number of distinct HS6 categories in the package, and the destination country — it instantly estimates:

• Duty (€3 × number of HS6 categories)
• VAT (based on the destination country's rate — Germany, France, Italy, Spain, and Netherlands built in)
• Total landed cost
• Landed cost as a percentage of declared value

Other features:
• Local calculation history (your last 20 calculations, stored only on your device)
• Free tier: 5 calculations per day
• Pro: one-time unlock for unlimited daily calculations

A ~€2 per-package customs clearance handling fee is expected to take effect around November 2026 and is called out separately in the results — it is not yet included in the totals until it's confirmed active.

Disclaimer: This tool provides estimates for planning purposes only. It is not official customs or tax advice, and results should be verified against official sources or a qualified customs/tax professional before making business decisions.
```

## Category

```
Workflow & Planning
```

Rationale: the tool is a planning aid used by sellers while pricing and quoting orders. Second choice would be **Shopping**, but that category skews toward consumer-facing buying tools, and this is a seller-side utility. Pick one — the Chrome Web Store allows a single primary category.

## Single Purpose Description

```
This extension has a single purpose: to estimate the import cost of a shipment sent to a European Union country.

The user enters three values in the extension's popup — a declared product value, the number of distinct HS6 product categories in the package, and a destination EU country. The extension then calculates and displays the applicable customs duty, VAT, the total landed cost, and the added cost as a percentage of the declared value.

All calculation is performed locally in the popup, using a static table of EU VAT rates and duty parameters bundled in the extension package. The extension does not inject scripts into web pages, does not read or modify page content, does not observe browsing activity, and contains no functionality unrelated to this one calculation.
```

The closing sentence is deliberate — proactively stating that there are no content scripts and no page access answers the most common reviewer objection to a single-purpose claim.

## Permission Justification

`manifest.json` declares exactly one permission: `"permissions": ["storage"]`. There are no `host_permissions`, no `activeTab`, and no `tabs`.

**storage**

```
Used to persist three pieces of state locally on the user's own device via chrome.storage.local:

1. The user's 20 most recent calculations, so the popup can display a history list across sessions.
2. A per-day count of calculations performed, required to enforce the free tier's limit of 5 calculations per day and to reset that count at the start of each day.
3. A "Pro unlocked" flag and the license key the user entered, so a paying user does not have to re-enter their key every time the popup is opened.

None of this data is transmitted anywhere — it is written and read only by the extension's own popup. The extension does not use storage.sync or storage.managed.
```

Note on `chrome.tabs.create()`: `popup.js` calls it to open the checkout page, but **this does not require the `tabs` permission** — only reading tab properties such as `url` or `title` does. Do not add `tabs` to the manifest; fewer permissions means a faster review.

## Remote code

Answer: **"No, I am not using remote code."**

All JavaScript is contained in the uploaded package (`popup.js`, `calculator.js`). The extension makes one `fetch()` call to our Cloudflare Worker for license verification, but that returns JSON data — it does not load or execute remote script.

## Data usage disclosure

⚠️ This section must agree with `PRIVACY_POLICY.md`. A mismatch between the disclosure checkboxes and the linked privacy policy is a common rejection cause.

**Do not select "I do not collect user data."** Section 1.3 of the privacy policy states that the License Key is transmitted over HTTPS to our license-verification Worker. The closest Chrome data category is **Authentication information** ("passwords, credentials, security question, or PIN").

Everything else the extension stores — calculation inputs, results, history, daily usage count — never leaves the device and does not need to be disclosed as collected.

Three certification checkboxes at the bottom of the Privacy tab must also be ticked (no selling to third parties, no use/transfer outside the disclosed purpose, no use for creditworthiness/lending).

## Screenshots needed

Requirement: **1280×800** or 640×400, PNG or JPEG. At least 1, maximum 5.

None of the previously committed screenshots were usable (all were 800×600 / 800×628 / 785×628, several showed Creem's test-mode banner or a third-party checkout page, and one contained a real License Key in plain text). They were removed from the repo; new ones must be generated.

Five to capture, all with the UI in English:

1. Default empty state — full popup with title, three inputs, Calculate button. This is the primary listing image.
2. A completed calculation — €50 / 1 category / Germany, with Duty €3.00, VAT €10.07, Total €63.07, 26% visible.
3. History expanded — several entries, using *different* countries and amounts.
4. Free-tier limit reached, showing the upgrade prompt.
5. License activation panel — with placeholder text such as `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` in the input. **Never a real key.**

Composition note: the popup is only 300px wide (`popup.html`, `body { width: 300px }`). Pasted raw onto a 1280×800 canvas it reads as a thin strip. Scale it 1.5–2× and centre it on a plain background, with room for a short caption.

## Notes for whoever publishes this

- URLs for the submission form (the site now serves from a custom domain — `CNAME` is set to `eutariffcalculator.com`, and the old `jacksonliii.github.io/eu-tariff-calculator/*` addresses 301-redirect there. Use the custom-domain URLs directly rather than relying on the redirect):
  - Product / homepage: https://eutariffcalculator.com/
  - Privacy policy: https://eutariffcalculator.com/PRIVACY_POLICY.html
  - Terms of service: https://eutariffcalculator.com/TERMS_OF_SERVICE.html
- Pro is **$14.99, one-time payment** (not a subscription). This is stated on the landing page; the detailed description above does not mention a price. Consider adding it there too so the store listing, the landing page, and the Creem product all agree — Creem review flags mismatches.
- Uses Chrome's official i18n system (`_locales/en`, `_locales/zh_CN`); the store listing text above is for the English listing. A separate Chinese listing can be translated from `_locales/zh_CN/messages.json` later if a zh-CN store page is ever published.
- Keep the "estimates only / not official advice" framing intact in any future edits — required by the disclaimer commitment in `SPEC.md` and by Chrome Web Store policy against absolute/guaranteed-accuracy claims.
- Update the "~€2 clearance fee ... expected ... November 2026" line once that fee actually goes into effect.
- Build the upload ZIP with `npm run build:strict` (see `build.ps1`). It refuses to produce a "submission-ready" package while any pre-flight warning stands — currently it correctly flags that `popup.js:7` still points at the Creem **test-mode** checkout URL. That must be switched to the live product before submitting, or paying users cannot actually pay.
