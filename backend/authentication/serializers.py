from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
        }
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def validate_email(self, value):
        """
        Validate email uniqueness
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """
        Validate username uniqueness
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def create(self, validated_data):
        """
        Create user with encrypted password
        """
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """
        Validate login credentials
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Try to authenticate using email
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                # Try to find user by email and authenticate with username
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(
                        request=self.context.get('request'),
                        username=user_obj.username,
                        password=password
                    )
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password.')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'date_joined', 'is_active', 'task_count',
            'completed_task_count'
        )
        read_only_fields = ('id', 'username', 'date_joined', 'is_active')
    
    def get_task_count(self, obj):
        """
        Get total number of tasks for user
        """
        return obj.tasks.count()
    
    def get_completed_task_count(self, obj):
        """
        Get number of completed tasks for user
        """
        return obj.tasks.filter(is_done=True).count()


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'username')
    
    def validate_email(self, value):
        """
        Validate email uniqueness (excluding current user)
        """
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """
        Validate username uniqueness (excluding current user)
        """
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """
        Validate current password
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def validate(self, attrs):
        """
        Validate that new passwords match
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def save(self, **kwargs):
        """
        Set new password
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
