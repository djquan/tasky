import { generateId, now, type Todo } from '@tasky/shared';
import { todosArray } from './yjs';

export function addTodo(text: string): void {
  const todo: Todo = {
    id: generateId(),
    text,
    completed: false,
    createdAt: now(),
    updatedAt: now()
  };

  todosArray.push([todo]);
}

export function toggleTodo(id: string): void {
  const index = todosArray.toArray().findIndex(t => t.id === id);
  if (index === -1) return;

  const todo = todosArray.get(index);
  todosArray.delete(index, 1);
  todosArray.insert(index, [{
    ...todo,
    completed: !todo.completed,
    updatedAt: now()
  }]);
}

export function deleteTodo(id: string): void {
  const index = todosArray.toArray().findIndex(t => t.id === id);
  if (index === -1) return;

  todosArray.delete(index, 1);
}

export function updateTodoText(id: string, text: string): void {
  const index = todosArray.toArray().findIndex(t => t.id === id);
  if (index === -1) return;

  const todo = todosArray.get(index);
  todosArray.delete(index, 1);
  todosArray.insert(index, [{
    ...todo,
    text,
    updatedAt: now()
  }]);
}

export function getTodos(): Todo[] {
  return todosArray.toArray();
}
