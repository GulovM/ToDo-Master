from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import login
from django.utils import timezone
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer
)
from decouple import config
try:
    # Optional google auth (installed if GOOGLE_CLIENT_ID configured)
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
except Exception:  # pragma: no cover
    google_id_token = None
    google_requests = None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer to include user data
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token
    
    def validate(self, attrs):
        # Use email as username for authentication
        email = attrs.get('username')  # DRF uses 'username' field
        password = attrs.get('password')
        
        try:
            user = User.objects.get(email=email)
            attrs['username'] = user.username
        except User.DoesNotExist:
            pass
        
        data = super().validate(attrs)
        
        # Add user data to response
        user_serializer = UserProfileSerializer(self.user)
        data['user'] = user_serializer.data
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view
    """
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        # Get user profile data
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': user_serializer.data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API endpoint for user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        login(request, user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user profile data
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'message': 'Login successful',
            'user': user_serializer.data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    API endpoint for user logout
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            # Best-effort blacklist: ignore errors in environments without blacklist app
            try:
                token = RefreshToken(refresh_token)
                try:
                    token.blacklist()
                except Exception:
                    pass
            except Exception:
                pass

        # Always return success – frontend clears tokens client-side
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating user profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileSerializer
        return UserUpdateSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return updated profile data
        profile_serializer = UserProfileSerializer(instance)
        return Response({
            'message': 'Profile updated successfully',
            'user': profile_serializer.data
        })


class ChangePasswordView(APIView):
    """
    API endpoint for changing user password
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """
    Delete the authenticated user's account. Cascades to tasks via FK.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        # Best-effort: attempt to blacklist the refresh token if provided
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                try:
                    token.blacklist()
                except Exception:
                    pass
            except Exception:
                pass
        email = user.email
        user.delete()
        return Response({'message': f'Account {email} deleted'}, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """
    Authenticate with Google ID token (Google Identity Services).
    Expects: {"id_token": "..."}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        client_id = config('GOOGLE_CLIENT_ID', default=None)
        id_tok = (request.data or {}).get('id_token')
        if not id_tok:
            return Response({'error': 'id_token_missing'}, status=status.HTTP_400_BAD_REQUEST)
        if not client_id:
            return Response({'error': 'client_id_missing'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        # Try a late import in case the module became available after startup
        _id_token = google_id_token
        _requests = google_requests
        if _id_token is None or _requests is None:
            try:
                from google.oauth2 import id_token as _id_token  # type: ignore
                from google.auth.transport import requests as _requests  # type: ignore
            except Exception as e:
                return Response({'error': 'google_auth_library_missing', 'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            idinfo = _id_token.verify_oauth2_token(id_tok, _requests.Request(), client_id)
            if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer')
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Email missing'}, status=status.HTTP_400_BAD_REQUEST)
            first_name = (idinfo.get('given_name') or '').strip() or 'User'
            last_name = (idinfo.get('family_name') or '').strip() or 'Google'
            username_base = email.split('@')[0]
            username = username_base
            # Ensure unique username
            suffix = 1
            while User.objects.filter(username=username).exclude(email=email).exists():
                username = f"{username_base}{suffix}"
                suffix += 1

            user, created = User.objects.get_or_create(
                email=email,
                defaults={'first_name': first_name, 'last_name': last_name, 'username': username}
            )
            if created and not user.has_usable_password():
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)
            user_serializer = UserProfileSerializer(user)
            return Response({
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        except Exception as e:
            return Response({'error': 'Invalid Google token', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    Get user statistics
    """
    user = request.user
    total_tasks = user.tasks.count()
    completed_tasks = user.tasks.filter(is_done=True).count()
    pending_tasks = total_tasks - completed_tasks
    overdue_tasks = user.tasks.filter(
        deadline__lt=timezone.now(),
        is_done=False
    ).count()
    
    return Response({
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'overdue_tasks': overdue_tasks,
        'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    API health check endpoint
    """
    return Response({
        'status': 'healthy',
        'message': 'Authentication API is running'
    })
