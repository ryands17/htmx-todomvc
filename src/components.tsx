import html from '@kitajs/html';
import { Todo } from './schemas.js';
import { clsx } from 'clsx';

export function BaseHtml({ children }: html.PropsWithChildren) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Express + HTMX</title>
    <link rel="stylesheet" href="/static/index.css" />
    <script src="/static/htmx@1.9.8.js"></script>
    <script src="/static/hyperscript@0.9.12.js"></script>
  </head>
  ${children}
  <script>
    htmx.config.globalViewTransitions = true;
    htmx.config.useTemplateFragments = true;
  </script>
  </html>
`;
}

export function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li
      class={clsx({
        completed: todo.completed,
        editing: false,
      })}
    >
      <div class="view">
        <input
          class="toggle"
          type="checkbox"
          checked={todo.completed}
          hx-post={`/todos/toggle/${todo.id}`}
          hx-target="closest li"
          hx-swap="outerHTML"
        />
        <label safe _="on dblclick add .editing to the closest parent <li/>">
          {todo.text}
        </label>
        <button
          class="destroy"
          hx-delete={`/todos/${todo.id}`}
          hx-target="closest li"
          hx-swap="outerHTML"
        />
      </div>
      <input
        class="edit"
        name="todoText"
        value={todo.text}
        _="on keyup[key is 'Escape'] remove .editing from the closest parent <li/>"
        hx-put={`/todos/${todo.id}`}
        hx-trigger="keyup[keyCode==13]"
        hx-target="closest li"
        hx-swap="outerHTML"
      />
    </li>
  );
}

export function TodoCount({ count }: { count: number }) {
  const todoText = count === 1 ? 'todo' : 'todos';

  return (
    <span hx-swap-oob="innerHTML:#todo-count">
      <strong>{count}</strong> {todoText} left
    </span>
  );
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const allTodosDone = todos.every((todo) => todo.completed);

  return (
    <section class="main">
      <input
        id="toggle-all"
        name="allTodosDone"
        class="toggle-all"
        type="checkbox"
        hx-put="/todos/toggle"
        hx-target=".todo-list"
        hx-swap="innerHTML"
        checked={allTodosDone}
      />
      <label for="toggle-all" />
      <ul class="todo-list">
        {todos.map((todo) => (
          <TodoItem todo={todo} />
        ))}
      </ul>
    </section>
  );
}
