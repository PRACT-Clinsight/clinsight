# How to Deploy FutureLoop to thefutureloop.com

Since we configured the subscription form to support **Netlify Forms**, you can deploy this landing page to your custom domain for **100% free** in under 2 minutes.

---

## Route A: Deploying on Netlify (Recommended)
Netlify will automatically host your frontend files and capture all email signups inside your Netlify Dashboard.

1.  **Create a Netlify Account:**
    *   Sign up at [netlify.com](https://www.netlify.com/) (using GitHub, Google, or Email).
2.  **Upload the `public` folder:**
    *   Go to **Sites** ➔ **Add New Site** ➔ **Deploy Manually**.
    *   Drag and drop the **`public`** folder (`c:\Users\xthomk\OneDrive\Antigravity\Monetization\public`) directly into the upload area on Netlify.
3.  **Link your Domain (`thefutureloop.com`):**
    *   Once uploaded, go to **Site Settings** ➔ **Domain Management**.
    *   Click **Add Custom Domain** and enter `thefutureloop.com`.
    *   Update your domain DNS settings at your domain registrar (e.g. Google Domains/Squarespace or Hostinger) to point to Netlify's DNS servers.
4.  **View Subscribers:**
    *   Any email submitted on the live site will automatically save in **Netlify Dashboard** ➔ **Sites** ➔ **Your Site** ➔ **Forms** ➔ **newsletter**.

---

## Route B: Running Locally (For Testing)
When running locally, the landing page saves subscribers to your local JSON database instead.

1. Open your terminal in the project directory.
2. Start the server:
   ```bash
   node src/index.js start-server
   ```
3. Open **`http://localhost:3000`** in your browser.
4. Emails will save directly to **`content/analytics/subscribers.json`**.
