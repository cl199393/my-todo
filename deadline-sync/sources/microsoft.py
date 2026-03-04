"""Sync deadlines from Microsoft Graph (Calendar events + To Do tasks)."""
import logging
from datetime import datetime, timezone, timedelta

import httpx

from auth.microsoft_oauth import get_access_token
from normalizer import from_microsoft_event, from_microsoft_task
import db
import config as cfg_module

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


def _headers() -> dict | None:
    token = get_access_token()
    if not token:
        return None
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


def sync_calendar(client: httpx.Client, headers: dict, lookahead_days: int) -> int:
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=lookahead_days)
    start_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_str = end.strftime("%Y-%m-%dT%H:%M:%SZ")

    url = (
        f"{GRAPH_BASE}/me/calendarView"
        f"?startDateTime={start_str}&endDateTime={end_str}"
        f"&$select=id,subject,end,organizer,bodyPreview,webLink"
        f"&$top=100"
    )
    count = 0
    while url:
        resp = client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        for event in data.get("value", []):
            deadline = from_microsoft_event(event)
            if deadline:
                db.upsert_deadline(deadline)
                count += 1
        url = data.get("@odata.nextLink")
    return count


def sync_todo_tasks(client: httpx.Client, headers: dict) -> int:
    count = 0
    # Get all task lists
    lists_url = f"{GRAPH_BASE}/me/todo/lists"
    resp = client.get(lists_url, headers=headers)
    if resp.status_code != 200:
        logger.warning("Microsoft To Do: could not fetch lists (%s)", resp.status_code)
        return 0

    for task_list in resp.json().get("value", []):
        list_id = task_list["id"]
        tasks_url = (
            f"{GRAPH_BASE}/me/todo/lists/{list_id}/tasks"
            f"?$filter=status ne 'completed'"
            f"&$select=id,title,dueDateTime,body,parentListId"
        )
        while tasks_url:
            r = client.get(tasks_url, headers=headers)
            r.raise_for_status()
            data = r.json()
            for task in data.get("value", []):
                task["parentListId"] = task_list.get("displayName", list_id)
                deadline = from_microsoft_task(task)
                if deadline:
                    db.upsert_deadline(deadline)
                    count += 1
            tasks_url = data.get("@odata.nextLink")
    return count


def sync_all() -> int:
    cfg = cfg_module.load()
    ms_cfg = cfg.get("microsoft", {})
    if ms_cfg.get("client_id", "").startswith("YOUR_"):
        logger.info("Microsoft: skipping (not configured)")
        return 0

    headers = _headers()
    if not headers:
        logger.warning("Microsoft: no valid token; run setup.py --microsoft")
        return 0

    lookahead = cfg.get("sync", {}).get("lookahead_days", 30)
    total = 0

    with httpx.Client(timeout=30) as client:
        try:
            total += sync_calendar(client, headers, lookahead)
        except httpx.HTTPError as e:
            logger.error("Microsoft calendar sync error: %s", e)
            db.log_sync("microsoft", 0, str(e))
            return 0

        try:
            total += sync_todo_tasks(client, headers)
        except httpx.HTTPError as e:
            logger.warning("Microsoft To Do sync error: %s", e)

    db.log_sync("microsoft", total)
    logger.info("Microsoft: synced %d deadlines", total)
    return total
