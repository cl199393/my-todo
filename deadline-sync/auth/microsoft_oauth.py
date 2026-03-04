"""MSAL Device Authorization Grant flow for Microsoft Graph."""
import json
import logging
import os
import sys

import msal

import config as cfg_module

logger = logging.getLogger(__name__)

SCOPES = [
    "Calendars.Read",
    "Tasks.Read",
]

_TOKEN_CACHE_FILE = os.path.join(os.path.dirname(__file__), "ms_token_cache.bin")


def _build_app(cfg: dict) -> msal.PublicClientApplication:
    cache = msal.SerializableTokenCache()
    if os.path.exists(_TOKEN_CACHE_FILE):
        with open(_TOKEN_CACHE_FILE) as f:
            cache.deserialize(f.read())

    app = msal.PublicClientApplication(
        client_id=cfg["client_id"],
        authority=f"https://login.microsoftonline.com/{cfg['tenant_id']}",
        token_cache=cache,
    )
    return app, cache


def _persist_cache(cache: msal.SerializableTokenCache) -> None:
    if cache.has_state_changed:
        with open(_TOKEN_CACHE_FILE, "w") as f:
            f.write(cache.serialize())


def get_access_token() -> str | None:
    cfg = cfg_module.load().get("microsoft", {})
    if cfg.get("client_id", "").startswith("YOUR_"):
        return None

    app, cache = _build_app(cfg)

    accounts = app.get_accounts()
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])
        _persist_cache(cache)
        if result and "access_token" in result:
            return result["access_token"]

    return None


def run_device_flow() -> None:
    """Interactive one-time setup: prints device code, waits for browser auth."""
    cfg = cfg_module.load()
    ms_cfg = cfg.get("microsoft", {})

    app, cache = _build_app(ms_cfg)

    flow = app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        print("Failed to create device flow:", flow.get("error_description"))
        sys.exit(1)

    print("\n" + flow["message"] + "\n")
    result = app.acquire_token_by_device_flow(flow)

    if "access_token" in result:
        _persist_cache(cache)
        print("Microsoft authentication successful!")
    else:
        print("Authentication failed:", result.get("error_description"))
        sys.exit(1)
