import { test, expect, Page } from "@playwright/test";

// Mocks every backend route so the smoke test is deterministic and needs no running
// backend / Sarvam credentials. Covers the login -> mic -> confirm -> match -> order
// happy path required by SETUP_GUIDE.md §6.
async function mockBackend(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      json: {
        token: "test-token",
        user: { id: "farmer1", name: "Ramesh Kumar", role: "farmer", location: "Kharagpur", language: "hi" },
      },
    }),
  );

  await page.route("**/api/voice/transcribe", (route) =>
    route.fulfill({ json: { transcript: "50 किलो टमाटर, बीस रुपए किलो", language: "hi-IN" } }),
  );

  await page.route("**/api/voice/intent", (route) =>
    route.fulfill({
      json: {
        action: "sell",
        commodity: "Tomato",
        quantity: 50,
        unit: "kg",
        price: 20,
        location: "Kharagpur",
        confidence: 0.95,
      },
    }),
  );

  // TTS read-back — return a tiny valid WAV so audio.play() doesn't throw.
  await page.route("**/api/voice/speak", (route) =>
    route.fulfill({
      contentType: "audio/wav",
      body: Buffer.from("RIFF....WAVEfmt ", "ascii"),
    }),
  );

  const ramesh = {
    id: "b1",
    name: "Ramesh Traders",
    role: "buyer",
    price: 20,
    distance_km: 2.3,
    rating: 4.6,
    reviews: 128,
    review: "Pays on time, fair weighing at pickup.",
    location: "Kharagpur",
    tags: ["nearest"],
  };

  // Market dashboard — the app's home screen loads rates + live demand before anything else.
  await page.route("**/api/market", (route) =>
    route.fulfill({
      json: {
        rates: [
          {
            commodity: "Tomato",
            name_hi: "टमाटर",
            name_bn: "টমেটো",
            unit: "kg",
            price: 22,
            delta: 2,
            emoji: "🍅",
          },
        ],
        demand: [
          {
            commodity: "Tomato",
            name_hi: "टमाटर",
            name_bn: "টমেটো",
            unit: "kg",
            emoji: "🍅",
            buyers: 2,
            price_min: 20,
            price_max: 25,
            mandi_price: 22,
          },
        ],
      },
    }),
  );

  // The farmer's standing record. Empty here so the smoke test asserts on the deal it
  // creates rather than on seeded history.
  await page.route("**/api/deals*", (route) =>
    route.fulfill({ json: { deals: [], earned_this_month: 0, deal_count: 0 } }),
  );

  await page.route("**/api/reviews", (route) => route.fulfill({ json: { ok: true } }));

  await page.route("**/api/listings", (route) =>
    route.fulfill({
      json: {
        id: "abc123",
        match: ramesh,
        delivery: { name: "Suresh", vehicle: "bike" },
      },
    }),
  );

  // Status polling: any /api/listings/<id>. Registered before the /options route below so
  // that — since Playwright checks most-recently-registered first — /options wins over this
  // broader "**/api/listings/*" glob (which would otherwise also match /api/listings/options).
  await page.route("**/api/listings/*", (route) =>
    route.fulfill({
      json: {
        id: "abc123",
        status: "delivered",
        match: ramesh,
        delivery: { name: "Suresh", vehicle: "bike" },
      },
    }),
  );

  await page.route("**/api/listings/options", (route) =>
    route.fulfill({
      json: {
        options: [
          ramesh,
          {
            id: "b2",
            name: "Kolkata Fresh Mart",
            role: "buyer",
            price: 25,
            distance_km: 18.0,
            rating: 4.8,
            reviews: 342,
            review: "Best rates in the region, but pickup can be slow.",
            location: "Kolkata",
            tags: ["best_price", "top_rated"],
          },
        ],
        mandi_price: 22,
      },
    }),
  );
}

test("farmer can log in, speak a sell request, and reach the order screen", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");

  // Login
  await page.getByPlaceholder("ID (e.g. farmer1)").fill("farmer1");
  await page.getByPlaceholder("Password").fill("farmer123");
  await page.getByRole("button", { name: "Log in" }).click();

  // Welcome (Hindi pre-selected from the mock user) -> Continue
  await page.getByRole("button", { name: "जारी रखें" }).click();

  // Market dashboard is the home screen: rates and live demand, with the mic docked over it.
  await expect(page.getByText("आज के भाव")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("अभी कौन खरीद रहा है")).toBeVisible();
  await page.getByLabel("बोलने के लिए दबाएँ").click();

  // Confirm Draft: the request as an order slip, not a quoted reply. The goods are named
  // in the farmer's language — the extractor's canonical "Tomato" is for matching, not
  // for reading — and the same words are what the read-back speaks aloud.
  await expect(page.getByText("बिक्री पर्ची")).toBeVisible({ timeout: 15_000 });
  // Scoped to the slip's own rows: the transcript line above it quotes the same words,
  // and asserting page-wide would pass on the quote alone without the slip being filled.
  const slip = page.locator("dl");
  await expect(slip.getByText("टमाटर")).toBeVisible();
  await expect(slip.getByText("50 किलो")).toBeVisible();
  await expect(slip.getByText("Kharagpur")).toBeVisible();
  await expect(page.getByText("अभी पक्का नहीं हुआ")).toBeVisible();

  // Confirm -> Options (price-discovery list of buyers to choose from)
  await page.getByRole("button", { name: /पुष्टि करें/ }).click();
  await expect(page.getByText("Ramesh Traders")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Kolkata Fresh Mart")).toBeVisible();
  // Liquidity + spread are the price-discovery payoff — assert they render.
  await expect(page.getByText(/2 खरीदार आपकी फ़सल पर बोली/)).toBeVisible();
  await expect(page.getByText("भाव की रेंज")).toBeVisible();

  // Top option (Ramesh Traders) is pre-selected -> Continue to Match Result
  await page.getByRole("button", { name: "जारी रखें" }).click();
  await expect(page.getByText("Suresh (bike)")).toBeVisible({ timeout: 10_000 });

  // The two-sided proof: the same deal, on the buyer's phone.
  await page.getByRole("button", { name: /खरीदार का फ़ोन देखें/ }).click();
  await expect(page.getByText("यही सौदा — खरीदार की तरफ़ से")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("नई पेशकश")).toBeVisible();
  await page.getByRole("button", { name: "मना करें" }).click();

  // Proceed -> Order Status (receipt + stepper). Chosen price = 20.
  await page.getByRole("button", { name: "आगे बढ़ें" }).click();
  // Net amount = 50*20 - 20 - 15 = 965
  await expect(page.getByText("965")).toBeVisible({ timeout: 5_000 });

  // Order delivered -> Done -> Review screen
  await page.getByRole("button", { name: "हो गया" }).click();
  await expect(page.getByText(/सौदा कैसा रहा/)).toBeVisible({ timeout: 5_000 });

  // Rate 5 stars and submit -> back to the market dashboard (not a wiped blank screen)
  await page.getByRole("radio", { name: "5" }).click();
  await page.getByRole("button", { name: "रेटिंग भेजें" }).click();
  await expect(page.getByLabel("बोलने के लिए दबाएँ")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("आज के भाव")).toBeVisible();

  // The shell's tabs persist across the whole flow — the clearest "this is an app" signal.
  await page.getByRole("button", { name: "मेरे सौदे" }).click();
  await expect(page.getByText("इस महीने कमाए")).toBeVisible({ timeout: 5_000 });
});
