from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import configure_logging
from app.routers import auth, catalog, listings, orders, voice

configure_logging()

app = FastAPI(title="Speak Yield Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(voice.router)
app.include_router(catalog.router)
app.include_router(listings.router)
app.include_router(orders.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
