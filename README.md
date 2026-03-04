# my-todo

A simple command-line todo app written in Python.

## Usage

```bash
# Add a todo
python todo.py add "Buy groceries"

# List all todos
python todo.py list

# Mark a todo as done
python todo.py done 1

# Delete a todo
python todo.py delete 1
```

## Example

```
$ python todo.py add "Buy groceries"
Added: 1. Buy groceries

$ python todo.py add "Walk the dog"
Added: 2. Walk the dog

$ python todo.py list
  1. [ ] Buy groceries
  2. [ ] Walk the dog

$ python todo.py done 1
Done: 1. Buy groceries

$ python todo.py list
  1. [x] Buy groceries
  2. [ ] Walk the dog

$ python todo.py delete 1
Deleted todo 1.
```

## Data

Todos are stored locally in `todos.json`.
