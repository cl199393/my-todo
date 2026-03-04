import argparse
import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "todos.json")


def load_todos():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)


def save_todos(todos):
    with open(DATA_FILE, "w") as f:
        json.dump(todos, f, indent=2)


def next_id(todos):
    return max((t["id"] for t in todos), default=0) + 1


def cmd_add(args):
    todos = load_todos()
    todo = {"id": next_id(todos), "text": args.text, "done": False}
    todos.append(todo)
    save_todos(todos)
    print(f"Added: {todo['id']}. {todo['text']}")


def cmd_list(args):
    todos = load_todos()
    if not todos:
        print("No todos yet.")
        return
    for t in todos:
        mark = "x" if t["done"] else " "
        print(f"  {t['id']}. [{mark}] {t['text']}")


def cmd_done(args):
    todos = load_todos()
    for t in todos:
        if t["id"] == args.id:
            t["done"] = True
            save_todos(todos)
            print(f"Done: {t['id']}. {t['text']}")
            return
    print(f"No todo with id {args.id}.")


def cmd_delete(args):
    todos = load_todos()
    remaining = [t for t in todos if t["id"] != args.id]
    if len(remaining) == len(todos):
        print(f"No todo with id {args.id}.")
        return
    save_todos(remaining)
    print(f"Deleted todo {args.id}.")


def main():
    parser = argparse.ArgumentParser(description="Simple CLI todo app")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="Add a new todo")
    p_add.add_argument("text", help="Todo text")
    p_add.set_defaults(func=cmd_add)

    p_list = sub.add_parser("list", help="List all todos")
    p_list.set_defaults(func=cmd_list)

    p_done = sub.add_parser("done", help="Mark a todo as done")
    p_done.add_argument("id", type=int, help="Todo ID")
    p_done.set_defaults(func=cmd_done)

    p_del = sub.add_parser("delete", help="Delete a todo")
    p_del.add_argument("id", type=int, help="Todo ID")
    p_del.set_defaults(func=cmd_delete)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
