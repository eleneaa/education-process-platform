import time
from collections import defaultdict
from functools import wraps
from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self):
        # Структура: {ip_address: [timestamps]}
        self.requests = defaultdict(list)

    def is_allowed(self, ip: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds

        self.requests[ip] = [ts for ts in self.requests[ip] if ts > cutoff]

        if len(self.requests[ip]) >= max_requests:
            return False

        self.requests[ip].append(now)
        return True

    def limit(self, max_requests: int, window_seconds: int):
        def decorator(func):
            @wraps(func)
            async def async_wrapper(request: Request, *args, **kwargs):
                client_ip = request.client.host if request.client else "unknown"
                if not self.is_allowed(client_ip, max_requests, window_seconds):
                    raise HTTPException(
                        status_code=429,
                        detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds",
                    )
                return await func(request, *args, **kwargs)

            @wraps(func)
            def sync_wrapper(request: Request, *args, **kwargs):
                client_ip = request.client.host if request.client else "unknown"
                if not self.is_allowed(client_ip, max_requests, window_seconds):
                    raise HTTPException(
                        status_code=429,
                        detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds",
                    )
                return func(request, *args, **kwargs)

            # Проверяем async или sync функция
            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper

        return decorator


rate_limiter = RateLimiter()
