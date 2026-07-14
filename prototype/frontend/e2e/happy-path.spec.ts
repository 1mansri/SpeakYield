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

  // Home -> tap mic
  await page.getByLabel("बोलने के लिए दबाएँ").click();

  // Confirm Draft appears with the extracted commodity
  await expect(page.getByText("Tomato")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Kharagpur")).toBeVisible();

  // Confirm -> Options (price-discovery list of buyers to choose from)
  await page.getByRole("button", { name: /पुष्टि करें/ }).click();
  await expect(page.getByText("Ramesh Traders")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Kolkata Fresh Mart")).toBeVisible();

  // Top option (Ramesh Traders) is pre-selected -> Continue to Match Result
  await page.getByRole("button", { name: "जारी रखें" }).click();
  await expect(page.getByText("Suresh (bike)")).toBeVisible({ timeout: 10_000 });

  // Proceed -> Order Status (receipt + stepper). Chosen price = 20.
  await page.getByRole("button", { name: "आगे बढ़ें" }).click();
  // Net amount = 50*20 - 20 - 15 = 965
  await expect(page.getByText("965")).toBeVisible({ timeout: 5_000 });

  // Order delivered -> Done -> Review screen
  await page.getByRole("button", { name: "हो गया" }).click();
  await expect(page.getByText(/सौदा कैसा रहा/)).toBeVisible({ timeout: 5_000 });

  // Rate 5 stars and submit -> back Home
  await page.getByRole("radio", { name: "5" }).click();
  await page.getByRole("button", { name: "रेटिंग भेजें" }).click();
  await expect(page.getByLabel("बोलने के लिए दबाएँ")).toBeVisible({ timeout: 5_000 });
});
