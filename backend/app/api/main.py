from fastapi import APIRouter

from app.api.routes import login, private, users, utils
from app.core.config import settings

from app.api.routes import (
    admission_requests,
    program,
    module,
    groups,
    enrollments,
    progresses,
    gamification,
    analytics,
    trajectory,
)


api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(admission_requests.router)
api_router.include_router(program.router)
api_router.include_router(module.router)
api_router.include_router(groups.router)
api_router.include_router(enrollments.router)
api_router.include_router(progresses.router)
api_router.include_router(gamification.router)
api_router.include_router(analytics.router)
api_router.include_router(trajectory.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
