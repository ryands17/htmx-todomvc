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
        <label safe>{todo.text}</label>
        <button
          class="destroy"
          hx-delete={`/todos/${todo.id}`}
          hx-target="closest li"
          hx-swap="outerHTML"
        />
      </div>
      <input class="edit" />
    </li>
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
