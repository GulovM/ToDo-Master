"""
URL configuration for todo_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    """
    API root endpoint with available endpoints
    """
    return JsonResponse({
        'message': 'Todo App API',
        'version': '1.0.0',
        'endpoints': {
            'authentication': '/api/auth/',
            'tasks': '/api/tasks/',
        },
        'documentation': {
            'authentication': {
                'register': 'POST /api/auth/register/',
                'login': 'POST /api/auth/login/',
                'logout': 'POST /api/auth/logout/',
                'profile': 'GET/PUT /api/auth/profile/',
                'change_password': 'POST /api/auth/change-password/',
                'user_stats': 'GET /api/auth/stats/',
            },
            'tasks': {
                'list_create': 'GET/POST /api/tasks/',
                'detail': 'GET/PUT/DELETE /api/tasks/{id}/',
                'update_status': 'PATCH /api/tasks/{id}/status/',
                'bulk_operations': 'POST /api/tasks/bulk/',
                'categories': 'GET/POST /api/tasks/categories/',
                'stats': 'GET /api/tasks/stats/',
                'upcoming': 'GET /api/tasks/upcoming/',
                'search': 'GET /api/tasks/search/',
            }
        }
    })


urlpatterns = [
    path('api/', api_root, name='api_root'),
    path('api/auth/', include('authentication.urls')),
    path('api/tasks/', include('tasks.urls')),
]
