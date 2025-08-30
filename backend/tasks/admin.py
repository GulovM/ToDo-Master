from django.contrib import admin
from django.utils.html import format_html
from .models import Task, TaskCategory


@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for TaskCategory model
    """
    list_display = ('name', 'colored_name', 'task_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at',)
    
    def colored_name(self, obj):
        """
        Display category name with its color
        """
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            obj.color,
            obj.name
        )
    colored_name.short_description = 'Category'
    
    def task_count(self, obj):
        """
        Display number of tasks in this category
        """
        return obj.tasks.count()
    task_count.short_description = 'Tasks'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Admin interface for Task model
    """
    list_display = (
        'title', 'user', 'is_done', 'priority', 'category', 
        'deadline', 'created_at', 'is_overdue'
    )
    list_filter = (
        'is_done', 'priority', 'category', 'created_at', 
        'deadline', 'user__is_active'
    )
    search_fields = ('title', 'description', 'user__email', 'user__first_name', 'user__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at', 'is_overdue')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Task Information', {
            'fields': ('title', 'description', 'user')
        }),
        ('Task Details', {
            'fields': ('is_done', 'priority', 'category', 'deadline')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_overdue(self, obj):
        """
        Display if task is overdue with color coding
        """
        if obj.is_overdue:
            return format_html('<span style="color: red; font-weight: bold;">Overdue</span>')
        elif obj.deadline and not obj.is_done:
            return format_html('<span style="color: orange;">Pending</span>')
        elif obj.is_done:
            return format_html('<span style="color: green;">Completed</span>')
        else:
            return format_html('<span style="color: gray;">No deadline</span>')
    is_overdue.short_description = 'Status'
    
    def save_model(self, request, obj, form, change):
        """
        Set user to current user if not specified
        """
        if not change and not obj.user_id:
            obj.user = request.user
        super().save_model(request, obj, form, change)
