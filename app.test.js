// app.test.js
const request = require('supertest');
const app = require('./app');

describe('Simple CI/CD Test Application', () => {
  
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Welcome');
    });

    it('should return version information', async () => {
      const res = await request(app).get('/');
      expect(res.body).toHaveProperty('version');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /ready', () => {
    it('should return ready status', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('GET /api/info', () => {
    it('should return application info', async () => {
      const res = await request(app).get('/api/info');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('application');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('nodejs');
    });
  });

  describe('GET /api/counter', () => {
    it('should increment counter', async () => {
      const res1 = await request(app).get('/api/counter');
      const res2 = await request(app).get('/api/counter');
      expect(res2.body.count).toBeGreaterThan(res1.body.count);
    });
  });

  describe('POST /api/echo', () => {
    it('should echo back the request body', async () => {
      const testData = { test: 'data', number: 123 };
      const res = await request(app)
        .post('/api/echo')
        .send(testData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.received).toEqual(testData);
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});