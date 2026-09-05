from django.urls import path, re_path

from . import views
from .migration_views import endpoint

urlpatterns = [
    path("api/health", views.health),
    path("api/summary", views.summary),
    path("api/postings/<str:identifier>/evidence", endpoint, {"resource": "postings"}),
    path("api/releases/<str:identifier>/approve", endpoint, {"resource": "releases"}),
    path("api/connections/erpnext", endpoint, {"resource": "erpnext"}),
    path("api/connections/erpnext/<str:action>", endpoint, {"resource": "erpnext"}),
    path("api/submissions/<str:identifier>/<str:action>", endpoint, {"resource": "submissions"}),
    path("api/<str:resource>", endpoint),
    # WhiteNoise answers real asset paths before the request reaches here,
    # so this only catches client-side routes and the empty state.
    re_path(r"^(?!api/).*$", views.index),
]
