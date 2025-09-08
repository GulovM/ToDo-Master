from rest_framework import generics, status, permissions, filters
from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField
from django.db.models.functions import TruncDate
from .models import Task, TaskCategory, ChatSession, ChatMessage
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
from django.conf import settings
import json
from datetime import datetime
from django.utils.dateparse import parse_datetime
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
        # return global categories (owner is null) + user's own
        return TaskCategory.objects.filter(
            Q(owner__isnull=True) | Q(owner=self.request.user)
        ).annotate(
            task_count=Count('tasks', filter=Q(tasks__user=self.request.user))
        ).order_by('name')


class TaskCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating and deleting task categories
    """
    serializer_class = TaskCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # allow retrieving only global or own categories
        return TaskCategory.objects.filter(
            Q(owner__isnull=True) | Q(owner=self.request.user)
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only owner can update; global categories are read-only
        if instance.owner_id is None or instance.owner_id != request.user.id:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only owner can delete; global categories cannot be deleted
        if instance.owner_id is None or instance.owner_id != request.user.id:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


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
    data = request.data or {}
    user_message = (data.get('message') or '').strip()
    if not user_message and not data.get('confirm'):
        return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Chat session handling
    chat_id = data.get('chat_id')
    session = None
    if chat_id:
        try:
            session = ChatSession.objects.get(id=chat_id, user=user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'chat_not_found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        # Create new chat session, keep only last 15 sessions
        title = (user_message[:100] + '...') if len(user_message) > 100 else user_message
        session = ChatSession.objects.create(user=user, title=title or 'Новый диалог')
        # Retention: keep last 15 sessions
        keep = 15
        ids_to_keep = list(ChatSession.objects.filter(user=user).order_by('-updated_at').values_list('id', flat=True)[:keep])
        ChatSession.objects.filter(user=user).exclude(id__in=ids_to_keep).delete()

    # Save user message (only for regular prompts)
    if user_message:
        ChatMessage.objects.create(session=session, role='user', content=user_message)

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
        "Ты — помощник по планированию задач. Отвечай по-русски."
        "Учитывай ТОЛЬКО задачи текущего пользователя, которые даются в контексте. "
        "Не повторяй обратно список задач, если тебя об этом явно не попросили. "
        "Никогда не утверждай, что уже выполнил какие‑либо изменения. Если пользователь просит создать/обновить/удалить — кратко подтверди намерение и жди подтверждения."
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

        # Compute max_tokens with safe bounds (from env and optional request override)
        try:
            env_cap = config('OPENAI_MAX_TOKENS', default=512, cast=int)
        except Exception:
            env_cap = 512
        env_cap = max(32, min(env_cap, 4096))
        req_cap = None
        if isinstance(request.data, dict) and request.data.get('max_tokens') is not None:
            try:
                req_cap = int(request.data.get('max_tokens'))
            except Exception:
                req_cap = None
        max_tokens = env_cap if req_cap is None else max(32, min(req_cap, env_cap))

        # Optional OpenRouter ranking headers
        extra_headers = {}
        referer = config('AI_REFERER', default=None)
        site_title = config('AI_TITLE', default=None)
        if referer:
            extra_headers["HTTP-Referer"] = referer
        if site_title:
            extra_headers["X-Title"] = site_title

        # Build chat history for the model (last 10 pairs to keep short)
        history = list(session.messages.order_by('-created_at').values('role', 'content')[:10])
        history.reverse()

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                *[{"role": m['role'], "content": m['content']} for m in history],
                {"role": "user", "content": content},
            ],
            temperature=0.2,
            max_tokens=max_tokens,
            **({"extra_headers": extra_headers} if extra_headers else {}),
        )
        answer = completion.choices[0].message.content

        # Second pass: actions planning
        actions = {"categories": [], "tasks": []}
        try:
            if data.get('confirm'):
                # Use client-provided actions if present, else regenerate
                if data.get('actions'):
                    actions = data['actions'] if isinstance(data['actions'], dict) else json.loads(data['actions'])
                else:
                    # Regenerate actions from current input
                    schema_prompt = (
                        "Ты парсер намерений для приложения задач. Верни ТОЛЬКО JSON. "
                        "Схема: {\"categories\":[], \"tasks\":[], \"update_categories\":[], \"update_tasks\":[], \"delete_categories\":[], \"delete_tasks\":[]} "
                        "categories: [{name, color?, description?}] — создать; "
                        "tasks: [{title, description?, priority?, deadline?, category?}] — создать; "
                        "update_categories: [{name, new_name?, color?, description?}]; "
                        "update_tasks: [{id?|title, title?, description?, priority?, deadline?, category?, is_done?}]; "
                        "delete_categories: [{name}]; delete_tasks: [{id?|title}]. "
                        "deadline по возможности ISO8601 (например 2025-09-05T18:00:00Z)."
                    )
                    actions_completion = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": schema_prompt},
                            {"role": "user", "content": content},
                        ],
                        temperature=0,
                        max_tokens=768,
                        **({"extra_headers": extra_headers} if extra_headers else {}),
                    )
                    raw_json = (actions_completion.choices[0].message.content or "").strip()
                    try:
                        actions = json.loads(raw_json)
                    except Exception:
                        start = raw_json.find('{'); end = raw_json.rfind('}')
                        actions = json.loads(raw_json[start:end+1]) if (start != -1 and end != -1 and end > start) else {"categories": [], "tasks": []}
            else:
                # Plan only (no execution)
                schema_prompt = (
                    "Ты парсер намерений для приложения задач. Верни ТОЛЬКО JSON. "
                    "Схема: {\"categories\":[], \"tasks\":[], \"update_categories\":[], \"update_tasks\":[], \"delete_categories\":[], \"delete_tasks\":[]} "
                    "categories: [{name, color?, description?}] — создать; "
                    "tasks: [{title, description?, priority?, deadline?, category?}] — создать; "
                    "update_categories: [{name, new_name?, color?, description?}]; "
                    "update_tasks: [{id?|title, title?, description?, priority?, deadline?, category?, is_done?}]; "
                    "delete_categories: [{name}]; delete_tasks: [{id?|title}]. "
                    "deadline по возможности ISO8601."
                )
                actions_completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": schema_prompt},
                        {"role": "user", "content": content},
                    ],
                    temperature=0,
                    max_tokens=768,
                    **({"extra_headers": extra_headers} if extra_headers else {}),
                )
                raw_json = (actions_completion.choices[0].message.content or "").strip()
                try:
                    actions = json.loads(raw_json)
                except Exception:
                    start = raw_json.find('{'); end = raw_json.rfind('}')
                    actions = json.loads(raw_json[start:end+1]) if (start != -1 and end != -1 and end > start) else {"categories": [], "tasks": []}
        except Exception:
            actions = {"categories": [], "tasks": []}

        created_summary = []
        # Limits per request
        max_new_categories = 5
        max_new_tasks = 20

        # Create or reuse categories only if confirm=True
        executed = False
        if data.get('confirm'):
            executed = True
            try:
                cats_in = (actions.get('categories') or [])[:max_new_categories]
                for cat in cats_in:
                    name = (cat.get('name') or '').strip()
                    if not name:
                        continue
                    color = cat.get('color') or None
                    # Prefer an existing accessible category (user-owned first, then global)
                    obj = TaskCategory.objects.filter(
                        (Q(owner=request.user) | Q(owner__isnull=True)) & Q(name__iexact=name)
                    ).order_by('-owner').first()
                    if not obj:
                        # Create a user-owned category
                        obj = TaskCategory.objects.create(
                            name=name,
                            color=(color if (isinstance(color, str) and color.startswith('#') and len(color) in (4, 7)) else '#3B82F6'),
                            owner=request.user
                        )
                    else:
                        # Update color only for user's own categories
                        if obj.owner_id == request.user.id and color and isinstance(color, str) and color.startswith('#') and len(color) in (4, 7) and obj.color != color:
                            obj.color = color
                            obj.save()
                    # Do not reveal whether category existed before to avoid inference
                    created_summary.append(f"категория: {obj.name}")
            except Exception:
                pass

        # Helper normalization
        def norm_priority(p):
            p = (p or '').lower()
            return p if p in ('low', 'medium', 'high') else 'medium'

        def parse_deadline(value):
            if not value:
                return None
            dt = parse_datetime(value)
            if dt:
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone=timezone.utc)
                return dt
            try:
                dt = datetime.fromisoformat(value)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone=timezone.utc)
                return dt
            except Exception:
                pass
            # Fallback: dd.mm.yyyy[ HH:MM]
            try:
                parts = value.strip().split()
                date_part = parts[0]
                day, month, year = [int(x) for x in date_part.split('.')]
                if len(parts) > 1:
                    time_part = parts[1]
                    hh, mm = [int(x) for x in time_part.split(':')]
                else:
                    hh, mm = 9, 0  # default 09:00
                dt = datetime(year, month, day, hh, mm)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone=timezone.utc)
                return dt
            except Exception:
                return None

        # Category lookup cache (only categories visible to the user)
        cat_cache = {c.name.lower(): c for c in TaskCategory.objects.filter(Q(owner__isnull=True) | Q(owner=user))}

        # Create tasks only if confirm=True
        if data.get('confirm'):
            try:
                tasks_in = (actions.get('tasks') or [])[:max_new_tasks]
                new_count = 0
                for t in tasks_in:
                    title = (t.get('title') or '').strip()
                    if len(title) < 3:
                        continue
                    desc = t.get('description') or None
                    prio = norm_priority(t.get('priority'))
                    cat_name = (t.get('category') or '').strip().lower()
                    category = cat_cache.get(cat_name) if cat_name else None
                    deadline_dt = parse_deadline(t.get('deadline'))
                    Task.objects.create(
                        user=user,
                        title=title,
                        description=desc,
                        priority=prio,
                        deadline=deadline_dt,
                        category=category,
                    )
                    new_count += 1
                if new_count:
                    created_summary.append(f"задач создано: {new_count}")
            except Exception:
                pass

        # Update categories (confirm only)
        if data.get('confirm'):
            try:
                updates = actions.get('update_categories') or []
                upd_count = 0
                for u in updates:
                    name = (u.get('name') or '').strip()
                    if not name:
                        continue
                    # Only allow updating user's own categories
                    cat = TaskCategory.objects.filter(owner=user, name__iexact=name).first()
                    if not cat:
                        continue
                    changed = False
                    new_name = (u.get('new_name') or '').strip()
                    if new_name and new_name != cat.name and not TaskCategory.objects.filter(owner=user, name__iexact=new_name).exists():
                        cat.name = new_name
                        changed = True
                    color = u.get('color')
                    if color and isinstance(color, str) and color.startswith('#') and len(color) in (4, 7) and color != cat.color:
                        cat.color = color
                        changed = True
                    desc = u.get('description')
                    if desc is not None and desc != cat.description:
                        cat.description = desc
                        changed = True
                    if changed:
                        cat.save()
                        upd_count += 1
                if upd_count:
                    created_summary.append(f"категорий обновлено: {upd_count}")
            except Exception:
                pass

        # Update tasks (confirm only)
        if data.get('confirm'):
            try:
                updates = actions.get('update_tasks') or []
                upd_count = 0
                cat_cache = {c.name.lower(): c for c in TaskCategory.objects.filter(Q(owner__isnull=True) | Q(owner=user))}
                for u in updates:
                    task = None
                    if u.get('id') is not None:
                        task = Task.objects.filter(user=user, id=u.get('id')).first()
                    if not task and u.get('title'):
                        task = Task.objects.filter(user=user, title__iexact=(u.get('title') or '').strip()).order_by('-created_at').first()
                    if not task:
                        continue
                    changed = False
                    if 'title' in u and u['title']:
                        title = u['title'].strip()
                        if len(title) >= 3 and title != task.title:
                            task.title = title
                            changed = True
                    if 'description' in u:
                        desc = u['description']
                        if desc != task.description:
                            task.description = desc
                            changed = True
                    if 'priority' in u:
                        prio = norm_priority(u.get('priority'))
                        if prio != task.priority:
                            task.priority = prio
                            changed = True
                    if 'deadline' in u:
                        deadline_dt = parse_deadline(u.get('deadline'))
                        if deadline_dt != task.deadline:
                            task.deadline = deadline_dt
                            changed = True
                    if 'category' in u:
                        cname = (u.get('category') or '').strip().lower()
                        new_cat = cat_cache.get(cname) if cname else None
                        if new_cat != task.category:
                            task.category = new_cat
                            changed = True
                    if 'is_done' in u:
                        is_done = bool(u.get('is_done'))
                        if is_done != task.is_done:
                            task.is_done = is_done
                            changed = True
                    if changed:
                        task.save()
                        upd_count += 1
                if upd_count:
                    created_summary.append(f"задач обновлено: {upd_count}")
            except Exception:
                pass

        # Delete categories (confirm only)
        if data.get('confirm'):
            try:
                deletions = actions.get('delete_categories') or []
                del_ok = 0
                for d in deletions:
                    name = (d.get('name') or '').strip()
                    if not name:
                        continue
                    # Only delete user's own categories
                    cat = TaskCategory.objects.filter(owner=user, name__iexact=name).first()
                    if not cat:
                        continue
                    Task.objects.filter(user=user, category=cat).update(category=None)
                    cat.delete()
                    del_ok += 1
                msg_parts = []
                if del_ok:
                    msg_parts.append(f"категорий удалено: {del_ok}")
                if msg_parts:
                    created_summary.append("; ".join(msg_parts))
            except Exception:
                pass

        # Delete tasks (confirm only)
        if data.get('confirm'):
            try:
                deletions = actions.get('delete_tasks') or []
                del_count = 0
                for d in deletions:
                    task = None
                    if d.get('id') is not None:
                        task = Task.objects.filter(user=user, id=d.get('id')).first()
                    if not task and d.get('title'):
                        task = Task.objects.filter(user=user, title__iexact=(d.get('title') or '').strip()).order_by('-created_at').first()
                    if not task:
                        continue
                    task.delete()
                    del_count += 1
                if del_count:
                    created_summary.append(f"задач удалено: {del_count}")
            except Exception:
                pass

        # Build deterministic assistant reply to avoid misleading claims
        def summarize_plan(a: dict) -> str:
            c_c = len(a.get('categories') or [])
            c_t = len(a.get('tasks') or [])
            u_c = len(a.get('update_categories') or [])
            u_t = len(a.get('update_tasks') or [])
            d_c = len(a.get('delete_categories') or [])
            d_t = len(a.get('delete_tasks') or [])
            lines = ["Я подготовил план изменений:"]
            if any([c_c, c_t]):
                lines.append(f"- создать: категорий {c_c}, задач {c_t}")
            if any([u_c, u_t]):
                lines.append(f"- обновить: категорий {u_c}, задач {u_t}")
            if any([d_c, d_t]):
                lines.append(f"- удалить: категорий {d_c}, задач {d_t}")
            lines.append("Нажмите Подтвердить, чтобы выполнить.")
            return "\n".join(lines)

        has_actions = any([
            actions.get('categories'), actions.get('tasks'),
            actions.get('update_categories'), actions.get('update_tasks'),
            actions.get('delete_categories'), actions.get('delete_tasks')
        ])

        if not executed and has_actions:
            answer = summarize_plan(actions)
        elif executed:
            if created_summary:
                answer = "Изменения выполнены. " + "; ".join(created_summary)
            else:
                answer = "Изменения выполнены."

        # Save assistant message
        ChatMessage.objects.create(session=session, role='assistant', content=answer or '')

        response_payload = {
            'reply': (answer or '').rstrip(),
            'source': 'openai' if not is_openrouter_key else 'openrouter',
            'chat_id': session.id,
            'requires_confirmation': (not executed and has_actions),
            'executed': executed,
        }
        if not executed:
            response_payload['plan'] = actions
        if executed and created_summary:
            response_payload['created'] = created_summary

        return Response(response_payload)
    except Exception as e:
        # In DEBUG provide a hint to speed up troubleshooting (no secrets exposed)
        if getattr(settings, 'DEBUG', False):
            return Response({
                'error': 'Сервис ИИ пока что недоступен',
                'detail': str(e),
                'model': model if 'model' in locals() else None,
                'base_url': base_url if 'base_url' in locals() else None,
                'provider': 'openrouter' if 'is_openrouter_key' in locals() and is_openrouter_key else 'openai'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        # Hide provider errors from clients in production
        return Response({'error': 'Сервис ИИ пока что недоступен'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_chats_list(request):
    """
    List last 15 chat sessions for the user.
    """
    sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')[:15]
    data = [
        {
            'id': s.id,
            'title': s.title,
            'created_at': s.created_at,
            'updated_at': s.updated_at,
        }
        for s in sessions
    ]
    return Response({'chats': data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_chat_messages(request, chat_id: int):
    """
    Get messages for a chat session (last 200).
    """
    try:
        session = ChatSession.objects.get(id=chat_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({'error': 'chat_not_found'}, status=status.HTTP_404_NOT_FOUND)
    msgs = session.messages.order_by('created_at')[:200]
    data = [{'role': m.role, 'content': m.content, 'created_at': m.created_at} for m in msgs]
    return Response({'chat': {'id': session.id, 'title': session.title}, 'messages': data})
