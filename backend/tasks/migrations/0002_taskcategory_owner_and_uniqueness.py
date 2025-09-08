from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ('tasks', '0001_initial'),
    ]

    def seed_global_categories(apps, schema_editor):
        TaskCategory = apps.get_model('tasks', 'TaskCategory')
        defaults = [
            {'name': 'Работа', 'color': '#EF4444', 'description': 'Рабочие задачи и профессиональные активности'},
            {'name': 'Личные', 'color': '#10B981', 'description': 'Личные задачи и жизненные активности'},
        ]
        for d in defaults:
            TaskCategory.objects.get_or_create(name=d['name'], owner=None, defaults={'color': d['color'], 'description': d['description']})

    operations = [
        migrations.AddField(
            model_name='taskcategory',
            name='owner',
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='categories',
                null=True,
                blank=True,
                help_text='Owner of category (null for global)'
            ),
        ),
        migrations.AlterField(
            model_name='taskcategory',
            name='name',
            field=models.CharField(
                max_length=50,
                help_text='Category name (e.g., Work, Personal, Study)'
            ),
        ),
        migrations.AddConstraint(
            model_name='taskcategory',
            constraint=models.UniqueConstraint(fields=['name', 'owner'], name='unique_category_per_owner'),
        ),
        migrations.RunPython(seed_global_categories, reverse_code=migrations.RunPython.noop),
    ]
