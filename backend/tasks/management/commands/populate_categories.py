from django.core.management.base import BaseCommand
from tasks.models import TaskCategory


class Command(BaseCommand):
    help = 'Populate default task categories'
    
    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Work',
                'color': '#EF4444',  # Red
                'description': 'Work-related tasks and professional activities'
            },
            {
                'name': 'Personal',
                'color': '#10B981',  # Green
                'description': 'Personal tasks and life activities'
            },
            {
                'name': 'Study',
                'color': '#3B82F6',  # Blue
                'description': 'Educational and learning activities'
            },
            {
                'name': 'Health',
                'color': '#F59E0B',  # Yellow
                'description': 'Health and fitness related tasks'
            },
            {
                'name': 'Shopping',
                'color': '#8B5CF6',  # Purple
                'description': 'Shopping lists and purchases'
            },
            {
                'name': 'Home',
                'color': '#06B6D4',  # Cyan
                'description': 'Household chores and maintenance'
            },
        ]
        
        created_count = 0
        for category_data in categories:
            category, created = TaskCategory.objects.get_or_create(
                name=category_data['name'],
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