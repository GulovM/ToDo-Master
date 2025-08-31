from rest_framework import generics, status, permissions, filters
from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField
from django.db.models.functions import TruncDate
from .models import Task, TaskCategory
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateUpdateSerializer,
    TaskStatusUpdateSerializer,
    TaskBulkUpdateSerializer,
    TaskCategorySerializer,
    TaskStatsSerializer,
    TaskSearchSerializer
)
from decouple import config
try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None


class TaskCategoryListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating task categories
    """
    serializer_class = TaskCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TaskCategory.objects.annotate(
            task_count=Count('tasks')
        ).order_by('name')


class TaskCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating and deleting task categories
    """
    serializer_class = TaskCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TaskCategory.objects.all()


class TaskListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating tasks
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    filterset_fields = ['category', 'priority', 'is_done']
    ordering_fields = ['created_at', 'deadline', 'priority', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user).select_related(
            'category', 'user'
        )
        
        # Custom filtering
        is_overdue = self.request.query_params.get('is_overdue')
        if is_overdue is not None:
            if is_overdue.lower() == 'true':
                queryset = queryset.filter(
                    deadline__lt=timezone.now(),
                    is_done=False
                )
        
        deadline_from = self.request.query_params.get('deadline_from')
        if deadline_from:
            queryset = queryset.filter(deadline__gte=deadline_from)
        
        deadline_to = self.request.query_params.get('deadline_to')
        if deadline_to:
            queryset = queryset.filter(deadline__lte=deadline_to)
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateUpdateSerializer
        return TaskListSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # Return detailed task data
        detail_serializer = TaskDetailSerializer(task)
        return Response({
            'message': 'Task created successfully',
            'task': detail_serializer.data
        }, status=status.HTTP_201_CREATED)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating and deleting individual tasks
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related(
            'category', 'user'
        )
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskCreateUpdateSerializer
        return TaskDetailSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # Return detailed task data
        detail_serializer = TaskDetailSerializer(task)
        return Response({
            'message': 'Task updated successfully',
            'task': detail_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        task_title = instance.title
        self.perform_destroy(instance)
        return Response({
            'message': f'Task "{task_title}" deleted successfully'
        }, status=status.HTTP_200_OK)


class TaskStatusUpdateView(generics.UpdateAPIView):
    """
    API endpoint for updating task status (completed/pending)
    """
    serializer_class = TaskStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        status_message = 'completed' if task.is_done else 'marked as pending'
        return Response({
            'message': f'Task "{task.title}" {status_message}',
            'is_done': task.is_done,
            'completed_at': task.completed_at
        })


class TaskBulkOperationsView(APIView):
    """
    API endpoint for bulk operations on tasks
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = TaskBulkUpdateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        action = serializer.validated_data['action']
        
        tasks = Task.objects.filter(
            user=request.user,
            id__in=task_ids
        )
        
        if action == 'complete':
            updated_count = tasks.filter(is_done=False).update(
                is_done=True,
                completed_at=timezone.now()
            )
            message = f'{updated_count} tasks marked as completed'
        elif action == 'uncomplete':
            updated_count = tasks.filter(is_done=True).update(
                is_done=False,
                completed_at=None
            )
            message = f'{updated_count} tasks marked as pending'
        elif action == 'delete':
            deleted_count = tasks.count()
            tasks.delete()
            message = f'{deleted_count} tasks deleted'
        
        return Response({
            'message': message,
            'affected_count': updated_count if action != 'delete' else deleted_count
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_stats(request):
    """
    Get comprehensive task statistics for the user
    """
    user = request.user
    
    # Basic counts
    total_tasks = user.tasks.count()
    completed_tasks = user.tasks.filter(is_done=True).count()
    pending_tasks = total_tasks - completed_tasks
    overdue_tasks = user.tasks.filter(
        deadline__lt=timezone.now(),
        is_done=False
    ).count()
    
    # Tasks by category
    tasks_by_category = dict(
        user.tasks.values('category__name')
        .annotate(count=Count('id'))
        .values_list('category__name', 'count')
    )
    
    # Tasks by priority
    tasks_by_priority = dict(
        user.tasks.values('priority')
        .annotate(count=Count('id'))
        .values_list('priority', 'count')
    )
    
    # Recent activity (last 7 days)
    seven_days_ago = timezone.now() - timezone.timedelta(days=7)
    recent_activity = list(
        user.tasks.filter(created_at__gte=seven_days_ago)
        .extra(select={'date': 'date(created_at)'})
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    
    # Completion rate
    completion_rate = round(
        (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2
    )
    
    stats_data = {
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'overdue_tasks': overdue_tasks,
        'completion_rate': completion_rate,
        'tasks_by_category': tasks_by_category,
        'tasks_by_priority': tasks_by_priority,
        'recent_activity': recent_activity,
    }
    
    serializer = TaskStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_tasks(request):
    """
    Get upcoming tasks (with deadlines in next 7 days)
    """
    user = request.user
    seven_days_from_now = timezone.now() + timezone.timedelta(days=7)
    
    upcoming = user.tasks.filter(
        deadline__gte=timezone.now(),
        deadline__lte=seven_days_from_now,
        is_done=False
    ).select_related('category').order_by('deadline')
    
    serializer = TaskListSerializer(upcoming, many=True)
    return Response({
        'count': upcoming.count(),
        'tasks': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_tasks(request):
    """
    Advanced search for tasks
    """
    search_serializer = TaskSearchSerializer(data=request.query_params)
    search_serializer.is_valid(raise_exception=True)
    
    queryset = Task.objects.filter(user=request.user).select_related('category', 'user')
    
    # Apply filters
    search_term = search_serializer.validated_data.get('search')
    if search_term:
        queryset = queryset.filter(
            Q(title__icontains=search_term) | 
            Q(description__icontains=search_term)
        )
    
    category = search_serializer.validated_data.get('category')
    if category:
        queryset = queryset.filter(category_id=category)
    
    priority = search_serializer.validated_data.get('priority')
    if priority:
        queryset = queryset.filter(priority=priority)
    
    is_done = search_serializer.validated_data.get('is_done')
    if is_done is not None:
        queryset = queryset.filter(is_done=is_done)
    
    is_overdue = search_serializer.validated_data.get('is_overdue')
    if is_overdue:
        queryset = queryset.filter(
            deadline__lt=timezone.now(),
            is_done=False
        )
    
    deadline_from = search_serializer.validated_data.get('deadline_from')
    if deadline_from:
        queryset = queryset.filter(deadline__gte=deadline_from)
    
    deadline_to = search_serializer.validated_data.get('deadline_to')
    if deadline_to:
        queryset = queryset.filter(deadline__lte=deadline_to)
    
    # Apply ordering
    ordering = search_serializer.validated_data.get('ordering', '-created_at')
    queryset = queryset.order_by(ordering)
    
    serializer = TaskListSerializer(queryset, many=True)
    return Response({
        'count': queryset.count(),
        'tasks': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    API health check endpoint
    """
    return Response({
        'status': 'healthy',
        'message': 'Tasks API is running',
        'categories_count': TaskCategory.objects.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ai_assist(request):
    """
    AI assistant endpoint. Uses OpenAI with server-side key and the
    authenticated user's tasks as context. Never exposes other users' data.
    Body: {"message": "..."}
    """
    api_key = config('OPENAI_API_KEY', default=None)
    # Optional custom base URL (for providers like OpenRouter)
    base_url_env = config('OPENAI_BASE_URL', default=None)
    if not api_key or OpenAI is None:
        return Response({'error': 'Сервис ИИ пока что недоступен'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    user = request.user
    user_message = (request.data or {}).get('message', '').strip()
    if not user_message:
        return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Collect a concise snapshot of user's tasks
    tasks_qs = Task.objects.filter(user=user).select_related('category')
    pending = list(tasks_qs.filter(is_done=False).values('id', 'title', 'priority', 'deadline', 'category__name')[:50])
    completed = list(tasks_qs.filter(is_done=True).values('id', 'title', 'priority', 'completed_at', 'category__name')[:20])

    def fmt_task(t):
        return f"- [{t.get('category__name') or 'Без категории'}] {t['title']} (приоритет: {t.get('priority') or '-'}, дедлайн: {t.get('deadline') or '-'})"
    def fmt_completed(t):
        return f"- [{t.get('category__name') or 'Без категории'}] {t['title']} (выполнено)"

    snapshot = "\n".join([fmt_task(t) for t in pending])
    snapshot_done = "\n".join([fmt_completed(t) for t in completed])

    system_prompt = (
        "Ты — помощник по планированию задач. Отвечай по-русски. "
        "Учитывай ТОЛЬКО задачи текущего пользователя, которые я даю в контексте. "
        "Помогай с приоритизацией, планированием, дедлайнами, списками. Если чего-то нет в списке — не выдумывай."
    )

    content = (
        f"Контекст — мои задачи (всего: {tasks_qs.count()}):\n"
        f"Невыполненные (до 50):\n{snapshot or '- нет'}\n\n"
        f"Выполненные (до 20):\n{snapshot_done or '- нет'}\n\n"
        f"Вопрос: {user_message}"
    )

    try:
        # Auto-detect OpenRouter key and set base URL if needed
        is_openrouter_key = api_key.startswith('sk-or-')
        base_url = base_url_env or ('https://openrouter.ai/api/v1' if is_openrouter_key else None)

        # Normalize model id: OpenRouter expects vendor prefix (e.g. "openai/gpt-4o-mini")
        configured_model = config('OPENAI_MODEL', default='gpt-4o-mini')
        model = configured_model
        if is_openrouter_key and '/' not in configured_model:
            model = f'openai/{configured_model}'

        # Build client
        if base_url:
            client = OpenAI(api_key=api_key, base_url=base_url, timeout=30)
        else:
            client = OpenAI(api_key=api_key, timeout=30)

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
            temperature=0.2,
        )
        answer = completion.choices[0].message.content
        return Response({'reply': answer, 'source': 'openai' if not is_openrouter_key else 'openrouter'})
    except Exception:
        # Hide provider errors from clients, surface as 503
        return Response({'error': 'Сервис ИИ пока что недоступен'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
