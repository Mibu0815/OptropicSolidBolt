/**
 * Optropic Platform Load Test - k6
 * ----------------------------------
 * Comprehensive load testing for the platform
 *
 * Run: k6 run k6-loadtest.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const requestDuration = new Trend('request_duration');
const authAttempts = new Counter('auth_attempts');
const healthChecks = new Counter('health_checks');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Load test stages
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users over 1 minute
    { duration: '3m', target: 10 },   // Stay at 10 users for 3 minutes
    { duration: '1m', target: 25 },   // Ramp up to 25 users
    { duration: '3m', target: 25 },   // Stay at 25 users for 3 minutes
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Spike to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users for 2 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.01'],                  // Error rate under 1%
    'errors': ['rate<0.05'],                           // Error rate under 5%
    'success': ['rate>0.95'],                          // Success rate over 95%
  },
};

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!',
};

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);

  // Verify service is up
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Service not healthy: ${healthCheck.status}`);
  }

  console.log('Service is healthy, proceeding with load test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Group 1: Health and Metrics Endpoints
  group('Health & Monitoring', function () {
    const healthRes = http.get(`${data.baseUrl}/api/health`);

    const healthCheck = check(healthRes, {
      'health status is 200': (r) => r.status === 200,
      'health check passes': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy';
        } catch (e) {
          return false;
        }
      },
      'response time < 200ms': (r) => r.timings.duration < 200,
    });

    healthChecks.add(1);
    successRate.add(healthCheck);
    errorRate.add(!healthCheck);
    requestDuration.add(healthRes.timings.duration);

    sleep(0.5);

    const metricsRes = http.get(`${data.baseUrl}/api/metrics`);

    check(metricsRes, {
      'metrics status is 200': (r) => r.status === 200,
      'metrics contain optropic': (r) => r.body.includes('optropic_'),
    });
  });

  sleep(1);

  // Group 2: Authentication Flow
  group('Authentication', function () {
    const loginPayload = JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginRes = http.post(
      `${data.baseUrl}/api/trpc/login`,
      loginPayload,
      params
    );

    authAttempts.add(1);

    const authCheck = check(loginRes, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(authCheck);
    errorRate.add(!authCheck);
    requestDuration.add(loginRes.timings.duration);

    // If login successful, try to get current user
    if (loginRes.status === 200) {
      try {
        const loginBody = JSON.parse(loginRes.body);
        if (loginBody.result?.data?.token) {
          const token = loginBody.result.data.token;

          const userParams = {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          };

          const userRes = http.post(
            `${data.baseUrl}/api/trpc/getCurrentUser`,
            '{}',
            userParams
          );

          check(userRes, {
            'get user status is 200': (r) => r.status === 200,
            'user data returned': (r) => {
              try {
                const body = JSON.parse(r.body);
                return body.result?.data?.user !== undefined;
              } catch (e) {
                return false;
              }
            },
          });
        }
      } catch (e) {
        // Login response parsing failed
        console.log('Login response parsing failed');
      }
    }
  });

  sleep(2);

  // Group 3: API Endpoints (if authenticated)
  group('API Operations', function () {
    // These would require valid authentication
    // Skipping for load test unless we have test credentials

    // Example: Get projects
    // const projectsRes = http.post(`${data.baseUrl}/api/trpc/getProjects`, '{}', params);
    // check(projectsRes, { 'projects status is 200 or 401': (r) => r.status === 200 || r.status === 401 });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed!');
  console.log(`Tested against: ${data.baseUrl}`);
}
