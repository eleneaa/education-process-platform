from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_admin(current_user: CurrentUser) -> User:
    # Check if user has admin role or is superuser
    # current_user.role can be either a string or UserRole enum
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_value != "ADMIN" and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Admin privileges required"
        )
    return current_user


def get_current_teacher_or_admin(current_user: CurrentUser) -> User:
    from app.models.enums import UserRole
    # Check if user has teacher or admin role
    # current_user.role can be either a string or UserRole enum
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_value not in ("ADMIN", "TEACHER") and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Teacher or admin privileges required"
        )
    return current_user


def get_current_user_optional(session: SessionDep, request: Request) -> User | None:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]  # Remove "Bearer " prefix
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        return None
    user = session.get(User, token_data.sub)
    if not user or not user.is_active:
        return None
    return user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]
CurrentTeacherOrAdmin = Annotated[User, Depends(get_current_teacher_or_admin)]
OptionalCurrentUser = Annotated[User | None, Depends(get_current_user_optional)]
