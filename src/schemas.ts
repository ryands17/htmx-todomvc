import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const TodoSchema = z.object({
  id: z.string().uuid().default(uuidv4()),
  text: z.string().min(1, 'Content is required!'),
  completed: z.boolean().default(false),
});

export const FilterTodosSchema = z.object({
  filter: z
    .enum(['all', 'active', 'completed'])
    .optional()
    .transform((val) => (val ? val : 'all')),
});

export const TodoOperationParamsSchema = z.object({ id: z.string() });

export const ToggleAllTodosSchema = z.object({
  allTodosDone: z
    .enum(['on', 'off'])
    .optional()
    .transform((val) => (val ? val : 'off')),
});

export type Todo = z.infer<typeof TodoSchema>;
