# Testing Guide

**Version:** 1.0  
**Date:** 2026-01-03  
**Purpose:** Comprehensive guide for testing the SOCIOS_ADMIN application

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

---

## Testing Strategy

### Overview

The SOCIOS_ADMIN project uses a multi-layered testing approach:

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test RPC functions with real database
3. **End-to-End Tests**: Test complete user workflows
4. **Component Tests**: Test React components (future)

### Test Pyramid

```
           /\
          /  \        E2E Tests (few, slow)
         /    \
        /      \    Integration Tests (moderate)
       /        \
      /          \   Unit Tests (many, fast)
     /______________\
           /      \
          /        \    Component Tests (many, fast)
```

### Tools Used

- **Vitest**: Test runner and assertion library
- **Testing Library**: React testing utilities
- **MSW**: API mocking (future)
- **Supabase**: Test database for integration tests

---

## Test Structure

### Directory Layout

```
tests/
├── setup.ts                          # Test configuration and global mocks
├── helpers/                           # Test utilities and helpers
│   ├── supabase-test-client.ts     # Mock Supabase clients
│   └── test-data-factory.ts         # Test data generators
├── actions/                           # Server action tests
│   ├── personas.test.ts               # Person management tests
│   ├── empresas.test.ts               # Company management tests
│   ├── relaciones.test.ts             # Relationship management tests
│   ├── acciones.test.ts               # Club shares tests
│   ├── oportunidades.test.ts          # Opportunity tests
│   └── tareas.test.ts                 # Task tests
├── integration/                       # Integration tests
│   ├── personas-rpc.test.ts          # RPC integration tests
│   ├── empresas-rpc.test.ts          # RPC integration tests
│   └── relaciones-rpc.test.ts        # RPC integration tests
└── e2e/                             # End-to-end tests
    ├── persona-lifecycle.test.ts      # Complete persona workflow
    ├── empresa-lifecycle.test.ts      # Complete empresa workflow
    └── accion-assignment.test.ts     # Action assignment workflow
```

### Test File Naming Convention

- Unit tests: `<module>.test.ts`
- Integration tests: `<module>-rpc.test.ts`
- E2E tests: `<workflow>-lifecycle.test.ts`

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test personas.test.ts
```

### Run Tests in Watch Mode

```bash
npm test --watch
```

### Run Tests with Coverage

```bash
npm test --coverage
```

### Run Tests in Debug Mode

```bash
npm test --debug
```

---

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { actionToTest } from '@/app/actions/module'
import { createMockClientWithData } from '../helpers/supabase-test-client'

// Mock dependencies
vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Module Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('actionToTest', () => {
    it('should succeed with valid data', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData({ id: 'test-123' }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      
      const data = { field: 'value' }

      // Act
      const result = await actionToTest(data)

      // Assert
      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should fail with invalid data', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, { message: 'Error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      
      const data = { field: 'invalid' }

      // Act
      const result = await actionToTest(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error')
    })
  })
})
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@/lib/supabase/server'

describe('Module RPC Integration', () => {
  let testOrgId: string

  beforeAll(async () => {
    // Setup test organization
    const supabase = await createClient()
    const { data } = await supabase
      .from('organizations')
      .insert({ nombre: 'Test Org' })
      .select()
      .single()
    testOrgId = data!.id
  })

  afterAll(async () => {
    // Cleanup test organization
    const supabase = await createClient()
    await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrgId)
  })

  it('should create persona via RPC', async () => {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('crear_persona', {
      p_organizacion_id: testOrgId,
      p_primer_nombre: 'Test',
      p_primer_apellido: 'User',
      p_tipo_documento: 'CC',
      p_numero_documento: '1234567890',
      p_genero: 'masculino',
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.success).toBe(true)
  })
})
```

### E2E Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { crearPersonaFromForm } from '@/app/actions/personas'

describe('Persona Lifecycle E2E', () => {
  it('should complete full persona lifecycle', async () => {
    const supabase = await createClient()
    
    // 1. Create persona
    const createResult = await crearPersonaFromForm({
      organizacionId: 'org-123',
      primerNombre: 'Juan',
      primerApellido: 'Pérez',
      tipoDocumento: 'CC',
      numeroDocumento: '1234567890',
      genero: 'masculino',
    })
    expect(createResult.success).toBe(true)
    
    const personaId = createResult.bp_id!
    
    // 2. Update persona
    const updateResult = await actualizarPersona(personaId, {
      email_principal: 'juan.perez@example.com',
    })
    expect(updateResult.success).toBe(true)
    
    // 3. Delete persona
    const deleteResult = await softDeletePersona(personaId)
    expect(deleteResult.success).toBe(true)
    
    // 4. Verify deletion
    const { data } = await supabase
      .from('personas')
      .select()
      .eq('id', personaId)
      .single()
      
    expect(data?.eliminado_en).toBeDefined()
  })
})
```

---

## Test Coverage

### Coverage Targets

- **Statements:** > 80%
- **Branches:** > 80%
- **Functions:** > 80%
- **Lines:** > 80%

### View Coverage Report

```bash
npm test --coverage
```

Coverage reports are generated in:
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON report
- `coverage/lcov.info` - LCOV format

### Coverage by Module

| Module | Target | Current | Status |
|---------|--------|---------|--------|
| personas.ts | 80% | TBD | ⚠️ |
| empresas.ts | 80% | TBD | ⚠️ |
| relaciones.ts | 80% | TBD | ⚠️ |
| acciones.ts | 80% | TBD | ⚠️ |
| oportunidades.ts | 80% | TBD | ⚠️ |
| tareas.ts | 80% | TBD | ⚠️ |
| admin/organizations.ts | 80% | TBD | ⚠️ |
| admin/members.ts | 80% | TBD | ⚠️ |
| admin/roles.ts | 80% | TBD | ⚠️ |
| admin/permissions.ts | 80% | TBD | ⚠️ |

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Push to main branch
- Pull request updates

### Test Matrix

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest]
```

### Test Results

Results are automatically uploaded as artifacts and can be viewed in the Actions tab.

---

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
❌ Bad: Tests share state
describe('Module', () => {
  let sharedState: any
  
  it('test 1', () => {
    sharedState = { data: 'value' }
  })
  
  it('test 2', () => {
    // Depends on test 1
    expect(sharedState).toBeDefined()
  })
})

✅ Good: Each test is isolated
describe('Module', () => {
  it('test 1', () => {
    const state = { data: 'value' }
    expect(state).toBeDefined()
  })
  
  it('test 2', () => {
    const state = { data: 'value' }
    expect(state).toBeDefined()
  })
})
```

### 2. Descriptive Test Names

```typescript
❌ Bad: Vague names
it('should work', async () => { })
it('test create', async () => { })

✅ Good: Specific names
it('should create persona with valid data', async () => { })
it('should return error when organization not found', async () => { })
```

### 3. Arrange-Act-Assert Pattern

```typescript
✅ Good: Clear sections
it('should create persona', async () => {
  // Arrange
  const mockClient = createMockClient()
  const data = { name: 'Test' }
  
  // Act
  const result = await createPersona(data)
  
  // Assert
  expect(result.success).toBe(true)
})
```

### 4. Test Both Happy and Error Paths

```typescript
✅ Good: Test success and failure cases
describe('createPersona', () => {
  it('should succeed with valid data', async () => { })
  it('should fail with duplicate document', async () => { })
  it('should fail with invalid email', async () => { })
})
```

### 5. Use Test Data Factories

```typescript
✅ Good: Reusable test data
import { createTestPersonFormValues } from '../helpers/test-data-factory'

it('should create persona', async () => {
  const data = createTestPersonFormValues({
    email_principal: 'test@example.com',
  })
  const result = await createPersona(data)
  expect(result.success).toBe(true)
})
```

### 6. Mock External Dependencies

```typescript
✅ Good: Mock all external dependencies
vi.mock('next/cache')
vi.mock('@/lib/supabase/server')
```

### 7. Clean Up After Tests

```typescript
✅ Good: Cleanup in afterAll/afterEach
afterEach(() => {
  vi.clearAllMocks()
})

afterAll(async () => {
  // Cleanup test data
  await cleanupTestData(testOrgId)
})
```

---

## Troubleshooting

### Tests Not Running

1. Check Vitest configuration
2. Ensure test files are in `tests/` directory
3. Verify `package.json` has test script

### Tests Failing

1. Check console output for error messages
2. Review test expectations
3. Verify mock setup
4. Check for async/await issues

### Coverage Not Increasing

1. Verify tests are actually running
2. Check coverage configuration
3. Ensure all code paths are tested
4. Review ignored files in vitest.config.mts

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)
