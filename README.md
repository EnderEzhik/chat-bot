## Чат бот тех поддержки солнца
Простой сервис техподдержки, где пользователь переписывается с ботом‑консультантом. Бэкенд построен на FastAPI, хранит диалоги в SQLite и выдаёт SPA фронтенд из каталога `src/static`.

### Основные возможности
- Регистрация и вход с выдачей JWT.
- Создание чат‑сессии и обмен сообщениями с ботом.
- История диалога: получение и удаление.
- Встроенный фронтенд (HTML/JS/CSS) доступен по корневому URL.
- Логи приложения складываются в `logs/app.log`.

### Технологический стек
- Язык: Python
- Web API: FastAPI + Uvicorn
- База данных: SQLite (async `aiosqlite`)
- ORM и миграции: SQLAlchemy + Alembic
- Аутентификация: JWT (PyJWT) + Argon2 (pwdlib) для паролей
- Тесты: pytest, httpx

### Структура проекта
```
├── src
│   ├── main.py              # Инициализация FastAPI, статика и роуты
│   ├── api
│   │   ├── deps.py          # Depends: сессия БД, текущий пользователь
│   │   └── routes
│   │       ├── auth.py      # Регистрация и логин
│   │       └── chat.py      # Сессия чата, сообщения, история
│   ├── core
│   │   ├── database.py      # Подключение к SQLite (async engine)
│   │   ├── logging.py       # Конфигурация loguru
│   │   └── security.py      # JWT, хеширование паролей
│   ├── models               # SQLAlchemy модели и Pydantic схемы
│   ├── repositories         # Работа с БД: users, sessions, messages
│   └── services
│       └── bot.py           # Правила ответов бота
├── src/static               # Фронтенд (index.html, script.js, style.css, utils.js)
├── alembic                  # Миграции
├── requirements.txt
└── db.db                    # Локальная БД (создаётся/мигрируется)
```

### Установка и запуск
0. Скачайте проект
   ```bash
   git clone https://github.com/EnderEzhik/chat-bot.git
   ```
1. Подготовьте окружение
   ```bash
   pip install -r requirements.txt
   ```
2. Создайте миграцию
   ```bash
   alembic revision --autogenerate -m "init"
   ```
3. Примените миграции
   ```bash
   alembic upgrade head
   ```
4. Запустите сервер разработки
   ```bash
   uvicorn src.main:app --reload
   ```
5. Проверьте доступность:
   - API: `http://127.0.0.1:8000/docs` (интерактивная спецификация Swagger/OpenAPI, удобно тестировать все ендпоинты).
   - Фронтенд: `http://127.0.0.1:8000/` (редирект на `static/index.html`).

### Конфигурация
- База данных: `sqlite+aiosqlite:///db.db` (см. `src/core/database.py`).
- JWT: алгоритм HS256, `SECRET_KEY` в `src/core/security.py`, срок токена по умолчанию 30 минут (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- Логи: `logs/app.log`, ротация 10 MB, хранение 7 дней (`src/core/logging.py`).

### Модели данных (основные поля)
- User (`users`)
  - `id`: int, PK
  - `username`: str (уникальный, 4–20)
  - `hashed_password`: str (Argon2)
- Session (`sessions`)
  - `id`: str UUID, PK
  - `user_id`: FK → users.id, cascade delete
  - `created_date`: datetime
- Message (`messages`)
  - `id`: int, PK
  - `session_id`: FK → sessions.id, cascade delete
  - `sender_type`: "user" | "bot" (CheckConstraint)
  - `text`: str (обязательное)
  - `sent_at`: datetime (server default)
- Token (Pydantic)
  - `access_token`: str
- TokenData (Pydantic)
  - `username`: str

### API
Все защищённые ендпоинты требуют заголовок `Authorization: Bearer <access_token>`.

- `POST /auth/register`
  - Тело: `{ "username": str, "password": str }`
  - 201, создаёт пользователя.
- `POST /auth/login`
  - Тело: `{ "username": str, "password": str }`
  - Ответ: `{ "access_token": str }` (JWT, истекает через 30 минут).
- `POST /chat/session`
  - Создаёт чат‑сессию для текущего пользователя.
  - Ответ: `{ "id": str, "user_id": int, "created_date": datetime }`
- `POST /chat/message`
  - Тело: `{ "session_id": str, "sender_type": "user"|"bot", "text": str }`
  - Сохраняет сообщение; если отправитель `user`, бот добавит ответ с задержкой ~2 сек и вернёт `{ "answer": str }`.
- `GET /chat/history/{session_id}`
  - Возвращает список сообщений выбранной сессии.
- `DELETE /chat/history/{session_id}`
  - Удаляет все сообщения сессии.
- `GET /` → редирект на фронтенд `static/index.html`.
- `GET /docs`
  - Автодокументация FastAPI. Используйте для изучения схем, авторизации и тестирования ендпоинтов.

### Фронтенд
- Расположен в `src/static`. При запуске доступен по `/`.
- Взаимодействует с API: регистрация/логин, создание сессии, отправка сообщений, вывод истории.

### Тестирование
```bash
pytest -v
```

### Полезное
- Обновить зависимости: `pip install -r requirements.txt`
- Пересоздать БД с нуля: удалить `db.db`, затем `alembic upgrade head`
- Изменить секрет JWT: отредактировать `SECRET_KEY` в `src/core/security.py`
