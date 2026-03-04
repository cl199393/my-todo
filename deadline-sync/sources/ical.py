"""Poll iCal (.ics) calendar feeds and import events as deadlines."""
import logging
from datetime import datetime, timezone, date

import httpx
from icalendar import Calendar

import db
import config as cfg_module

logger = logging.getLogger(__name__)


def _to_utc_iso(dt_val) -> str | None:
    if dt_val is None:
        return None
    # All-day date → treat as midnight UTC
    if isinstance(dt_val, date) and not isinstance(dt_val, datetime):
        dt_val = datetime(dt_val.year, dt_val.month, dt_val.day, 23, 59, 0, tzinfo=timezone.utc)
    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is None:
            dt_val = dt_val.replace(tzinfo=timezone.utc)
        return dt_val.astimezone(timezone.utc).isoformat()
    return None


def sync_feed(feed: dict, lookahead_days: int) -> int:
    url = feed["url"]
    feed_id = feed["id"]
    name = feed.get("name", feed_id)
    count = 0

    try:
        resp = httpx.get(url, timeout=30, follow_redirects=True)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("iCal %s: fetch error: %s", feed_id, e)
        db.log_sync(feed_id, 0, str(e))
        return 0

    cal = Calendar.from_ical(resp.content)
    now = datetime.now(timezone.utc)

    for component in cal.walk():
        if component.name != "VEVENT":
            continue

        # Use DTEND or DUE as the deadline, fall back to DTSTART
        due_val = (
            component.get("DUE") or
            component.get("DTEND") or
            component.get("DTSTART")
        )
        if due_val is None:
            continue
        due_iso = _to_utc_iso(due_val.dt if hasattr(due_val, "dt") else due_val)
        if not due_iso:
            continue

        # Skip past events
        due_dt = datetime.fromisoformat(due_iso)
        if due_dt < now:
            continue

        summary = str(component.get("SUMMARY", "Untitled"))
        uid = str(component.get("UID", ""))
        url_val = str(component.get("URL", "") or "")
        description = str(component.get("DESCRIPTION", "") or "")

        deadline = {
            "id": f"{feed_id}:{uid}",
            "source": feed_id,
            "source_id": uid,
            "title": summary,
            "course": name,
            "due_at": due_iso,
            "url": url_val or None,
            "notes": description[:500] or None,
        }
        db.upsert_deadline(deadline)
        count += 1

    db.log_sync(feed_id, count)
    logger.info("iCal %s (%s): synced %d deadlines", feed_id, name, count)
    return count


def sync_all() -> int:
    cfg = cfg_module.load()
    feeds = cfg.get("ical_feeds", [])
    lookahead = cfg.get("sync", {}).get("lookahead_days", 30)
    total = 0
    for feed in feeds:
        total += sync_feed(feed, lookahead)
    return total
