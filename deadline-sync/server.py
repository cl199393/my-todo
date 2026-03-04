"""FastAPI REST endpoints."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import db
import scheduler as sched_module

app = FastAPI(title="Deadline Sync", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "synced_at": db.last_synced_at()}


@app.get("/deadlines")
def get_deadlines(days: int = 30):
    return db.get_upcoming(days)


@app.post("/sync")
def trigger_sync():
    import threading
    thread = threading.Thread(target=sched_module.run_initial_sync, daemon=True)
    thread.start()
    return {"status": "sync started"}


@app.post("/deadlines/{deadline_id}/dismiss")
def dismiss(deadline_id: str):
    found = db.dismiss_deadline(deadline_id)
    if not found:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return {"status": "dismissed"}
