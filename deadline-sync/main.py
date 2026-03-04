#!/usr/bin/env python3
"""Entry point: start FastAPI server + APScheduler."""
import logging
import sys
import os

# Ensure the package root is on sys.path when run as a script
sys.path.insert(0, os.path.dirname(__file__))

import uvicorn

import db
import scheduler as sched_module
from server import app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def main():
    # Initialize database
    db.init_db()
    logger.info("Database ready at %s", db.DB_PATH)

    # Build and start scheduler
    scheduler = sched_module.build_scheduler()
    scheduler.start()
    logger.info("Scheduler started")

    # Run initial sync in background so server comes up immediately
    import threading
    threading.Thread(target=sched_module.run_initial_sync, daemon=True).start()

    import config as cfg_module
    cfg = cfg_module.load()
    server_cfg = cfg.get("server", {})
    host = server_cfg.get("host", "0.0.0.0")
    port = server_cfg.get("port", 8765)

    logger.info("Starting server on %s:%d", host, port)
    uvicorn.run(app, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()
