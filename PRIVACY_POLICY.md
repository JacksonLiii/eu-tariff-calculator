# Privacy Policy — EU Tariff & Landed Cost Calculator

**Last updated: 2026-08-04**

This privacy policy explains what data the "EU Tariff & Landed Cost Calculator" Chrome extension (the "extension") collects, stores, and shares, and what it does not.

## 1. Data the extension collects

### 1.1 Calculator inputs and results (local only)
When you use the calculator, the extension stores the following on your own device, using the browser's built-in `chrome.storage.local` API:

- The values you enter: declared value, number of distinct HS6 categories, and destination country
- The calculated results (duty, VAT, total landed cost, additional cost percentage)
- A timestamp for each calculation

Up to your 20 most recent calculations are kept as local history. **This data is never transmitted anywhere.** It stays on your device and is only read by the extension's own popup to display your history.

### 1.2 Daily usage count (local only)
To enforce the free tier's daily calculation limit, the extension stores a count of how many calculations you've run today and the current date, also in `chrome.storage.local`. This never leaves your device.

### 1.3 License Key (sent to our verification service, if you activate Pro)
If you purchase Pro and choose to activate it by entering a License Key in the extension:

- The License Key you enter is sent, over HTTPS, to our license-verification service (a Cloudflare Worker we operate).
- That service forwards the key to Creem (our third-party payment and licensing provider) to check whether it is valid.
- The verification result (valid or invalid) is sent back to the extension, which then stores a Pro status flag (`isPro: true`) and the License Key locally in `chrome.storage.local`, so you don't need to re-enter it later.

No other information (name, email, payment details) is sent as part of this check — only the License Key string you typed in.

## 2. Data the extension does not collect

The extension does **not**:

- Collect your name, email address, or any other personally identifiable information
- Read, log, or store your IP address in any code we control (see the note on Cloudflare's infrastructure-level logging in Section 3.2)
- Use cookies
- Track your browsing activity, the pages you visit, or your behavior across websites
- Sell or share your data with any third party for advertising or marketing purposes
- Include any analytics, telemetry, or tracking code

## 3. Third-party services

### 3.1 Creem (creem.io)
Purchases are handled entirely by Creem, our payment processor. When you choose to upgrade to Pro, the extension opens Creem's own checkout page in a new browser tab — you complete the purchase directly on Creem's site. The extension itself never sees or handles your payment details (card number, billing address, email, etc.); that information goes directly to Creem, not to us.

Please refer to Creem's own privacy policy for how they handle your payment and checkout information: [Creem Privacy Policy — link to be added].

### 3.2 Cloudflare Workers (license verification)
We use a Cloudflare Worker as a lightweight relay solely to check whether a License Key you enter is valid with Creem. Our Worker code does not store or log your data — it simply forwards the key for a validity check and returns the result.

Cloudflare is our infrastructure provider, and like any network operator, its edge network may record standard connection metadata (such as IP address) while handling the request, as part of Cloudflare's own security and abuse-prevention systems. This logging happens at Cloudflare's infrastructure level as a normal part of operating their network — it is not something our Worker code actively reads, logs, or stores. For details on how Cloudflare handles this, see [Cloudflare's own privacy policy](https://www.cloudflare.com/privacypolicy/).

## 4. Data retention and deletion

- **Calculation history**: you can delete it at any time using the "Clear History" button inside the extension. This immediately erases the stored history from `chrome.storage.local`.
- **Usage count, Pro status, License Key**: stored locally for as long as the extension is installed.
- **Uninstalling the extension** removes all data the extension has ever stored in `chrome.storage.local` on your device — nothing is retained after uninstall.

We do not operate any server-side database of user data; everything described in Section 1.1 and 1.2 lives only in your browser's local storage.

## 5. Disclaimer

This extension is an estimation tool. The duty, VAT, and total landed cost figures it produces are for reference and planning purposes only — they do not constitute official customs or tax advice, and are not a guarantee of accuracy. Always verify against official sources or consult a qualified customs/tax professional before making business decisions.

## 6. Contact

If you have questions about this privacy policy or how your data is handled, contact us at:

**lidingyao44@gmail.com**
