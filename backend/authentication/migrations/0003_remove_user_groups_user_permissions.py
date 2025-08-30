from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_remove_user_is_staff_is_superuser'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='groups',
        ),
        migrations.RemoveField(
            model_name='user',
            name='user_permissions',
        ),
    ]

