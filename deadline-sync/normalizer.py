"""Convert raw API responses into the unified deadline dict."""
from datetime import datetime, timezone
from typing import Optional


def _parse_iso(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).isoformat()
    except ValueError:
        return None


def from_canvas(raw: dict, instance_id: str) -> Optional[dict]:
    due = _parse_iso(raw.get("due_at"))
    if not due:
        return None
    sid = str(raw.get("id", ""))
    return {
        "id": f"{instance_id}:{sid}",
        "source": instance_id,
        "source_id": sid,
        "title": raw.get("name", "Untitled"),
        "course": raw.get("context_name") or raw.get("course_id"),
        "due_at": due,
        "url": raw.get("html_url"),
        "notes": raw.get("description"),
    }


def from_microsoft_event(raw: dict) -> Optional[dict]:
    end = raw.get("end", {})
    due_str = end.get("dateTime")
    if not due_str:
        return None
    tz_str = end.get("timeZone", "UTC")
    # Normalize: Graph returns local-time strings with a separate tz field
    try:
        from dateutil import tz as dateutil_tz
        from dateutil.parser import parse as dateparse
        dt = dateparse(due_str)
        zone = dateutil_tz.gettz(tz_str) or dateutil_tz.UTC
        dt = dt.replace(tzinfo=zone).astimezone(timezone.utc)
        due = dt.isoformat()
    except Exception:
        due = _parse_iso(due_str)
    if not due:
        return None
    sid = raw.get("id", "")
    return {
        "id": f"microsoft:{sid}",
        "source": "microsoft",
        "source_id": sid,
        "title": raw.get("subject", "Untitled"),
        "course": raw.get("organizer", {}).get("emailAddress", {}).get("name"),
        "due_at": due,
        "url": raw.get("webLink"),
        "notes": raw.get("bodyPreview"),
    }


def from_microsoft_task(raw: dict) -> Optional[dict]:
    due_str = raw.get("dueDateTime", {})
    if isinstance(due_str, dict):
        due_str = due_str.get("dateTime")
    due = _parse_iso(due_str)
    if not due:
        return None
    sid = raw.get("id", "")
    return {
        "id": f"microsoft_task:{sid}",
        "source": "microsoft",
        "source_id": sid,
        "title": raw.get("title", "Untitled"),
        "course": raw.get("parentListId"),
        "due_at": due,
        "url": None,
        "notes": raw.get("body", {}).get("content") if isinstance(raw.get("body"), dict) else None,
    }


def from_gmail(subject: str, due: str, msg_id: str, snippet: str = "") -> dict:
    return {
        "id": f"gmail:{msg_id}",
        "source": "gmail",
        "source_id": msg_id,
        "title": subject,
        "course": None,
        "due_at": due,
        "url": f"https://mail.google.com/mail/u/0/#inbox/{msg_id}",
        "notes": snippet,
    }
