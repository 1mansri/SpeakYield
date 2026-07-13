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

  await page.route("**/api/listings", (route) =>
    route.fulfill({
      json: {
        id: "abc123",
        match: { name: "Ramesh Traders", role: "buyer", distance_km: 2.3 },
        delivery: { name: "Suresh", vehicle: "bike" },
      },
    }),
  );

  await page.route("**/api/listings/*", (route) =>
    route.fulfill({
      json: {
        id: "abc123",
        status: "delivered",
        match: { name: "Ramesh Traders", role: "buyer", distance_km: 2.3 },
        delivery: { name: "Suresh", vehicle: "bike" },
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

  // Confirm -> Match Result (shows matched buyer + delivery partner)
  await page.getByRole("button", { name: /पुष्टि करें/ }).click();
  await expect(page.getByText("Ramesh Traders")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Suresh (bike)")).toBeVisible();

  // Confirm Payment -> Order Status (receipt + stepper)
  await page.getByRole("button", { name: "भुगतान की पुष्टि करें" }).click();
  // Net amount = 50*20 - 20 - 15 = 965
  await expect(page.getByText("965")).toBeVisible({ timeout: 5_000 });
});
