"""Google OAuth2 installed-app flow for Gmail."""
import logging
import os
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

import config as cfg_module

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def _resolve(path: str) -> str:
    if not os.path.isabs(path):
        return os.path.join(os.path.dirname(os.path.dirname(__file__)), path)
    return path


def get_credentials():
    cfg = cfg_module.load().get("gmail", {})
    creds_file = _resolve(cfg.get("credentials_file", "./auth/credentials.json"))
    token_file = _resolve(cfg.get("token_file", "./auth/token.json"))

    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_file, "w") as f:
                f.write(creds.to_json())
            return creds
        except Exception as e:
            logger.warning("Gmail token refresh failed: %s", e)

    return None


def run_oauth_flow() -> None:
    """Interactive one-time browser consent flow."""
    cfg = cfg_module.load().get("gmail", {})
    creds_file = _resolve(cfg.get("credentials_file", "./auth/credentials.json"))
    token_file = _resolve(cfg.get("token_file", "./auth/token.json"))

    if not os.path.exists(creds_file):
        print(f"Gmail credentials file not found: {creds_file}")
        print("Download it from Google Cloud Console → APIs & Services → Credentials")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(token_file, "w") as f:
        f.write(creds.to_json())

    print("Gmail authentication successful!")
