# Deliberately example-free: earlier few-shot versions caused the model to regurgitate the
# first example verbatim (returning "Tomato/sell/50kg" for unrelated buy requests). The strict
# JSON schema already pins the output format, so the prompt only needs to describe the task.
# Verified in Phase 10/11 tuning against real Hindi/Bengali sell and buy transcripts.
INTENT_SYSTEM_PROMPT = """You extract a structured sell/buy draft from a farmer's spoken \
request, transcribed from Hindi, Bengali, or English. The farmer is either selling produce \
or buying farm inputs.

Real farmers rarely state every detail. A perfectly valid request may be just \
"I want to sell tomatoes" or "मुझे यूरिया चाहिए" — with no quantity, no price, and no \
location. That is NORMAL, not an error. Extract what was actually said and leave the rest \
empty; the app fills gaps later (it shows the farmer live market prices to choose from, so a \
missing price is expected, never a reason to guess one).

Fields:
- action: "sell" if the farmer wants to sell produce, "buy" if they want to buy farm inputs. \
Infer from verbs like बेचना / বিক্রি / sell versus खरीदना / কিনতে / buy. If the farmer only \
names a produce crop (tomato, rice, onion), lean "sell"; if they name an input (fertiliser, \
seeds, pesticide, urea, DAP), lean "buy".
- commodity: the produce or input mentioned, in English (e.g. "Tomato", "Urea fertiliser"). \
"" if none clearly named.
- quantity: the number said. 0 if none — do NOT invent a typical amount.
- unit: e.g. "kg", "bag", "quintal". "" if none.
- price: number per unit in rupees, ONLY if the farmer explicitly stated a price. 0 otherwise \
— most farmers don't know the price, so 0 is the common, correct answer. Never estimate.
- location: place name in English. "" if none.
- confidence: 0-1, how sure you are about the action + commodity (the two fields that matter). \
Do NOT lower confidence just because quantity/price/location are missing — a clear \
"sell tomatoes" with nothing else is still high confidence.

Extract ONLY from the given transcript. Do not use any values from your training or these \
instructions. If the transcript is not a plausible sell/buy request (a greeting, silence, or \
unrelated speech), return empty/zero fields with confidence near 0 — never fabricate a \
plausible-sounding request."""


# Per-decision guidance for the voice-command parser. The farmer speaks a short answer
# to an on-screen question (in Hindi, Bengali, or English); we map it to one intent from
# the decision's allowed set. Deliberately multilingual and colloquial — farmers say
# "haan"/"হ্যাঁ" more than "confirm". Keep the intent words in sync with COMMAND_INTENTS.
COMMAND_INSTRUCTIONS: dict[str, str] = {
    "confirm": (
        "The farmer is reviewing a draft of their request and deciding if it is correct. "
        "'confirm' = yes / correct / go ahead (हाँ, हां जी, ठीक है, सही है, हो जाए, ह্যাঁ, "
        "ঠিক আছে, yes, correct, ok). "
        "'retry' = no / wrong / say it again (नहीं, गलत, फिर से बोलूँगा, दोबारा, না, ভুল, "
        "আবার বলব, no, wrong, again). "
        "'cancel' = go back / leave it (वापस, रहने दो, ফিরে যাও, back, cancel). "
        "'unknown' if it is none of these."
    ),
    "choose": (
        "The farmer is choosing ONE option from the numbered CHOICES list below. Set 'index' "
        "to the 0-based position of the option they mean. They may refer to it by position "
        "(पहला/पहलेवाला = 0, दूसरा = 1, প্রথম = 0, first/second/last), by name, or by a quality "
        "('सबसे सस्ता'/cheapest, 'सबसे पास'/nearest, 'सबसे अच्छा'/best rated) — use the CHOICES "
        "text to resolve which index that quality points to. "
        "'back' = go back (वापस, ফিরে যাও). 'unknown' if unclear; set index -1 for back/unknown."
    ),
    "pay": (
        "The farmer is on the payment / final-confirm screen. "
        "'pay' = proceed / pay / yes (हाँ, आगे बढ़ो, कर दो, भुगतान करो, হ্যাঁ, এগিয়ে যাও, pay, "
        "proceed, confirm, ok). "
        "'back' = go back (वापस, ফিরে যাও, back). 'unknown' if unclear."
    ),
    "done": (
        "The farmer is on the order-status / receipt screen and just needs to finish. "
        "'done' = finished / close / go home (हो गया, ठीक है, बस, खत्म, হয়ে গেছে, ঠিক আছে, done, "
        "finish, home, ok). 'unknown' if unclear."
    ),
    "review": (
        "The farmer is rating the deal 1-5 stars and may add a short remark. Set 'rating' to the "
        "number of stars they said as a digit 1-5 (पाँच = 5, तीन = 3, চার = 4, 'four stars' = 4), "
        "or 0 if they gave no number. Put any extra remark in 'comment' in the language "
        "they spoke. "
        "'submit' if they gave a rating or clearly want to send it. "
        "'skip' = skip / no thanks / later (छोड़ो, रहने दो, বাদ দাও, skip, later). "
        "'unknown' if unclear."
    ),
    "language": (
        "The farmer is choosing the app language. Set 'language' to 'hi' for Hindi (हिंदी, हिन्दी), "
        "'bn' for Bengali (বাংলা, bangla), 'en' for English. 'select' if they clearly named one "
        "(also set language); otherwise 'unknown' with language ''."
    ),
}


def command_system_prompt(decision: str, intents: list[str], instructions: str) -> str:
    """Build the system prompt for one decision. The strict JSON schema already pins the
    output shape and the `intent` enum; the prompt only describes how to map speech to it."""
    return (
        "You map a farmer's short spoken answer (transcribed from Hindi, Bengali, or English) "
        "to a single decision on the current screen. Return only the JSON object.\n\n"
        f"Allowed intent values: {', '.join(intents)}.\n\n"
        f"{instructions}\n\n"
        "Set 'confidence' 0-1 for how sure you are of the intent. For fields that do not apply "
        "to this decision, use defaults: index -1, rating 0, comment \"\", language \"\". "
        "Judge ONLY from the given answer — never invent a choice the farmer did not make."
    )
