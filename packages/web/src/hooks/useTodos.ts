import { useEffect, useState } from 'react';
import type { Todo } from '@tasky/shared';
import { todosArray, waitForSync } from '../lib/yjs';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load after IndexedDB sync
    waitForSync().then(() => {
      setTodos(todosArray.toArray());
      setIsLoading(false);
    });

    // Subscribe to changes
    const observer = () => {
      setTodos(todosArray.toArray());
    };

    todosArray.observe(observer);

    return () => {
      todosArray.unobserve(observer);
    };
  }, []);

  return { todos, isLoading };
}
