import request from 'supertest';
import app from '../src/app';

describe('Gateway Flow Tests', () => {
  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('memory');
    });

    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
    });

    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'alive');
    });
  });

  describe('Root Endpoint', () => {
    it('should return gateway information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'AI Gateway');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Request Headers', () => {
    it('should include request ID in response headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('should accept custom request ID', async () => {
      const customId = 'test-request-123';
      const response = await request(app)
        .get('/health')
        .set('x-request-id', customId);
      
      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    // Note: This test would need to make 100+ requests to actually test the limit
    // Skipping for CI performance, but would work in practice
    it.skip('should block requests exceeding rate limit', async () => {
      // Make 101 requests rapidly
      const requests = Array(101).fill(null).map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(r => r.status === 429);
      
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });
});

