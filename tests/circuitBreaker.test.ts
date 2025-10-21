import { CircuitBreaker } from '../src/gateway/requestDispatcher';

describe('Circuit Breaker Pattern', () => {
  let circuitBreaker: CircuitBreaker;
  let mockFunction: jest.Mock;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second reset
    mockFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('CLOSED State (Normal Operation)', () => {
    it('should execute function successfully when circuit is CLOSED', async () => {
      mockFunction.mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should remain CLOSED after a single failure', async () => {
      mockFunction.mockRejectedValue(new Error('Service error'));

      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow('Service error');
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should track multiple failures but stay CLOSED', async () => {
      mockFunction.mockRejectedValue(new Error('Service error'));

      // First failure
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Second failure
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Transition to OPEN State', () => {
    it('should OPEN circuit after reaching failure threshold', async () => {
      mockFunction.mockRejectedValue(new Error('Service down'));

      // Cause 3 failures (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should remember when circuit opened', async () => {
      mockFunction.mockRejectedValue(new Error('Service down'));

      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('OPEN State (Protecting)', () => {
    beforeEach(async () => {
      // Trip the circuit
      mockFunction.mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      }
      jest.clearAllMocks();
    });

    it('should reject requests immediately when OPEN', async () => {
      mockFunction.mockResolvedValue('success'); // Service would work

      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );

      // Should NOT have called the actual function
      expect(mockFunction).not.toHaveBeenCalled();
    });

    it('should fail fast without calling the function', async () => {
      const startTime = Date.now();
      
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );
      
      const duration = Date.now() - startTime;
      
      // Should be nearly instant (< 10ms)
      expect(duration).toBeLessThan(10);
      expect(mockFunction).not.toHaveBeenCalled();
    });
  });

  describe('Transition to HALF_OPEN State', () => {
    beforeEach(async () => {
      // Trip the circuit
      mockFunction.mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      }
      jest.clearAllMocks();
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      // Wait for reset timeout (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100));

      mockFunction.mockResolvedValue('success');

      // Circuit should transition to HALF_OPEN and try the request
      const result = await circuitBreaker.execute(mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should not transition before timeout expires', async () => {
      // Wait less than timeout (500ms < 1000ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );

      expect(mockFunction).not.toHaveBeenCalled();
    });
  });

  describe('Recovery from HALF_OPEN to CLOSED', () => {
    beforeEach(async () => {
      // Trip the circuit and wait for timeout
      mockFunction.mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      }
      await new Promise(resolve => setTimeout(resolve, 1100));
      jest.clearAllMocks();
    });

    it('should close circuit after successful request in HALF_OPEN', async () => {
      mockFunction.mockResolvedValue('success');

      // First request succeeds
      await circuitBreaker.execute(mockFunction);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should allow normal traffic after recovery', async () => {
      mockFunction.mockResolvedValue('success');

      // Recover
      await circuitBreaker.execute(mockFunction);
      
      // Multiple subsequent requests should work
      await circuitBreaker.execute(mockFunction);
      await circuitBreaker.execute(mockFunction);
      
      expect(mockFunction).toHaveBeenCalledTimes(3);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should reopen if HALF_OPEN request fails', async () => {
      mockFunction.mockRejectedValue(new Error('Still down'));

      // Request in HALF_OPEN fails
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow('Still down');
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Next request should fail fast
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );
    });
  });

  describe('Reset After Success', () => {
    it('should reset failure count after successful request', async () => {
      mockFunction.mockRejectedValue(new Error('Error'));
      
      // Two failures
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      
      // Success
      mockFunction.mockResolvedValue('success');
      await circuitBreaker.execute(mockFunction);
      
      // Now need 3 more failures to trip (not 1)
      mockFunction.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('CLOSED'); // Still closed!
      
      await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('OPEN'); // Now opens
    });
  });
});

