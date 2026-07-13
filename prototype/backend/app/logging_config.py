import logging


def configure_logging() -> None:
    """Structured-ish console logging so each voice-pipeline stage is visible during a
    live demo (transcribe -> intent -> match -> status). Kept simple: one formatter,
    stdout, INFO level. Not JSON logging — this is a prototype, readable console output
    matters more than machine parsing."""
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)-7s %(name)s | %(message)s", datefmt="%H:%M:%S")
    )
    root = logging.getLogger("speak_yield")
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(handler)
    root.propagate = False
