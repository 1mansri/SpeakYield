from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ALLOW_ORIGINS
from app.logging_config import configure_logging
from app.routers import auth, catalog, deals, listings, market, orders, reviews, voice
from app.store import seed_demo_deals

configure_logging()

# Give the demo farmers a standing trade history at boot — the app must never open empty.
seed_demo_deals(["farmer1", "farmer2"])

app = FastAPI(title="Speak Yield Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(voice.router)
app.include_router(catalog.router)
app.include_router(market.router)
app.include_router(deals.router)
app.include_router(listings.router)
app.include_router(orders.router)
app.include_router(reviews.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
