# Demo Video Scripts
**Smart Home Gardening and Decoration System**

There are three short scripts, one for each module. Together they run about 5 minutes. Each one starts and ends on its own, so you can record them separately.

## Before you record
1. Run `npm start` and wait until the app opens on the emulator.
2. Start signed out, on the Welcome screen.
3. Have **your own Gmail** open in a browser for Module 1.
4. Choose a password, e.g. `Bloom2026` (at least 6 characters, with letters and numbers). Later you'll reset it to `Garden2026`.

## Demo accounts
On the Sign-in screen, tap the chips at the bottom to fill these in.

| Role | Name | Email | Password |
|---|---|---|---|
| Home owner | Sara Ahmed | sara@demo.com | Demo12 |
| Gardener | Ali Raza | ali@demo.com | Demo12 |
| Decorator | Hina Malik | hina@demo.com | Demo12 |
| Admin | System Admin | admin@shgds.app | Admin1 |

---

## Quick version: what to do, in simple words

**Module 1: Account and Roles**
1. Make a new account with your Gmail and answer the garden questions.
2. Edit your profile and add a home address.
3. Sign out, tap "Forgot password?", reset it from the email, and sign in with the new password.
4. Sign in as Ali, then Hina, then Admin to show each dashboard. As Admin, reactivate Zara.

**Module 2: Flower Knowledge Base**
1. On the Sign-in screen, tap the **Home owner** button (sara@demo.com), then open Explore and scroll the flowers.
2. Tap a category chip, then search "rose" and open Rose to show its care tips and precautions.
3. Go back and clear the search. Apply the Easy and Full sun filters, then tap the heart on Marigold.
4. Clear the filters, then show Marigold in Profile → Favourite flowers.
5. Open the **Ask** tab and ask two questions.

**Module 3: Seasonal Recommender**
1. Open the **Seasons** tab (sun icon) and show the weather card and tips at the top.
2. Scroll down and show the top picks with their match %.
3. Change the city to Murree, then Karachi.
4. While on Karachi, tap Blooming, Sow now and Next.
5. Switch the space to Indoors.
6. Open Calendar, change the month, and tap a flower.

---

# VIDEO 1: Account and Roles (about 2:20)

### 0:00 – 0:15 · Intro
**Show:** Welcome screen.
**Say:** "This is the Smart Home Gardening and Decoration System. In this part I'll show the Account and Roles module: sign-up, profiles, garden setup, role-based dashboards and account recovery."

### 0:15 – 0:55 · Registration and garden profile
**Do:**
1. Tap **Explore your green world**, choose **Home owner**, then tap **Continue**.
2. Enter your full name, **your Gmail**, city **Islamabad** and the password `Bloom2026`. Tap **Create account**.
3. On "Let's set up your garden", choose **Balcony**, **Full sun**, **Beginner** and a couple of colours.
4. Tap **Save & see my picks**.

**Say:** "There are four roles: home owner, gardener, decorator and admin. Accounts are secured with Firebase Authentication. After signing up I describe my garden, and the app uses this to personalise recommendations."

### 0:55 – 1:15 · Profile and addresses
**Do:**
1. Open the **Profile** tab, then **Edit profile**. Add a phone number and save.
2. Open **Addresses**, add a "Home" address and set it as the default.

**Say:** "Users can update their details and keep several addresses, with one set as the default."

### 1:15 – 1:45 · Account recovery
**Do:**
1. Scroll down and tap **Sign out**.
2. Tap **Forgot password?**, enter your Gmail and send.
3. In Gmail, open the reset email, click the link and set the password to `Garden2026`.
4. Back in the app, sign in with `Garden2026`.

**Say:** "If I forget my password, Firebase emails me a secure reset link. I choose a new password and sign straight back in."

> If the email is slow, check Spam and cut the wait out of the video.

### 1:45 – 2:20 · Role-based dashboards
Sign out, then sign in with each demo chip. Spend about 10 seconds on each.

| Sign in as | Show | Say |
|---|---|---|
| **Ali (Gardener)** | Dashboard and professional profile (skills, rate, days) | "Gardeners get their own dashboard and professional profile." |
| **Hina (Decorator)** | Decor skills and service cities | "Decorators show their event-decor skills and the areas they serve." |
| **Admin** | **Users** → search "Zara" → open her → **Reactivate account** | "The admin manages all accounts. A suspended user can't sign in, and I can reactivate them." |

**Say (close):** "Each role sees screens built for its needs. That's the Account and Roles module."

---

# VIDEO 2: Flower Knowledge Base (about 1:20)

**Setup:** on the Sign-in screen, under "One-tap demo sign in", tap **Home owner** (sara@demo.com). Wait for the Home screen, then start recording.

### 0:00 – 0:10 · Intro
**Show:** Home dashboard.
**Say:** "Next is the Flower Knowledge Base: a catalog of flowers with care guides, search, favourites and a care chatbot."

### 0:10 – 0:25 · Flower catalog
**Do:** Open the **Explore** tab and scroll the catalog. Tap the **Indoor plants** chip, then **Fresh bouquets**.
**Say:** "The catalog has 39 flowers, grouped into garden flowers, indoor plants and bouquet flowers."

### 0:25 – 0:45 · Search, care guide and precautions
**Do:** Make sure no filters are on (no number on the filter button). Type "**rose**". **Rose** is the first result, so open it. Scroll through water, sun and soil care, then the **precautions**. Go back and clear the search (✕).
**Say:** "I can search by name. Every flower has a full care guide and safety precautions, such as whether it's toxic to pets."

### 0:45 – 0:55 · Filters
**Do:** Tap the filter button, pick **Easy** and **Full sun**, and apply. You'll see 22 flowers.
**Say:** "Filters narrow it down by difficulty, sunlight, colour and more."

### 0:55 – 1:05 · Favourites
**Do:** Tap the **heart on Marigold**. Tap **Clear filters**. Then open **Profile → Favourite flowers**.
**Say:** "I can save flowers to my favourites."

> Don't tap the heart on Rose. Sara has already saved it, so tapping would remove it.

### 1:05 – 1:20 · Care chatbot
**Do:** Open the **Ask** tab (chat bubble icon). Ask "*How often should I water roses?*", then "*What should I plant in November?*"
**Say:** "And the care chatbot answers gardening questions in plain English. That's the Flower Knowledge Base."

---

# VIDEO 3: Seasonal Recommender (about 1:20)

**Setup:** stay signed in with the **Home owner** button (sara@demo.com). If you signed out, tap it again.

### 0:00 – 0:10 · Intro
**Show:** Home dashboard.
**Say:** "Finally, the Seasonal Recommender suggests the right flowers for the season, location, weather and space."

### 0:10 – 0:20 · Weather tips
**Do:** Open the **Seasons** tab (sun icon). Point to the **weather card** (today's temperature and 7-day forecast), then swipe the **garden tips** cards below it.
**Say:** "Live weather for my city, with practical gardening tips for this week."

### 0:20 – 0:35 · In-season recommendations
**Do:** Scroll down to **Recommended for you**. Point to **Petunia, 100%** and its reasons ("In bloom in Islamabad right now", "a perfect match for your space").
**Say:** "These flowers are in season right now, each scored against my garden, with reasons for every pick."

### 0:35 – 0:55 · Location and climate matching
**Do:** Scroll back up and tap **Islamabad ▾**, then choose **Murree**. The climate changes to highlands, about 7°, with frost tips. Then tap the city again and choose **Karachi** (coastal, about 24°). While on Karachi, tap the tabs **Blooming → Sow now → Next**.
**Say:** "Islamabad has 29 in bloom. Murree is cold and mountainous, so only 12 bloom there now. Karachi is warm and coastal, with more to sow and more coming next month."

> Do the tabs on Karachi. In Islamabad, **Sow now** and **Next** are empty this month.

### 0:55 – 1:05 · Space suitability
**Do:** Under "Where are you growing?", tap **Indoors**.
**Say:** "Changing the space re-ranks everything. Indoor plants like the Moth Orchid move to the top."

### 1:05 – 1:20 · Seasonal calendar
**Do:** Tap **Calendar** (next to "Recommended for you"). Tap a different month (e.g. **Aug**), tap **Sow / plant**, then tap a flower row.
**Say:** "The seasonal calendar shows when to sow and when each flower blooms, month by month. That covers all three modules. Thanks for watching."

---

## After recording
- If you don't want to keep the account you created, delete it in Firebase Console → Authentication.
- Run `npm run reset-db` to restore the demo data (Zara suspended again, Sara's favourites, and so on).
