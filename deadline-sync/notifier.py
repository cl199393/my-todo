"""macOS notifications via osascript."""
import logging
import subprocess

import db

logger = logging.getLogger(__name__)

SOURCE_LABELS = {
    "canvas_gt": "Canvas GT",
    "canvas_ucf": "Canvas UCF",
    "microsoft": "Microsoft",
    "gmail": "Gmail",
}


def _notify(title: str, subtitle: str, body: str) -> None:
    script = (
        f'display notification "{body}" '
        f'with title "{title}" '
        f'subtitle "{subtitle}"'
    )
    try:
        subprocess.run(["osascript", "-e", script], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        logger.warning("osascript notification failed: %s", e.stderr)


def check_and_notify() -> None:
    pending = db.get_pending_notifications()
    for d in pending:
        source_label = SOURCE_LABELS.get(d["source"], d["source"])
        course = d.get("course") or ""
        subtitle = f"{source_label}{' · ' + course if course else ''}"

        # Determine if this is 1d or 1h window
        # get_pending_notifications returns both; figure out which applies
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        due_dt = datetime.fromisoformat(d["due_at"].replace("Z", "+00:00"))
        diff = (due_dt - now).total_seconds()

        if d["notified_1d"] == 0 and 23 * 3600 <= diff <= 25 * 3600:
            _notify(
                title=f"Due Tomorrow: {d['title']}",
                subtitle=subtitle,
                body="Due in about 24 hours",
            )
            db.mark_notified(d["id"], "1d")
            logger.info("1d notification sent: %s", d["title"])

        elif d["notified_1h"] == 0 and 55 * 60 <= diff <= 65 * 60:
            _notify(
                title=f"Due Soon: {d['title']}",
                subtitle=subtitle,
                body="Due in about 1 hour",
            )
            db.mark_notified(d["id"], "1h")
            logger.info("1h notification sent: %s", d["title"])
