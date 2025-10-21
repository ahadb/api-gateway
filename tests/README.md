# Gateway Test Suite

Comprehensive tests for the AI Gateway covering patterns, integration, and flows.

## Test Files

### `gatewayFlow.test.ts`
Basic gateway functionality tests:
- Health check endpoints
- Request ID generation
- Rate limiting
- Basic routing

**Run:**
```bash
npm test gatewayFlow
```

### `circuitBreaker.test.ts` ⭐ 
**Tests the Circuit Breaker Pattern:**
- ✅ CLOSED → OPEN transition (after 3 failures)
- ✅ OPEN → HALF_OPEN transition (after timeout)
- ✅ HALF_OPEN → CLOSED recovery (successful request)
- ✅ HALF_OPEN → OPEN failure (still broken)
- ✅ Fail-fast behavior when OPEN
- ✅ Failure count reset after success

**Run:**
```bash
npm test circuitBreaker
```

### `serviceBroker.test.ts` ⭐
**Tests the Service Broker & Retry Pattern:**
- ✅ Successful request forwarding
- ✅ Exponential backoff retries (1s, 2s, 4s)
- ✅ Max retry limit (3 retries)
- ✅ Skip retries on 4xx errors
- ✅ Retry on 5xx errors
- ✅ All HTTP methods (GET, POST, PUT, DELETE)
- ✅ Response time tracking

**Run:**
```bash
npm test serviceBroker
```

### `integration.test.ts`
End-to-end integration tests with mock backend:
- Complete request flow
- Circuit breaker with real timing
- Retry logic with actual delays
- Performance characteristics
- Concurrent request handling

**Run:**
```bash
npm test integration
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test circuitBreaker
```

### Specific Test Case
```bash
npm test -- -t "should OPEN circuit after reaching failure threshold"
```

## Test Patterns Covered

### 1. Circuit Breaker Pattern
```
State transitions:
  CLOSED → (5 failures) → OPEN
  OPEN → (60s timeout) → HALF_OPEN
  HALF_OPEN → (success) → CLOSED
  HALF_OPEN → (failure) → OPEN
```

### 2. Retry with Exponential Backoff
```
Attempt 0: Initial request
Attempt 1: Wait 1s, retry
Attempt 2: Wait 2s, retry  
Attempt 3: Wait 4s, retry
Result: Throw error
```

### 3. Fail Fast
```
When circuit is OPEN:
  - No service calls
  - Instant rejection
  - Response time < 10ms
```

## What's Tested vs. What's Not

### ✅ Tested
- Circuit breaker state transitions
- Retry logic and backoff
- Error handling
- HTTP method routing
- Request/response flow
- Failure counting
- Recovery mechanisms

### ⚠️ Partially Tested
- Integration with real services (mocked)
- Timing/performance (basic checks)
- Concurrent requests (skeleton)

### ❌ Not Tested (Yet)
- Database integration
- Redis caching
- Rate limiting under load
- Memory leaks
- Production deployment scenarios

## Best Practices Demonstrated

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test components working together
3. **Mocking** - Mock external dependencies (axios, services)
4. **Timing Tests** - Verify exponential backoff timing
5. **State Machine Tests** - Test all circuit breaker states
6. **Edge Cases** - Test boundaries (exactly 3 failures, timeout edge)

## Adding New Tests

### Test a New Pattern
```typescript
describe('New Pattern', () => {
  beforeEach(() => {
    // Setup
  });

  it('should behave correctly', () => {
    // Test
    expect(result).toBe(expected);
  });
});
```

### Test Async Behavior
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('success');
});
```

### Test with Timing
```typescript
it('should timeout correctly', async () => {
  jest.useFakeTimers();
  
  const promise = delayedFunction();
  jest.advanceTimersByTime(1000);
  
  await expect(promise).resolves.toBe('done');
  
  jest.useRealTimers();
});
```

## CI/CD Integration

These tests can be run in GitHub Actions:
```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm test -- --coverage
```

## Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: Key flows covered
- Pattern tests: 100% state coverage

## Debugging Tests

### Run in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Debug
Use the "Debug Current Test File" configuration in `.vscode/launch.json`

---

**These tests validate that your gateway implements production-grade resilience patterns correctly!** 🎯

