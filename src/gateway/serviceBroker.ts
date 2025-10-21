import { AxiosResponse } from 'axios';
import { apiRegistry } from './apiRegistry';
import { HttpClient } from '../utils/httpClient';
import { logger } from '../utils/logger';
import { GatewayRequest, GatewayResponse } from '../common/types';

export class ServiceBroker {
  private clients: Map<string, HttpClient>;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.clients = new Map();
    this.initializeClients();
  };
  

  private initializeClients(): void {
    for (const service of apiRegistry.getAllServices()) {
      const client = new HttpClient(service.baseUrl, service.timeout);
      this.clients.set(service.name.toLowerCase().split(' ')[0], client);
    }
  }

  async forward(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();
    const serviceConfig = apiRegistry.getService(request.service);

    if (!serviceConfig) {
      throw new Error(`Service '${request.service}' not found in registry`);
    }

    const client = this.clients.get(request.service);
    if (!client) {
      throw new Error(`HTTP client for service '${request.service}' not initialized`);
    }

    logger.info(`Forwarding request to ${request.service}`, {
      service: request.service,
      method: request.method,
      path: request.path,
    });

    try {
      const response = await this.executeWithRetry(
        client,
        request,
        serviceConfig.retries || 0
      );

      const responseTime = Date.now() - startTime;

      logger.info(`Request completed successfully`, {
        service: request.service,
        responseTime,
        status: response.status,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
        metadata: {
          service: request.service,
          responseTime,
          cached: false,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error(`Request failed`, {
        service: request.service,
        responseTime,
        error: error.message,
      });
      throw error;
    }
  }

  private async executeWithRetry(
    client: HttpClient,
    request: GatewayRequest,
    maxRetries: number
  ): Promise<AxiosResponse> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRequest(client, request);
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = this.retryDelays[attempt] || 5000;
          logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
            service: request.service,
            error: error.message,
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async executeRequest(
    client: HttpClient,
    request: GatewayRequest
  ): Promise<AxiosResponse> {
    const config = {
      headers: request.headers,
      params: request.query,
    };

    switch (request.method) {
      case 'GET':
        return await client.get(request.path, config);
      case 'POST':
        return await client.post(request.path, request.body, config);
      case 'PUT':
        return await client.put(request.path, request.body, config);
      case 'DELETE':
        return await client.delete(request.path, config);
      case 'PATCH':
        return await client.patch(request.path, request.body, config);
      default:
        throw new Error(`Unsupported HTTP method: ${request.method}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const serviceBroker = new ServiceBroker();

