# API Gateway - Priority TODOs

## 🔴 P0 - Critical (Do First)

### 1. Deploy Gateway
**Status:** ❌ Not Started  
**Effort:** 2 hours  
**Impact:** High - Get it live for portfolio/testing

**Tasks:**
- [ ] Create Railway/Render account
- [ ] Configure environment variables
- [ ] Deploy gateway service
- [ ] Test live endpoint
- [ ] Update README with live URL

**Files Needed:**
- `railway.json` or `render.yaml` (deployment config)
- Environment variables in platform

**Deployment Checklist:**
```bash
# Railway
railway login
railway init
railway up

# OR Render
# Connect GitHub repo
# Set environment variables
# Deploy
```

---

### 2. Build AI Service (Backend)
**Status:** ❌ Not Started  
**Effort:** 1 week  
**Impact:** Critical - Gateway needs services to route to

**Tasks:**
- [ ] Set up FastAPI project
- [ ] Create `/nlp-to-sql` endpoint (OpenAI integration)
- [ ] Create `/generate` endpoint (text generation)
- [ ] Create `/embed` endpoint (embeddings)
- [ ] Add health check endpoint
- [ ] Deploy AI service
- [ ] Update gateway `AI_SERVICE_URL` in `.env`

**Project Structure:**
```
ai-service/
├── main.py                 # FastAPI app
├── routers/
│   ├── nlp.py             # NLP-to-SQL
│   ├── generate.py        # Text generation
│   └── embed.py           # Embeddings
├── services/
│   └── openai_client.py   # OpenAI wrapper
├── requirements.txt
└── Dockerfile
```

**Key Dependencies:**
```
fastapi
uvicorn
openai
sqlalchemy
pydantic
```

---

## 🟡 P1 - High Priority (Do Soon)

### 3. Add Authentication
**Status:** ⚠️ Stub Only  
**Effort:** 2-3 days  
**Impact:** High - Required for production

**Tasks:**
- [ ] Implement JWT token verification
- [ ] Create API key system
- [ ] Store API keys in database/Redis
- [ ] Add `req.user` to request context
- [ ] Apply auth to `/api/*` routes
- [ ] Create `/auth/login` endpoint (optional)
- [ ] Create `/auth/register` endpoint (optional)

**Files to Change:**
```typescript
// src/middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

**New Dependencies:**
```bash
npm install jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

**Apply to Routes:**
```typescript
// src/gateway/router.ts
import { authMiddleware } from '../middleware/authMiddleware';

// Protect API routes
gatewayRouter.use('/api', authMiddleware);
```

---

### 4. Add Metrics Endpoint
**Status:** ❌ Not Started  
**Effort:** 1-2 days  
**Impact:** High - Essential for production monitoring

**Tasks:**
- [ ] Install `prom-client`
- [ ] Create metrics service
- [ ] Track request counters
- [ ] Track response time histograms
- [ ] Track circuit breaker states
- [ ] Expose `GET /metrics` endpoint
- [ ] Add Grafana dashboard (optional)

**Implementation:**

**New File:** `src/utils/metrics.ts`
```typescript
import promClient from 'prom-client';

// Create registry
export const register = new promClient.Registry();

// Request counter
export const requestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'status'],
  registers: [register]
});

// Response time histogram
export const responseTimeHistogram = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration',
  labelNames: ['service', 'method'],
  registers: [register]
});

// Circuit breaker state
export const circuitBreakerGauge = new promClient.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['service'],
  registers: [register]
});
```

**New File:** `src/routes/metricsRouter.ts`
```typescript
import { Router } from 'express';
import { register } from '../utils/metrics';

export const metricsRouter = Router();

metricsRouter.get('/', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

**Dependencies:**
```bash
npm install prom-client
```

---

### 5. Redis Caching
**Status:** ❌ Not Started  
**Effort:** 2-3 days  
**Impact:** High - Massive performance improvement

**Tasks:**
- [ ] Install `ioredis`
- [ ] Create Redis connection service
- [ ] Implement cache middleware
- [ ] Cache GET requests
- [ ] Add cache invalidation
- [ ] Move rate limiting to Redis
- [ ] Update docker-compose with Redis

**Implementation:**

**New File:** `src/services/redis.ts`
```typescript
import Redis from 'ioredis';
import { envConfig } from '../utils/envConfig';

export const redis = new Redis(envConfig.redisUrl);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});
```

**New File:** `src/middleware/cacheMiddleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis';
import crypto from 'crypto';

export const cacheMiddleware = (ttl: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = `cache:${req.path}:${crypto
      .createHash('md5')
      .update(JSON.stringify(req.query))
      .digest('hex')}`;

    try {
      // Check cache
      const cached = await redis.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Intercept response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Cache the response
        redis.setex(key, ttl, JSON.stringify(body));
        return originalJson(body);
      };

      next();
    } catch (error) {
      // If cache fails, continue without it
      next();
    }
  };
};
```

**Update Rate Limiter:**
```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../services/redis';

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 60000,
  max: 100,
});
```

**Dependencies:**
```bash
npm install ioredis rate-limit-redis
npm install --save-dev @types/ioredis
```

**Update `.env`:**
```bash
REDIS_URL=redis://localhost:6379
```

---

## 📋 Quick Start Checklist

### Week 1: Get It Live
- [ ] Deploy gateway to Railway/Render
- [ ] Create basic FastAPI AI service
- [ ] Deploy AI service
- [ ] Test end-to-end flow
- [ ] Update README with live URLs

### Week 2: Production Readiness
- [ ] Add JWT authentication
- [ ] Implement Redis caching
- [ ] Add metrics endpoint
- [ ] Fix rate limiting (use Redis, apply aiRateLimiter)
- [ ] Write API documentation

### Week 3: Polish
- [ ] Build data service
- [ ] Add CI/CD pipeline
- [ ] Create Grafana dashboard
- [ ] Load testing
- [ ] Security audit

---

## 🎯 Success Criteria

**P0 Complete When:**
- ✅ Gateway is live at a public URL
- ✅ AI service responds to requests
- ✅ End-to-end flow works (client → gateway → AI service)

**P1 Complete When:**
- ✅ Authentication protects routes
- ✅ Metrics endpoint returns Prometheus format
- ✅ Redis caches responses
- ✅ Rate limiting uses Redis (works across instances)

---

## 📚 Resources

### Deployment
- Railway: https://railway.app/
- Render: https://render.com/
- Docker Hub: https://hub.docker.com/

### Libraries
- FastAPI Docs: https://fastapi.tiangolo.com/
- Prom-client: https://github.com/siimon/prom-client
- ioredis: https://github.com/redis/ioredis
- JWT: https://jwt.io/

### Monitoring
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- DataDog: https://www.datadoghq.com/

---

## 🚀 Next Steps

1. **Today:** Deploy gateway to Railway
2. **This Week:** Build basic AI service
3. **Next Week:** Add authentication + caching
4. **Month End:** Production-ready system

**Start with deployment - it's motivating to see it live!** 🎉

