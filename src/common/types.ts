declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: any;
    }
  }
}

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

export interface GatewayRequest {
  service: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}

export interface GatewayResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  metadata: {
    service: string;
    responseTime: number;
    cached: boolean;
  };
}

export interface LogMetadata {
  requestId: string;
  service?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export enum ServiceIntent {
  AI = 'ai',
  DATA = 'data',
  RAG = 'rag',
  UNKNOWN = 'unknown'
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: any; // TODO
  memory: any; // TODO
}

export interface LiveResponse {
  status: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
}