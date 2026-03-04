import json
import os

_CFG_PATH = os.path.join(os.path.dirname(__file__), "config.json")


def load() -> dict:
    with open(_CFG_PATH) as f:
        return json.load(f)


def save(cfg: dict) -> None:
    with open(_CFG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)
