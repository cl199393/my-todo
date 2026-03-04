"""Search Gmail for deadline-related emails and extract due dates."""
import logging
import base64
import re
import time
from datetime import datetime, timezone

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dateutil.parser import parse as dateparse
from dateutil.relativedelta import relativedelta

from auth.gmail_oauth import get_credentials
from normalizer import from_gmail
import db
import config as cfg_module

logger = logging.getLogger(__name__)

# Patterns that suggest a date follows the keyword
_DATE_PATTERNS = [
    r"\b(?:due|deadline|submit(?:\s+by)?|due\s+by)\s*:?\s*"
    r"(\w+ \d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}|\d{1,2}/\d{1,2}/\d{2,4})",
    r"\b(?:by|before)\s+(\w+ \d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}|\d{1,2}/\d{1,2}/\d{2,4})",
]


def _extract_date_from_text(text: str) -> str | None:
    for pat in _DATE_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                dt = dateparse(m.group(1), fuzzy=True)
                # Reject obviously wrong years
                if abs(dt.year - datetime.now().year) > 2:
                    continue
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat()
            except Exception:
                continue
    return None


def _decode_body(payload: dict) -> str:
    """Recursively extract plain-text body from a Gmail message payload."""
    mime = payload.get("mimeType", "")
    if mime == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    for part in payload.get("parts", []):
        result = _decode_body(part)
        if result:
            return result
    return ""


def sync_all() -> int:
    cfg = cfg_module.load()
    gmail_cfg = cfg.get("gmail", {})
    keywords = gmail_cfg.get("keywords", ["due", "deadline"])

    creds = get_credentials()
    if not creds:
        logger.info("Gmail: skipping (not authenticated; run setup.py --gmail)")
        return 0

    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    query = " OR ".join(f'"{kw}"' for kw in keywords)
    count = 0
    page_token = None

    try:
        while True:
            kwargs = {"userId": "me", "q": query, "maxResults": 50}
            if page_token:
                kwargs["pageToken"] = page_token

            results = service.users().messages().list(**kwargs).execute()
            messages = results.get("messages", [])

            for msg_meta in messages:
                msg_id = msg_meta["id"]
                try:
                    msg = service.users().messages().get(
                        userId="me", id=msg_id, format="full"
                    ).execute()
                except HttpError as e:
                    logger.warning("Gmail: message %s fetch error: %s", msg_id, e)
                    continue

                headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}
                subject = headers.get("Subject", "(no subject)")
                snippet = msg.get("snippet", "")

                # Try to extract date from subject first, then body
                due = _extract_date_from_text(subject) or _extract_date_from_text(
                    _decode_body(msg["payload"])
                )
                if not due:
                    continue

                # Skip past deadlines
                if due < datetime.now(timezone.utc).isoformat():
                    continue

                deadline = from_gmail(subject, due, msg_id, snippet)
                db.upsert_deadline(deadline)
                count += 1

            page_token = results.get("nextPageToken")
            if not page_token or len(messages) < 50:
                break

            time.sleep(0.5)  # quota-aware

    except HttpError as e:
        logger.error("Gmail sync error: %s", e)
        db.log_sync("gmail", count, str(e))
        return count

    db.log_sync("gmail", count)
    logger.info("Gmail: synced %d deadlines", count)
    return count
