import { ServiceConfig } from '../common/types';
import { envConfig } from '../utils/envConfig';

export class ApiRegistry {
  private services: Map<string, ServiceConfig>;

  constructor() {
    this.services = new Map();
    this.registerServices();
  }

  private registerServices(): void {
    // Register AI service
    this.services.set('ai', {
      name: 'AI Service',
      baseUrl: envConfig.aiServiceUrl,
      timeout: 30000, // 30 seconds for AI operations
      retries: 2,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
      },
    });

    // Register Data/BI service
    this.services.set('data', {
      name: 'Data Service',
      baseUrl: envConfig.dataServiceUrl,
      timeout: 10000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000,
      },
    });

    // Register RAG service (can be same as AI or separate)
    this.services.set('rag', {
      name: 'RAG Service',
      baseUrl: envConfig.aiServiceUrl,
      timeout: 20000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
      },
    });
  }

  getService(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  updateService(serviceName: string, config: Partial<ServiceConfig>): void {
    const existing = this.services.get(serviceName);
    if (existing) {
      this.services.set(serviceName, { ...existing, ...config });
    }
  }
}

// Singleton instance
export const apiRegistry = new ApiRegistry();

