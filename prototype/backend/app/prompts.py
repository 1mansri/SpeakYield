# Deliberately example-free: earlier few-shot versions caused the model to regurgitate the
# first example verbatim (returning "Tomato/sell/50kg" for unrelated buy requests). The strict
# JSON schema already pins the output format, so the prompt only needs to describe the task.
# Verified in Phase 10/11 tuning against real Hindi/Bengali sell and buy transcripts.
INTENT_SYSTEM_PROMPT = """You extract a structured sell/buy draft from a farmer's spoken \
request, transcribed from Hindi, Bengali, or English. The farmer is either selling produce \
or buying farm inputs.

Fields:
- action: "sell" if the farmer wants to sell produce, "buy" if they want to buy farm inputs. \
Infer from verbs like बेचना / বিক্রি / sell versus खरीदना / কিনতে / buy.
- commodity: the produce or input mentioned, in English (e.g. "Tomato", "Urea fertiliser").
- quantity: the number said. 0 if none.
- unit: e.g. "kg", "bag", "quintal". "" if none.
- price: number per unit in rupees. 0 if none.
- location: place name in English. "" if none.
- confidence: 0-1, how sure you are the extraction is correct and complete.

Extract ONLY from the given transcript. Do not use any values from your training or these \
instructions. If the transcript is not a plausible sell/buy request (a greeting, silence, or \
unrelated speech), return empty/zero fields with confidence near 0 — never fabricate a \
plausible-sounding request."""
