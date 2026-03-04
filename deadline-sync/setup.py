#!/usr/bin/env python3
"""One-time setup script: guided auth configuration."""
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))


def main():
    parser = argparse.ArgumentParser(description="Deadline Sync setup")
    parser.add_argument("--microsoft", action="store_true", help="Authenticate Microsoft account")
    parser.add_argument("--gmail", action="store_true", help="Authenticate Gmail account")
    parser.add_argument("--all", action="store_true", help="Run all auth flows")
    args = parser.parse_args()

    if args.all or args.microsoft:
        print("\n=== Microsoft Authentication ===")
        from auth.microsoft_oauth import run_device_flow
        run_device_flow()

    if args.all or args.gmail:
        print("\n=== Gmail Authentication ===")
        from auth.gmail_oauth import run_oauth_flow
        run_oauth_flow()

    if not any([args.all, args.microsoft, args.gmail]):
        parser.print_help()
        print("\nAfter auth, edit config.json to add your Canvas API tokens.")


if __name__ == "__main__":
    main()
