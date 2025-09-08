from django.db import models
from django.conf import settings
from django.utils import timezone


class TaskCategory(models.Model):
    """
    Model for task categories
    """
    name = models.CharField(
        max_length=50,
        help_text='Category name (e.g., Work, Personal, Study)'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories',
        null=True,
        blank=True,
        help_text='Owner of category (null for global)'
    )
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text='Hex color code for the category'
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text='Optional description of the category'
    )
    created_at = models.DateTimeField(
        default=timezone.now
    )
    
    class Meta:
        db_table = 'task_categories'
        verbose_name = 'Task Category'
        verbose_name_plural = 'Task Categories'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name', 'owner'], name='unique_category_per_owner')
        ]
    
    def __str__(self):
        return self.name


class Task(models.Model):
    """
    Model for user tasks with full functionality
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    title = models.CharField(
        max_length=200,
        help_text='Task title'
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text='Detailed description of the task'
    )
    is_done = models.BooleanField(
        default=False,
        help_text='Whether the task is completed'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text='Task priority level'
    )
    deadline = models.DateTimeField(
        blank=True,
        null=True,
        help_text='Optional deadline for the task'
    )
    category = models.ForeignKey(
        TaskCategory,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='tasks',
        help_text='Task category'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='User who owns this task'
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text='When the task was created'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='When the task was last updated'
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text='When the task was completed'
    )
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_done']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['deadline']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        status = "✓" if self.is_done else "○"
        return f"{status} {self.title} - {self.user.get_short_name()}"
    
    def save(self, *args, **kwargs):
        """
        Override save method to set completed_at timestamp
        """
        if self.is_done and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_done and self.completed_at:
            self.completed_at = None
        
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """
        Check if the task is overdue
        """
        if self.deadline and not self.is_done:
            return timezone.now() > self.deadline
        return False
    
    @property
    def days_until_deadline(self):
        """
        Get number of days until deadline
        """
        if self.deadline:
            delta = self.deadline - timezone.now()
            return delta.days
        return None
    
    def get_category_name(self):
        """
        Get category name or default value
        """
        return self.category.name if self.category else 'No Category'
    
    def get_priority_display_color(self):
        """
        Get color for priority display
        """
        colors = {
            'low': '#10B981',    # Green
            'medium': '#F59E0B',  # Yellow
            'high': '#EF4444',    # Red
        }
        return colors.get(self.priority, '#6B7280')  # Gray default


class ChatSession(models.Model):
    """
    AI chat session per user.
    Keeps short metadata and timestamps.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_chat_sessions'
    )
    title = models.CharField(max_length=120)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_chat_sessions'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat {self.id}: {self.title}"


class ChatMessage(models.Model):
    """
    Individual messages in a chat session.
    role: 'user' | 'assistant'
    """
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=16)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ai_chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:30]}..."
