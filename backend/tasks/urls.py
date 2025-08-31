from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    # Task CRUD endpoints
    path('', views.TaskListCreateView.as_view(), name='task_list_create'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('<int:pk>/status/', views.TaskStatusUpdateView.as_view(), name='task_status_update'),
    
    # Task bulk operations
    path('bulk/', views.TaskBulkOperationsView.as_view(), name='task_bulk_operations'),
    
    # Task categories
    path('categories/', views.TaskCategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.TaskCategoryDetailView.as_view(), name='category_detail'),
    
    # Task statistics and analytics
    path('stats/', views.task_stats, name='task_stats'),
    path('upcoming/', views.upcoming_tasks, name='upcoming_tasks'),
    path('search/', views.search_tasks, name='search_tasks'),
    # AI assistant
    path('ai/assist/', views.ai_assist, name='ai_assist'),
    path('ai/chats/', views.ai_chats_list, name='ai_chats_list'),
    path('ai/chats/<int:chat_id>/', views.ai_chat_messages, name='ai_chat_messages'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),
]
