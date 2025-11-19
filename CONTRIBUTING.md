# Contributing to Tasky

Thank you for your interest in contributing to Tasky! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful, constructive, and professional in all interactions. We're here to build great software together.

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/tasky.git
cd tasky

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at http://localhost:8090

### Project Structure

```
tasky/
├── packages/
│   ├── shared/        # Shared types and utilities
│   ├── web/           # React PWA application
│   └── server/        # Y-Sweet sync server (optional)
├── ARCHITECTURE.md    # Architecture documentation
└── AGENTS.md          # Development guide
```

## Development Workflow

### Creating a Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/bug-description

# For documentation
git checkout -b docs/what-you-are-documenting
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests for specific file
pnpm test -- TaskRow.test.tsx

# Run with coverage
pnpm test -- --coverage
```

### Type Checking

```bash
# Check all packages
pnpm type-check
```

### Linting

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
pnpm lint --fix
```

## Code Standards

### TypeScript

- **Use strict mode**: All packages use strict TypeScript
- **Explicit types**: Prefer explicit types over `any`
- **Interfaces over types**: Use `interface` for object shapes
- **No unused imports**: Clean up unused code
- **Consistent naming**:
  - PascalCase for components and types
  - camelCase for functions and variables
  - UPPER_SNAKE_CASE for constants

### React

- **Functional components**: Use function components with hooks
- **Memoization**: Use React.memo for expensive components
- **Custom hooks**: Extract reusable logic into custom hooks
- **Props destructuring**: Destructure props in function signature
- **No inline styles**: Use Tailwind classes

Example:

```typescript
interface TaskRowProps {
  task: Task;
  allTaskIds: string[];
}

export const TaskRow = memo(({ task, allTaskIds }: TaskRowProps) => {
  const handleClick = useCallback(() => {
    // ...
  }, [task.id]);

  return <div onClick={handleClick}>{task.title}</div>;
});
```

### Yjs Integration

**Critical Rules**:

1. **Never mutate entity objects directly**
2. **Always use `map.set()` and `map.delete()`**
3. **Use `observe()` and `unobserve()` for reactivity**
4. **Wait for `waitForSync()` before initial render**

```typescript
// ❌ Bad - Direct mutation
task.title = "New Title";

// ✅ Good - Yjs set operation
tasksMap.set(id, { ...task, title: "New Title", updatedAt: now() });
```

### Error Handling

Use centralized error handling:

```typescript
import { handleOperationError } from './errorHandler';

try {
  // operation
} catch (error) {
  handleOperationError('operationName', error, {
    entityType: 'task',
    entityId: id,
  });
}
```

### Performance

- **Memoize expensive computations**: Use `useMemo`
- **Memoize callbacks**: Use `useCallback`
- **Avoid unnecessary re-renders**: Use React.memo
- **Lazy load heavy components**: Use `React.lazy()`

## Testing

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should do something specific', () => {
    // Arrange
    const props = { ... };

    // Act
    renderWithProviders(<Component {...props} />);

    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Testing Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names** (should/when pattern)
3. **One assertion per test** (when possible)
4. **Mock external dependencies**
5. **Use test utilities** (`createMockTask`, `renderWithProviders`)

### Coverage Requirements

- Lines: 60%
- Functions: 75%
- Branches: 55%
- Statements: 60%

Aim to maintain or improve coverage with new code.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(tasks): add bulk delete functionality"

# Bug fix
git commit -m "fix(sync): handle connection timeout errors"

# Documentation
git commit -m "docs: update architecture documentation"

# Refactoring
git commit -m "refactor(filters): extract common filter logic"
```

### Commit Body

For non-trivial changes, include a body:

```
feat(tasks): add recurring task support

Adds ability to create recurring tasks with various intervals
(daily, weekly, monthly). Recurring tasks automatically create
new instances when completed.

Closes #123
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**: `pnpm test`
2. **Check types**: `pnpm type-check`
3. **Lint your code**: `pnpm lint`
4. **Update documentation** if needed
5. **Add tests** for new features

### PR Title

Use the same format as commit messages:

```
feat(tasks): add bulk operations support
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. Submit PR for review
2. Address reviewer feedback
3. Maintain clean commit history (squash if needed)
4. Wait for approval from maintainer
5. PR will be merged by maintainer

## Adding New Features

### 1. Plan Your Change

- Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- Check existing issues
- Discuss major changes in an issue first

### 2. Implement

Follow this pattern for new entities:

```typescript
// 1. Add type to packages/shared/src/types.ts
export interface NewEntity {
  id: string;
  // ... fields
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

// 2. Add Yjs map in packages/web/src/lib/yjs.ts
export const newEntityMap = doc.getMap<NewEntity>('newEntities');

// 3. Create CRUD operations in packages/web/src/lib/newEntities.ts
export function createNewEntity(input: NewEntityInput): NewEntity { ... }

// 4. Add hook in packages/web/src/hooks/useEntities.ts
export function useNewEntities() { ... }

// 5. Add tests in packages/web/src/lib/newEntities.test.ts
```

### 3. Test

- Write unit tests for logic
- Write component tests for UI
- Test offline behavior
- Test sync behavior (if applicable)

### 4. Document

- Add JSDoc to public functions
- Update ARCHITECTURE.md if needed
- Update README.md if user-facing

## Common Pitfalls

### ❌ Don't

```typescript
// Direct mutation
task.completed = true;

// Forgetting updatedAt
tasksMap.set(id, { ...task, completed: true });

// Missing cleanup
useEffect(() => {
  tasksMap.observe(observer);
  // Missing: return () => tasksMap.unobserve(observer);
}, []);
```

### ✅ Do

```typescript
// Proper Yjs update
tasksMap.set(id, {
  ...task,
  completed: true,
  updatedAt: now()
});

// Proper effect cleanup
useEffect(() => {
  const observer = () => { ... };
  tasksMap.observe(observer);
  return () => tasksMap.unobserve(observer);
}, []);
```

## Getting Help

- **Documentation**: Check [ARCHITECTURE.md](./ARCHITECTURE.md) and [AGENTS.md](./AGENTS.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Recognition

Contributors will be recognized in the project README. Thank you for making Tasky better!
