import { ServiceBroker } from '../src/gateway/serviceBroker';
import { HttpClient } from '../src/utils/httpClient';
import { GatewayRequest } from '../src/common/types';

// Mock HttpClient
jest.mock('../src/utils/httpClient');

describe('Service Broker Pattern', () => {
  let serviceBroker: ServiceBroker;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    serviceBroker = new ServiceBroker();
    mockHttpClient = new HttpClient('http://localhost:8001', 5000) as jest.Mocked<HttpClient>;
    jest.clearAllMocks();
  });

  const createTestRequest = (): GatewayRequest => ({
    service: 'ai', // Use a real service from apiRegistry
    path: '/test',
    method: 'GET',
    headers: {},
    query: {},
  });

  describe('Successful Requests', () => {
    it('should forward request successfully', async () => {
      const request = createTestRequest();
      const mockResponse = {
        status: 200,
        data: { message: 'success' },
        headers: { 'content-type': 'application/json' },
      };

      mockHttpClient.get = jest.fn().mockResolvedValue(mockResponse);

      const response = await serviceBroker.forward(request);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'success' });
      expect(response.metadata.service).toBe('ai');
      expect(response.metadata.cached).toBe(false);
    });

    it('should track response time', async () => {
      const request = createTestRequest();
      mockHttpClient.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      const response = await serviceBroker.forward(request);

      expect(response.metadata.responseTime).toBeGreaterThan(0);
      expect(typeof response.metadata.responseTime).toBe('number');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure', async () => {
      const request = createTestRequest();
      
      mockHttpClient.get = jest.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          status: 200,
          data: { message: 'success' },
          headers: {},
        });

      const response = await serviceBroker.forward(request);

      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    it('should retry up to max retries', async () => {
      const request = createTestRequest();
      
      mockHttpClient.get = jest.fn().mockRejectedValue(new Error('Service down'));

      await expect(serviceBroker.forward(request)).rejects.toThrow('Service down');

      // Initial attempt + 3 retries = 4 total
      expect(mockHttpClient.get).toHaveBeenCalledTimes(4);
    });

    it('should implement exponential backoff', async () => {
      const request = createTestRequest();
      const timestamps: number[] = [];
      
      mockHttpClient.get = jest.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        return Promise.reject(new Error('Timeout'));
      });

      await expect(serviceBroker.forward(request)).rejects.toThrow();

      // Check delays between attempts
      if (timestamps.length >= 2) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        
        // Second delay should be roughly 2x first delay (exponential)
        // Allow for some timing variance
        expect(delay2).toBeGreaterThan(delay1 * 1.5);
      }
    }, 10000);

    it('should not retry on 4xx client errors', async () => {
      const request = createTestRequest();
      
      const clientError = {
        response: {
          status: 404,
          data: { error: 'Not found' },
        },
        isAxiosError: true,
      };
      
      mockHttpClient.get = jest.fn().mockRejectedValue(clientError);

      await expect(serviceBroker.forward(request)).rejects.toMatchObject(clientError);

      // Should NOT retry on 404
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx server errors', async () => {
      const request = createTestRequest();
      
      const serverError = {
        response: {
          status: 503,
          data: { error: 'Service unavailable' },
        },
        isAxiosError: true,
      };
      
      mockHttpClient.get = jest.fn().mockRejectedValue(serverError);

      await expect(serviceBroker.forward(request)).rejects.toMatchObject(serverError);

      // Should retry on 503 (initial + 3 retries)
      expect(mockHttpClient.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('HTTP Methods', () => {
    it('should handle POST requests', async () => {
      const request: GatewayRequest = {
        service: 'ai',
        path: '/users',
        method: 'POST',
        body: { name: 'John' },
        headers: {},
      };

      mockHttpClient.post = jest.fn().mockResolvedValue({
        status: 201,
        data: { id: 1, name: 'John' },
        headers: {},
      });

      const response = await serviceBroker.forward(request);

      expect(response.status).toBe(201);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        request.path,
        request.body,
        expect.any(Object)
      );
    });

    it('should handle PUT requests', async () => {
      const request: GatewayRequest = {
        service: 'ai',
        path: '/users/1',
        method: 'PUT',
        body: { name: 'Jane' },
        headers: {},
      };

      mockHttpClient.put = jest.fn().mockResolvedValue({
        status: 200,
        data: { id: 1, name: 'Jane' },
        headers: {},
      });

      await serviceBroker.forward(request);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        request.path,
        request.body,
        expect.any(Object)
      );
    });

    it('should handle DELETE requests', async () => {
      const request: GatewayRequest = {
        service: 'ai',
        path: '/users/1',
        method: 'DELETE',
        headers: {},
      };

      mockHttpClient.delete = jest.fn().mockResolvedValue({
        status: 204,
        data: null,
        headers: {},
      });

      await serviceBroker.forward(request);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        request.path,
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown service', async () => {
      const request: GatewayRequest = {
        service: 'nonexistent-service',
        path: '/test',
        method: 'GET',
        headers: {},
      };

      await expect(serviceBroker.forward(request)).rejects.toThrow(
        "Service 'nonexistent-service' not found"
      );
    });

    it('should handle network errors', async () => {
      const request = createTestRequest();
      
      mockHttpClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(serviceBroker.forward(request)).rejects.toThrow('Network error');
    });
  });
});

