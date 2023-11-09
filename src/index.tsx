import html from '@kitajs/html';
import express from 'express';
import * as schemas from './schemas.js';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';
import { BaseHtml, TodoItem, TodoList } from './components.js';

const db: schemas.Todo[] = [
  { id: uuidv4(), text: 'Learn HTMX', completed: false },
  { id: uuidv4(), text: 'Learn Vim', completed: true },
];

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static('./public'));

const PORT = 3000;
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));

app.get('/', (req, res) => {
  const { filter } = schemas.FilterTodosSchema.parse(req.query);

  const main = (
    <BaseHtml>
      <body
        hx-get={`/todos?filter=${filter}`}
        hx-trigger="load"
        hx-target=".header"
        hx-swap="afterend"
      >
        <div>
          <section class="todoapp">
            <header class="header">
              <h1>todos + HTMX</h1>
              <input
                class="new-todo"
                name="text"
                placeholder="What needs to be done?"
                autofocus="true"
                hx-post="/todo"
                hx-trigger="keyup[keyCode==13]"
                hx-target=".todo-list"
                _="on htmx:afterOnLoad set target.value to ''"
                hx-swap="beforeend"
              />
            </header>
            <footer
              class="footer"
              hx-get="/count"
              hx-trigger="load, todoUpdate from:body"
              hx-target=".todo-count"
              hx-swap="innerHTML"
            >
              <span class="todo-count" />
              <ul class="filters">
                <li>
                  <a href="/" class={clsx({ selected: filter === 'all' })}>
                    All
                  </a>
                </li>
                <li>
                  <a
                    href="/?filter=active"
                    class={clsx({ selected: filter === 'active' })}
                  >
                    Active
                  </a>
                </li>
                <li>
                  <a
                    href="/?filter=completed"
                    class={clsx({ selected: filter === 'completed' })}
                  >
                    Completed
                  </a>
                </li>
              </ul>
              <button
                class="clear-completed"
                hx-put="/clear-completed"
                hx-target=".main"
                hx-swap="outerHTML"
              >
                Clear completed
              </button>
            </footer>
          </section>
          <footer class="info">
            <p>Double-click to edit a todo</p>
            <p>
              Created by <a href="http://github.com/ryands17/">ryandsouza</a>
            </p>
            <p>
              Part of <a href="http://todomvc.com">TodoMVC</a>
            </p>
          </footer>
        </div>
      </body>
    </BaseHtml>
  );

  res.send(main);
});

app.get('/todos', (req, res) => {
  const { filter } = schemas.FilterTodosSchema.parse(req.query);

  switch (filter) {
    case 'all':
      return res.send(<TodoList todos={db} />);
    case 'active': {
      const todos = db.filter((todo) => !todo.completed);
      return res.send(<TodoList todos={todos} />);
    }
    case 'completed': {
      const todos = db.filter((todo) => todo.completed);
      return res.send(<TodoList todos={todos} />);
    }
  }
});

app.get('/count', (_req, res) => {
  const uncheckedTodoCount = db.filter((todo) => !todo.completed).length;
  const todoText = uncheckedTodoCount === 1 ? 'todo' : 'todos';

  res.send(
    <span>
      <strong>{uncheckedTodoCount}</strong> {todoText} left
    </span>,
  );
});

app.post('/todos/toggle/:id', (req, res) => {
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  const todo = db.find((val) => val.id === params.id);

  if (todo) {
    todo.completed = !todo.completed;

    res.setHeader('HX-Trigger', 'todoUpdate');
    res.send(<TodoItem todo={todo} />);
  }
});

app.put('/todos/:id', (req, res) => {
  const { todoText } = schemas.EditTodoSchema.parse(req.body);
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  const todo = db.find((val) => val.id === params.id);
  if (todo) {
    todo.text = todoText;
    res.send(<TodoItem todo={todo} />);
  }
});

app.delete(`/todos/:id`, (req, res) => {
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  const todoIndex = db.findIndex((val) => val.id === params.id);
  if (todoIndex !== -1) {
    db.splice(todoIndex, 1);
  }
  res.setHeader('HX-Trigger', 'todoUpdate');
  res.send();
});

app.post('/todo', (req, res) => {
  const todo = schemas.TodoSchema.parse(req.body);
  db.push(todo);

  res.setHeader('HX-Trigger', 'todoUpdate');
  res.send(<TodoItem todo={todo} />);
});

app.put('/todos/toggle', (req, res) => {
  const body = schemas.ToggleAllTodosSchema.parse(req.body);

  db.forEach((todo) => {
    todo.completed = body.allTodosDone === 'on' ? true : false;
  });

  res.setHeader('HX-Trigger', 'todoUpdate');
  res.send(<TodoList todos={db} />);
});

app.put('/clear-completed', (_req, res) => {
  const todos = db.filter((todo) => !todo.completed);

  res.setHeader('HX-Trigger', 'todoUpdate');
  res.send(<TodoList todos={todos} />);
});
