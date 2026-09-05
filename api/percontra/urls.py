from django.urls import path, re_path

from . import views

urlpatterns = [
    path("api/health", views.health),
    path("api/summary", views.summary),
    path("api/postings", views.not_implemented),
    path("api/decisions", views.not_implemented),
    path("api/releases", views.not_implemented),
    # WhiteNoise answers real asset paths before the request reaches here,
    # so this only catches client-side routes and the empty state.
    re_path(r"^(?!api/).*$", views.index),
]
