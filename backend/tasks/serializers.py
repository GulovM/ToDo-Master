from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskCategory


class TaskCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for TaskCategory model
    """
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskCategory
        fields = ('id', 'name', 'color', 'description', 'created_at', 'task_count')
        read_only_fields = ('id', 'created_at')
    
    def get_task_count(self, obj):
        """
        Get number of tasks in this category
        """
        return obj.tasks.count()


class TaskListSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model in list views (optimized for performance)
    """
    category_name = serializers.CharField(source='get_category_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    priority_color = serializers.CharField(source='get_priority_display_color', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'is_done', 'priority', 'deadline',
            'category', 'category_name', 'category_color', 'priority_color',
            'created_at', 'updated_at', 'completed_at', 'is_overdue',
            'days_until_deadline', 'user_name'
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at', 'completed_at', 'is_overdue',
            'days_until_deadline', 'category_name', 'category_color',
            'priority_color', 'user_name'
        )


class TaskDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model in detail views
    """
    category_details = TaskCategorySerializer(source='category', read_only=True)
    priority_color = serializers.CharField(source='get_priority_display_color', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'is_done', 'priority', 'deadline',
            'category', 'category_details', 'priority_color', 'user',
            'user_details', 'created_at', 'updated_at', 'completed_at',
            'is_overdue', 'days_until_deadline'
        )
        read_only_fields = (
            'id', 'user', 'created_at', 'updated_at', 'completed_at',
            'is_overdue', 'days_until_deadline', 'category_details',
            'priority_color', 'user_details'
        )
    
    def get_user_details(self, obj):
        """
        Get user details
        """
        return {
            'id': obj.user.id,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email
        }


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating tasks
    """
    class Meta:
        model = Task
        fields = (
            'title', 'description', 'is_done', 'priority', 'deadline', 'category'
        )
    
    def validate_title(self, value):
        """
        Validate task title
        """
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long.")
        return value.strip()
    
    def validate_deadline(self, value):
        """
        Validate deadline is not in the past
        """
        if value and value < timezone.now():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value
    
    def validate_category(self, value):
        """
        Validate category exists
        """
        if value and not TaskCategory.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid category selected.")
        return value
    
    def create(self, validated_data):
        """
        Create task with current user
        """
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating only task status (is_done)
    """
    class Meta:
        model = Task
        fields = ('is_done',)
    
    def update(self, instance, validated_data):
        """
        Update task status and set completed_at if needed
        """
        is_done = validated_data.get('is_done', instance.is_done)
        
        if is_done and not instance.completed_at:
            instance.completed_at = timezone.now()
        elif not is_done and instance.completed_at:
            instance.completed_at = None
        
        instance.is_done = is_done
        instance.save()
        return instance


class TaskBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk operations on tasks
    """
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of task IDs to update"
    )
    action = serializers.ChoiceField(
        choices=['complete', 'uncomplete', 'delete'],
        help_text="Action to perform on selected tasks"
    )
    
    def validate_task_ids(self, value):
        """
        Validate that all task IDs belong to the current user
        """
        user = self.context['request'].user
        valid_task_ids = set(
            Task.objects.filter(user=user, id__in=value).values_list('id', flat=True)
        )
        
        invalid_ids = set(value) - valid_task_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid task IDs: {list(invalid_ids)}"
            )
        
        return value


class TaskStatsSerializer(serializers.Serializer):
    """
    Serializer for task statistics
    """
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    tasks_by_category = serializers.DictField()
    tasks_by_priority = serializers.DictField()
    recent_activity = serializers.ListField()


class TaskSearchSerializer(serializers.Serializer):
    """
    Serializer for task search parameters
    """
    search = serializers.CharField(
        required=False,
        help_text="Search term for title and description"
    )
    category = serializers.IntegerField(
        required=False,
        help_text="Filter by category ID"
    )
    priority = serializers.ChoiceField(
        choices=Task.PRIORITY_CHOICES,
        required=False,
        help_text="Filter by priority"
    )
    is_done = serializers.BooleanField(
        required=False,
        help_text="Filter by completion status"
    )
    is_overdue = serializers.BooleanField(
        required=False,
        help_text="Filter overdue tasks"
    )
    deadline_from = serializers.DateTimeField(
        required=False,
        help_text="Filter tasks with deadline after this date"
    )
    deadline_to = serializers.DateTimeField(
        required=False,
        help_text="Filter tasks with deadline before this date"
    )
    ordering = serializers.ChoiceField(
        choices=[
            'created_at', '-created_at',
            'deadline', '-deadline',
            'priority', '-priority',
            'title', '-title'
        ],
        required=False,
        default='-created_at',
        help_text="Order results by field"
    )