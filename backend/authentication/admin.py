from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """
    Minimal admin for custom User without staff/superuser fields.
    Creating users via admin is not supported (no password forms wired).
    """
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'date_joined')
    list_filter = ('is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-date_joined',)
    readonly_fields = ('last_login', 'date_joined')
    fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 'last_login', 'date_joined')
