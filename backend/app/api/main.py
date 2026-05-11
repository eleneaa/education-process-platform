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
    lessons,
    teacher_recommendations,
    export,
    import_routes,
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
api_router.include_router(lessons.router)
api_router.include_router(teacher_recommendations.router)
api_router.include_router(export.router)
api_router.include_router(import_routes.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)

if settings.telegram_enabled:
    from app.integrations.telegram.router import router as telegram_router

    api_router.include_router(telegram_router)
