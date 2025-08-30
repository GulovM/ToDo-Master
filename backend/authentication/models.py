from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    """
    Custom user manager that uses email as the unique identifier
    and does not support staff/superuser roles.
    """
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            # Allow creating users without a password in certain flows
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # Superuser concept is not used; create a regular active user
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    """
    Minimal custom User model without is_staff/is_superuser fields.
    Email is used as the login identifier.
    """
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text='Required. 150 characters or fewer.'
    )
    email = models.EmailField(
        unique=True,
        help_text='Required. Enter a valid email address.'
    )
    first_name = models.CharField(
        max_length=30,
        help_text='Required. 30 characters or fewer.'
    )
    last_name = models.CharField(
        max_length=30,
        help_text='Required. 30 characters or fewer.'
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        help_text='Date when the user joined'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this user should be treated as active.'
    )

    # Manager & authentication configuration
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    # Compatibility helpers (no staff/superuser roles in this app)
    @property
    def is_staff(self):
        return False

    @property
    def is_superuser(self):
        return False

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()

    def get_short_name(self):
        return self.first_name
