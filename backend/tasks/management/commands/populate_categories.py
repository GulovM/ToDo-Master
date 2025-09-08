from django.core.management.base import BaseCommand
from tasks.models import TaskCategory


class Command(BaseCommand):
    help = 'Populate default task categories'
    
    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Работа',
                'color': '#EF4444',  # Red
                'description': 'Рабочие задачи и профессиональные активности'
            },
            {
                'name': 'Личные',
                'color': '#10B981',  # Green
                'description': 'Личные задачи и жизненные активности'
            },
        ]
        
        created_count = 0
        for category_data in categories:
            # Create as global (owner=None)
            category, created = TaskCategory.objects.get_or_create(
                name=category_data['name'], owner=None,
                defaults={
                    'color': category_data['color'],
                    'description': category_data['description']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} new categories'
            )
        )
