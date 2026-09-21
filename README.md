# LocalAI Custom — Минимум, только чат

Самодостаточный ChatGPT-подобный интерфейс с регистрацией, лимитами и админкой. Без лишнего.

---

## ✨ Возможности

| Функция | Реализация |
|---------|------------|
| **Чат** | Только диалог, выбор модели, стриминг ответов |
| **Регистрация** | Email + пароль, JWT токены (7 дней) |
| **Usage limits** | Настраиваемые лимиты на пользователя (req/час), админ без лимитов |
| **Админ панель** | `/admin` — пользователи, роли, лимиты, статистика |
| **Модели** | Автозагрузка из Ollama, переключение в чате |
| **Стек** | FastAPI + React + PostgreSQL + Redis + Ollama + Nginx |

---

## 🏗 Архитектура

```
┌─────────────┐     HTTPS      ┌──────────────┐     Docker Network     ┌─────────────┐
│  Browser    │ ◄────────────► │   Nginx      │ ◄────────────────────► │  Backend    │
│  (React)    │                │  (Proxy/SSL) │                        │  (FastAPI)  │
└─────────────┘                └──────────────┘                        └──────┬──────┘
                                                                             │
                              ┌──────────────┐     ┌──────────────┐          │
                              │  PostgreSQL  │     │    Redis     │          │
                              │  (Users,     │     │  (Rate limit,│          │
                              │   Messages)  │     │   Sessions)  │          │
                              └──────────────┘     └──────────────┘          │
                                                                             │
                                                                             ▼
                                                                    ┌──────────────┐
                                                                    │   Ollama     │
                                                                    │  (Models)    │
                                                                    └──────────────┘
```

---

## 🚀 Быстрый деплой на Vultr ($20/мес — 2 vCPU / 4 GB RAM)

### 1. Создай сервер
- **Cloud Compute** → **Regular Performance** → **Ubuntu 24.04**
- **$20/mo** — 2 vCPU, 4 GB RAM, 80 GB SSD
- Добавь SSH ключ

### 2. Задеплой одной командой
```bash
ssh root@ТВОЙ_IP
curl -fsSL https://raw.githubusercontent.com/ТВОЙ_ЮЗЕР/LocalAI-Custom/main/scripts/deploy-vultr.sh | bash
```

### 3. Готово
- Открой `http://IP` — регистрация/логин
- Админка: `http://IP/admin` (email/password из .env)

---

## 🔧 Локальная разработка

```bash
git clone https://github.com/ТВОЙ_ЮЗЕР/LocalAI-Custom.git
cd LocalAI-Custom

# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Заполни .env
uvicorn app.main:app --reload --port 8000

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
# Открой http://localhost:3000
```

---

## 📁 Структура проекта

```
LocalAI-Custom/
├── docker-compose.yml          # Полный стек
├── .env.example                # Шаблон секретов
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI + FastAPI-Users + SQLAdmin
│       ├── models.py           # User, ChatMessage
│       ├── schemas.py          # Pydantic
│       ├── auth.py             # JWT, регистрация, логин
│       ├── ollama_client.py    # Прокси к Ollama
│       ├── rate_limit.py       # Redis rate limiting per user
│       ├── admin.py            # SQLAdmin панели
│       ├── database.py         # DB сессии
│       └── config.py           # Настройки из .env
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── Chat.tsx        # Основной чат
│       │   ├── Message.tsx     # Markdown + code highlighting
│       │   ├── ModelSelect.tsx # Выбор модели
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   └── AdminPanel.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useChat.ts      # SSE стриминг
│       │   └── useModels.ts
│       ├── lib/
│       │   ├── api.ts          # Axios + interceptor
│       │   └── utils.ts
│       ├── types.ts
│       └── styles/globals.css
├── nginx/
│   └── nginx.conf              # Reverse proxy + SSE
├── scripts/
│   └── deploy-vultr.sh         # Деплой на Vultr
└── certbot/                    # SSL (авто)
```

---

## ⚙️ Переменные окружения (.env)

```env
DB_PASSWORD=                    # openssl rand -base64 24
SECRET_KEY=                     # openssl rand -base64 32
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=                 # openssl rand -base64 16
RATE_LIMIT_PER_MINUTE=50
DOMAIN=yourdomain.com
```

---

## 🛠 Команды управления

```bash
# Логи
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ollama

# Модели
docker exec -it localai-custom-ollama-1 ollama pull dolphin-llama3:8b
docker exec -it localai-custom-ollama-1 ollama pull qwen2.5:7b
docker exec -it localai-custom-ollama-1 ollama list

# Бэкап
docker exec localai-custom-postgres-1 pg_dump -U localai localai > backup.sql
tar -czf backup-$(date +%F).tar.gz docker/volumes/postgres_data docker/volumes/ollama_data

# Обновление
cd /opt/LocalAI-Custom && git pull && docker compose build && docker compose up -d

# Рестарт
docker compose restart
```

---

## 🔐 Админка

После деплоя:
1. Зайди на `http://IP/admin`
2. Логин: `ADMIN_EMAIL` из .env
3. Пароль: `ADMIN_PASSWORD` из .env

**Возможности:**
- Просмотр/редактирование пользователей
- Назначение админов
- Блокировка/активация аккаунтов
- Настройка лимитов (req/час) на пользователя
- Статистика: всего юзеров, сообщений, за сегодня
- Удаление пользователей

---

## 🦙 Рекомендуемые модели

```bash
# Нецензурная + tools (функции)
docker exec -it localai-custom-ollama-1 ollama pull dolphin-llama3:8b

# Мягкая цензура + tools + умнее
docker exec -it localai-custom-ollama-1 ollama pull qwen2.5:7b

# Официальная Llama + tools
docker exec -it localai-custom-ollama-1 ollama pull llama3.1:8b
```

---

## 🔒 SSL (Let's Encrypt)

```bash
# На сервере (после настройки DNS A-записи)
docker run -it --rm \
  -v /opt/LocalAI-Custom/certbot/conf:/etc/letsencrypt \
  -v /opt/LocalAI-Custom/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
```

Nginx автоматически подхватит сертификаты из `./certbot/conf`.

---

## 📦 Используемые open-source проекты

| Компонент | Проект | За что отвечает |
|-----------|--------|-----------------|
| **Auth** | [FastAPI-Users](https://github.com/fastapi-users/fastapi-users) | JWT, регистрация, логин, сброс пароля |
| **Admin** | [SQLAdmin](https://github.com/aminalaee/sqladmin) | Авто-админка для SQLAlchemy |
| **Rate Limit** | [SlowAPI](https://github.com/lauralet/SlowAPI) | Лимиты на IP + кастомные на юзера |
| **Ollama** | [ollama-python](https://github.com/ollama/ollama-python) | Клиент для Ollama API |
| **Frontend UI** | [NextChat](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web) | Компоненты чата, markdown, код |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) | UI компоненты |

---

## 📄 Лицензия

MIT — используй, меняй, продавай.