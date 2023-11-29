import html from '@kitajs/html';
import express from 'express';
import * as schemas from './schemas.js';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';
import { BaseHtml, TodoCount, TodoItem, TodoList } from './components.js';
import { TodoModel } from './model.js';

const NAMESPACE = 'default';

async function fetchRemainingTodoCount() {
  const remainingTodos = await TodoModel.query
    .todos({ namespace: NAMESPACE })
    .where((attr, op) => op.eq(attr.completed, false))
    .go();

  return remainingTodos.data.length;
}

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static('./public'));

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
                hx-post="/todos"
                hx-trigger="keyup[keyCode==13]"
                hx-target=".todo-list"
                _="on htmx:afterOnLoad set target.value to ''"
                hx-swap="beforeend"
              />
            </header>
            <footer
              class="footer"
              // hx-trigger="load, todoUpdate from:body"
            >
              <span id="todo-count" class="todo-count" />
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

app.get('/todos', async (req, res) => {
  const { filter } = schemas.FilterTodosSchema.parse(req.query);
  const remainingTodoCount = await fetchRemainingTodoCount();

  switch (filter) {
    case 'all': {
      const { data } = await TodoModel.query
        .todos({ namespace: NAMESPACE })
        .go();

      return res.send(
        <>
          <TodoList todos={data} />
          <TodoCount count={remainingTodoCount} />
        </>,
      );
    }
    case 'active': {
      const { data } = await TodoModel.query
        .todos({ namespace: NAMESPACE })
        .where((attr, op) => op.eq(attr.completed, false))
        .go();

      return res.send(
        <>
          <TodoList todos={data} />
          <TodoCount count={remainingTodoCount} />
        </>,
      );
    }
    case 'completed': {
      const { data } = await TodoModel.query
        .todos({ namespace: NAMESPACE })
        .where((attr, op) => op.eq(attr.completed, true))
        .go();

      return res.send(
        <>
          <TodoList todos={data} />
          <TodoCount count={remainingTodoCount} />
        </>,
      );
    }
  }
});

app.post('/todos', async (req, res) => {
  const todo = schemas.TodoSchema.parse(req.body);

  await TodoModel.create(todo).go();
  const remainingTodoCount = await fetchRemainingTodoCount();

  res.send(
    <>
      <TodoItem todo={todo} />
      <TodoCount count={remainingTodoCount} />
    </>,
  );
});

app.post('/todos/toggle/:id', async (req, res) => {
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  const { data: todo } = await TodoModel.get({
    namespace: NAMESPACE,
    id: params.id,
  }).go();

  if (todo) {
    await TodoModel.patch({ namespace: NAMESPACE, id: params.id })
      .set({ completed: !todo.completed })
      .go();

    todo.completed = !todo.completed;
    const remainingTodoCount = await fetchRemainingTodoCount();

    res.send(
      <>
        <TodoItem todo={todo} />
        <TodoCount count={remainingTodoCount} />
      </>,
    );
  }
});

app.put('/todos/toggle', async (req, res) => {
  const body = schemas.ToggleAllTodosSchema.parse(req.body);
  const { data: allTodos } = await TodoModel.query
    .todos({ namespace: NAMESPACE })
    .go();

  const todos = allTodos.map((todo) => ({
    ...todo,
    completed: body.allTodosDone === 'on',
  }));

  await TodoModel.put(todos).go();

  const remainingTodoCount = await fetchRemainingTodoCount();

  // res.setHeader('HX-Trigger', 'todoUpdate');
  res.send(
    <>
      <TodoList todos={todos} />
      <TodoCount count={remainingTodoCount} />
    </>,
  );
});

app.put('/todos/:id', async (req, res) => {
  const { todoText } = schemas.EditTodoSchema.parse(req.body);
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  const { data: todo } = await TodoModel.get({
    namespace: NAMESPACE,
    id: params.id,
  }).go();

  if (todo) {
    await TodoModel.patch({ namespace: NAMESPACE, id: params.id })
      .set({ text: todoText })
      .go();

    todo.text = todoText;
    res.send(<TodoItem todo={todo} />);
  }
});

// deleting a todo
app.post(`/todos/:id`, async (req, res) => {
  const params = schemas.TodoOperationParamsSchema.parse(req.params);

  await TodoModel.delete({ namespace: NAMESPACE, id: params.id }).go();
  const remainingTodoCount = await fetchRemainingTodoCount();

  res.send(<TodoCount count={remainingTodoCount} />);
});

app.put('/clear-completed', async (_req, res) => {
  const { data: completedTodos } = await TodoModel.query
    .todos({ namespace: NAMESPACE })
    .where((attr, op) => op.eq(attr.completed, true))
    .go();

  await TodoModel.delete(
    completedTodos.map((todo) => ({ namespace: NAMESPACE, id: todo.id })),
  ).go();

  const { data: todos } = await TodoModel.query
    .todos({ namespace: NAMESPACE })
    .where((attr, op) => op.eq(attr.completed, false))
    .go();

  res.send(<TodoList todos={todos} />);
});
