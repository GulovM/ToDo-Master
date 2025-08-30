# To-Do List Web Application

A full-stack To-Do list application built with Django REST Framework, React, Tailwind CSS, and PostgreSQL.

## Features

### Basic Functionality
- User registration and authentication
- Create, read, update, delete tasks
- Mark tasks as completed
- Task descriptions and titles

### Extended Functionality
- Task categories (study, work, personal)
- Deadlines with date and time
- Task filtering (all, completed, pending)
- Search functionality
- Task editing

## Tech Stack

- **Backend**: Django REST Framework
- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: Django JWT

## Project Structure

```
todo-app/
├── backend/          # Django REST API
│   ├── todo_project/ # Django project
│   ├── apps/        # Django applications
│   └── requirements.txt
├── frontend/        # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Database Schema

### Users Table
- id (Primary Key)
- username
- email
- password (hashed)
- first_name
- last_name
- date_joined

### Tasks Table
- id (Primary Key)
- title
- description
- is_done (boolean)
- deadline (datetime, nullable)
- category (string, nullable)
- created_at
- updated_at
- user_id (Foreign Key → users.id)

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Configure PostgreSQL database
6. Run migrations: `python manage.py migrate`
7. Create superuser: `python manage.py createsuperuser`
8. Start server: `python manage.py runserver`

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Database Setup
1. Install PostgreSQL
2. Create database: `todo_db`
3. Update database settings in Django settings

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Get current user

### Tasks
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get specific task
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `GET /api/tasks/?category=work` - Filter by category
- `GET /api/tasks/?search=keyword` - Search tasks

## Development

### Running the Application
1. Start PostgreSQL service
2. Start Django backend server (port 8000)
3. Start React frontend server (port 5173)
4. Access application at http://localhost:5173

### Testing
- Backend tests: `python manage.py test`
- Frontend tests: `npm run test`

## Future Enhancements
- Social media authentication (Google/GitHub)
- Email notifications
- Telegram bot integration
- Cloud storage integration
- Mobile responsive design
- Dark mode support