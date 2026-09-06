"""
Basic JWT auth.

  POST /api/auth/register  {email, password}  -> {token, user}
  POST /api/auth/login     {email, password}  -> {token, user}
  GET  /api/auth/me        (Bearer)           -> user

Send the token as `Authorization: Bearer <jwt>`. For browser navigations that can't set
headers (the OAuth login redirects) pass it as `?token=<jwt>` instead.
"""

import hashlib
import hmac
import os
import secrets
import time

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

import db

JWT_SECRET = os.environ.get("JWT_SECRET") or "piper-dev-secret-change-me-before-anyone-cares-0123456789"
JWT_TTL = 60 * 60 * 24  # 24h

router = APIRouter(prefix="/api/auth")


# ---- passwords (stdlib, no bcrypt build headaches)
def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${digest}"


def verify_password(pw: str, stored: str) -> bool:
    salt, digest = stored.split("$", 1)
    return hmac.compare_digest(hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000).hex(), digest)


# ---- jwt
def make_token(user_id: int, ttl: int = JWT_TTL, **extra) -> str:
    return jwt.encode({"sub": str(user_id), "exp": int(time.time()) + ttl, **extra}, JWT_SECRET, algorithm="HS256")


def read_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(401, f"invalid token: {e}")


def _token_from_request(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return request.query_params.get("token")


def current_user(request: Request) -> dict:
    """FastAPI dependency: requires a valid JWT, sets db.current_user_id for the request."""
    token = _token_from_request(request)
    if not token:
        raise HTTPException(401, "missing Authorization: Bearer <token> (or ?token=)")
    uid = int(read_token(token)["sub"])
    user = db.get_user(uid)
    if not user:
        raise HTTPException(401, "user no longer exists")
    db.current_user_id.set(uid)
    return dict(user)


def optional_user(request: Request) -> dict | None:
    """Like current_user but tolerates no token (falls back to file-based tokens for local testing)."""
    if not _token_from_request(request):
        db.current_user_id.set(None)
        return None
    return current_user(request)


# ---- routes
class Credentials(BaseModel):
    email: str
    password: str


def _issue(user_row) -> dict:
    user = {"id": user_row["id"], "email": user_row["email"]}
    return {"token": make_token(user["id"]), "token_type": "bearer", "expires_in": JWT_TTL, "user": user}


@router.post("/register")
def register(body: Credentials):
    if len(body.password) < 4:
        raise HTTPException(400, "password too short")
    if db.get_user_by_email(body.email):
        raise HTTPException(409, "email already registered")
    uid = db.create_user(body.email, hash_password(body.password))
    return _issue(db.get_user(uid))


@router.post("/login")
def login(body: Credentials):
    row = db.get_user_by_email(body.email)
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "bad email or password")
    return _issue(row)


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return user
