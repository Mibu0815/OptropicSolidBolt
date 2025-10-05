# Load Testing Guide

This directory contains load testing scripts and configurations for the Optropic Platform.

## Prerequisites

### Install k6

**macOS**:
```bash
brew install k6
```

**Linux (Ubuntu/Debian)**:
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows**:
```powershell
choco install k6
```

## Running Load Tests

### Basic Load Test

Test against local development:
```bash
k6 run k6-loadtest.js
```

Test against staging:
```bash
BASE_URL=https://staging.yourdomain.com k6 run k6-loadtest.js
```

Test against production (use with caution):
```bash
BASE_URL=https://yourdomain.com k6 run k6-loadtest.js
```

### With Custom Options

```bash
# Run with more users
k6 run --vus 100 --duration 5m k6-loadtest.js

# Output results to JSON
k6 run --out json=results.json k6-loadtest.js

# Send results to InfluxDB (if configured)
k6 run --out influxdb=http://localhost:8086/k6 k6-loadtest.js
```

## Load Test Stages

The default load test runs through these stages:

1. **Warm-up** (1 min): Ramp up to 10 users
2. **Baseline** (3 min): Maintain 10 users
3. **Ramp-up** (1 min): Increase to 25 users
4. **Sustained Load** (3 min): Maintain 25 users
5. **Heavy Load** (1 min): Increase to 50 users
6. **Peak Load** (3 min): Maintain 50 users
7. **Spike Test** (1 min): Spike to 100 users
8. **Stress Test** (2 min): Maintain 100 users
9. **Cool-down** (2 min): Ramp down to 0

Total Duration: ~17 minutes

## Performance Thresholds

The load test enforces these thresholds:

- **P95 Latency**: < 500ms (95th percentile)
- **P99 Latency**: < 1000ms (99th percentile)
- **Error Rate**: < 1%
- **Success Rate**: > 95%

If any threshold is exceeded, the test will FAIL.

## Interpreting Results

### Sample Output

```
     ✓ health status is 200
     ✓ health check passes
     ✓ response time < 200ms

     checks.........................: 100.00% ✓ 15234 ✗ 0
     data_received..................: 45 MB   2.6 MB/s
     data_sent......................: 12 MB   712 kB/s
     http_req_duration..............: avg=123ms min=12ms med=98ms max=543ms p(95)=289ms p(99)=412ms
     http_req_failed................: 0.00%   ✓ 0     ✗ 15234
     http_reqs......................: 15234   897.29/s
     iteration_duration.............: avg=5.6s  min=5.1s med=5.5s max=6.2s  p(95)=6.0s  p(99)=6.1s
```

### Key Metrics Explained

- **checks**: Percentage of successful checks
- **http_req_duration**: Request latency distribution
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total requests and requests per second
- **iteration_duration**: Time to complete one full iteration

### What to Look For

✅ **Good Performance**:
- P95 < 500ms
- P99 < 1000ms
- Error rate < 1%
- Consistent throughput

❌ **Performance Issues**:
- Increasing latency over time (memory leak?)
- High error rates (> 5%)
- Timeouts or connection failures
- Dropping throughput under sustained load

## Troubleshooting

### High Error Rates

**Symptoms**: `http_req_failed > 5%`

**Possible Causes**:
- Database connection pool exhausted
- Rate limiting active
- Memory issues
- Database query timeouts

**Actions**:
1. Check application logs
2. Monitor database connections
3. Review rate limiter configuration
4. Check memory usage

### High Latency

**Symptoms**: `P95 > 500ms` or `P99 > 1s`

**Possible Causes**:
- Slow database queries
- Unoptimized code paths
- Memory pressure
- Network issues

**Actions**:
1. Enable query logging
2. Profile slow endpoints
3. Check database indexes
4. Review monitoring dashboards

### Connection Failures

**Symptoms**: `connection refused` or `timeout`

**Possible Causes**:
- Service down
- Insufficient resources
- Network configuration
- Firewall blocking

**Actions**:
1. Verify service is running
2. Check resource limits (CPU, memory)
3. Review network configuration
4. Check firewall rules

## Advanced Testing

### Smoke Test (Quick Validation)

```bash
k6 run --vus 1 --duration 30s k6-loadtest.js
```

### Stress Test (Find Breaking Point)

```bash
k6 run --vus 200 --duration 10m k6-loadtest.js
```

### Soak Test (Long-term Stability)

```bash
k6 run --vus 50 --duration 4h k6-loadtest.js
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: |
          BASE_URL=${{ secrets.STAGING_URL }} k6 run loadtest/k6-loadtest.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Best Practices

1. **Test in Staging First**: Never run load tests against production without approval
2. **Monitor Resources**: Watch CPU, memory, database connections during tests
3. **Gradual Ramp-up**: Don't spike traffic immediately
4. **Realistic Scenarios**: Test common user flows
5. **Regular Testing**: Run load tests regularly to catch regressions
6. **Document Baselines**: Track performance metrics over time

## Resources

- k6 Documentation: https://k6.io/docs/
- Load Testing Best Practices: https://k6.io/docs/test-types/load-testing/
- Performance Testing Guide: https://k6.io/docs/testing-guides/
