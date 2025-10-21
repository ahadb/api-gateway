import { Request, Response } from 'express';
import { serviceBroker } from './serviceBroker';
import { GatewayRequest } from '../common/types';
import { logger } from '../utils/logger';

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number,
    private resetTimeout: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker CLOSED');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker OPEN after ${this.failures} failures`);
    }
  }

  getState(): string {
    return this.state;
  }
}

export class RequestDispatcher {
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor() {
    this.circuitBreakers = new Map();
  }

  private getCircuitBreaker(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(
        service,
        new CircuitBreaker(2, 60000) // 5 failures, 60 second reset
      );
    }
    return this.circuitBreakers.get(service)!;
  }

  async dispatch(req: Request, res: Response, service: string): Promise<void> {
    const circuitBreaker = this.getCircuitBreaker(service);

    const gatewayRequest: GatewayRequest = {
      service,
      path: req.path.replace(`/api/${service}`, ''),
      method: req.method as any,
      headers: req.headers as Record<string, string>,
      body: req.body,
      query: req.query as Record<string, string>,
    };

    try {
      const response = await circuitBreaker.execute(() =>
        serviceBroker.forward(gatewayRequest)
      );

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add metadata headers
      res.setHeader('X-Gateway-Service', response.metadata.service);
      res.setHeader('X-Gateway-Response-Time', response.metadata.responseTime.toString());

      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Request dispatch failed', {
        service,
        error: error.message,
        circuitState: circuitBreaker.getState(),
      });

      if (error.message === 'Circuit breaker is OPEN') {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Circuit breaker is open',
        });
      } else if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  }
}

// Singleton instance
export const requestDispatcher = new RequestDispatcher();

