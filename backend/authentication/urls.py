from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # JWT token endpoints
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('delete-account/', views.DeleteAccountView.as_view(), name='delete_account'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('stats/', views.user_stats, name='user_stats'),

    # Social auth
    path('google/', views.GoogleLoginView.as_view(), name='google_login'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),
]
