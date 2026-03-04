#!/usr/bin/env python3
"""macOS menu bar app for deadlines — uses rumps (no Xcode required)."""
import sys
import os
import sqlite3
import threading
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

import rumps

DB_PATH = os.path.join(os.path.dirname(__file__), "deadlines.db")

SOURCE_LABELS = {
    "canvas_gt":  "GT Canvas",
    "canvas_ucf": "UCF Canvas",
    "microsoft":  "Microsoft",
    "gmail":      "Gmail",
}

SOURCE_ICONS = {
    "canvas_gt":  "🟡",
    "canvas_ucf": "🟡",
    "microsoft":  "🔵",
    "gmail":      "🔴",
}


def fetch_deadlines(days: int = 30) -> list[dict]:
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT * FROM deadlines
            WHERE dismissed = 0
              AND due_at >= datetime('now')
              AND due_at <= datetime('now', ? || ' days')
            ORDER BY due_at ASC
            """,
            (str(days),),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


def relative_time(due_at: str) -> str:
    try:
        due = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
        diff = (due - datetime.now(timezone.utc)).total_seconds()
        if diff < 0:
            return "Overdue"
        d = int(diff // 86400)
        h = int(diff // 3600)
        m = int(diff // 60)
        if d >= 2:
            return f"{d}d"
        if d == 1:
            return "1d"
        if h >= 1:
            return f"{h}h"
        return f"{m}m"
    except Exception:
        return "?"


def format_date(due_at: str) -> str:
    try:
        due = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
        local = due.astimezone()
        return local.strftime("%b %d %I:%M %p")
    except Exception:
        return due_at[:10]


class DeadlineMenuBar(rumps.App):
    def __init__(self):
        super().__init__("📅", quit_button=None)
        self.deadlines = []
        self.refresh_menu()
        # Refresh every 2 minutes
        self._timer = rumps.Timer(self.on_timer, 120)
        self._timer.start()

    def on_timer(self, _):
        self.refresh_menu()

    def refresh_menu(self):
        self.deadlines = fetch_deadlines(30)
        urgent = [d for d in self.deadlines
                  if (datetime.fromisoformat(d["due_at"].replace("Z", "+00:00"))
                      - datetime.now(timezone.utc)).total_seconds() < 86400]

        # Update title
        if urgent:
            self.title = f"📅 {len(urgent)}"
        else:
            self.title = "📅"

        # Rebuild menu
        menu_items = []

        if not self.deadlines:
            menu_items.append(rumps.MenuItem("No upcoming deadlines"))
        else:
            current_date = None
            for d in self.deadlines[:20]:  # cap at 20 items
                # Date section header
                try:
                    due_dt = datetime.fromisoformat(d["due_at"].replace("Z", "+00:00")).astimezone()
                    date_label = due_dt.strftime("%a, %b %d")
                except Exception:
                    date_label = d["due_at"][:10]

                if date_label != current_date:
                    if current_date is not None:
                        menu_items.append(None)  # separator
                    menu_items.append(rumps.MenuItem(f"── {date_label} ──"))
                    current_date = date_label

                icon = SOURCE_ICONS.get(d["source"], "⚪")
                source = SOURCE_LABELS.get(d["source"], d["source"])
                timer = relative_time(d["due_at"])
                title = d["title"][:45] + "…" if len(d["title"]) > 45 else d["title"]
                label = f"{icon} [{timer}] {title}"

                item = rumps.MenuItem(label)
                menu_items.append(item)

        menu_items.append(None)  # separator
        menu_items.append(rumps.MenuItem("Refresh", callback=self.on_refresh))
        menu_items.append(rumps.MenuItem(f"{len(self.deadlines)} deadlines total"))
        menu_items.append(None)
        menu_items.append(rumps.MenuItem("Quit", callback=rumps.quit_application))

        self.menu.clear()
        self.menu = menu_items

    @rumps.clicked("Refresh")
    def on_refresh(self, _):
        self.refresh_menu()

    def schedule_notifications(self):
        """Fire macOS notifications for deadlines due in ~1h or ~1d."""
        import subprocess
        for d in self.deadlines:
            try:
                due = datetime.fromisoformat(d["due_at"].replace("Z", "+00:00"))
                diff = (due - datetime.now(timezone.utc)).total_seconds()
                title_short = d["title"][:50]
                source = SOURCE_LABELS.get(d["source"], d["source"])

                if d["notified_1d"] == 0 and 23 * 3600 <= diff <= 25 * 3600:
                    script = (f'display notification "Due in ~24 hours" '
                              f'with title "Due Tomorrow: {title_short}" '
                              f'subtitle "{source}"')
                    subprocess.run(["osascript", "-e", script], capture_output=True)

                elif d["notified_1h"] == 0 and 55 * 60 <= diff <= 65 * 60:
                    script = (f'display notification "Due in ~1 hour" '
                              f'with title "Due Soon: {title_short}" '
                              f'subtitle "{source}"')
                    subprocess.run(["osascript", "-e", script], capture_output=True)
            except Exception:
                continue


if __name__ == "__main__":
    app = DeadlineMenuBar()
    app.run()
