# 📁 Структура проекта PM Simulator

## Визуальная карта проекта

```
pm-simulator/
│
├── 🏠 ГЛАВНЫЕ ФАЙЛЫ ИГРЫ
│   ├── index.html                  # Главная HTML страница
│   ├── styles.css                  # Все CSS стили (YouTrack theme)
│   └── js/                         # JavaScript модули
│       ├── main.js                 # ⚡ Главный контроллер, игровой цикл
│       ├── gameState.js            # 🎲 Управление состоянием игры
│       ├── gameLogic.js            # 🧮 Формулы и расчеты
│       ├── dragDrop.js             # 🖱️ Система drag & drop
│       ├── ui.js                   # 🎨 Менеджер интерфейса
│       ├── supabaseLoader.js       # 📥 Загрузчик данных
│       └── utils.js                # 🔧 Утилиты
│
├── 📊 ИГРОВЫЕ ДАННЫЕ (JSON)
│   ├── departments.json            # 11 отделов, задачи каждого
│   ├── config.json                 # Настройки: уровни, таймеры, очки
│   ├── task_authors.json           # 5 авторов задач
│   └── priority_comments.json      # Комментарии для приоритетов
│
├── 🖼️ ГРАФИЧЕСКИЕ РЕСУРСЫ
│   ├── dep-icons/                  # Иконки отделов (11 файлов)
│   │   ├── icon_backend.png
│   │   ├── icon_ban_team.png
│   │   ├── icon_casino.png
│   │   ├── icon_lk.png
│   │   ├── icon_o_team.png
│   │   ├── icon_payments.png
│   │   ├── icon_rules.png
│   │   ├── icon_seo.png
│   │   ├── icon_sys_admins.png
│   │   ├── icon_web.png
│   │   └── icon_welcome.png
│   │
│   ├── priority-icons/             # Иконки приоритетов (3 файла)
│   │   ├── critical.png
│   │   ├── regular.png
│   │   └── serious.png
│   │
│   └── authors-icons/              # Аватары авторов (5 файлов)
│       ├── avatar_anna.png
│       ├── avatar_dmitry.png
│       ├── avatar_ekaterina.png
│       ├── avatar_igor.png
│       └── avatar_maria.png
│
├── ⚙️ КОНФИГУРАЦИЯ ПРОЕКТА
│   ├── package.json                # NPM зависимости и скрипты
│   ├── package-lock.json           # Lock-файл зависимостей
│   ├── vite.config.js              # Настройки Vite сборщика
│   ├── copy-assets.js              # Скрипт копирования assets в dist
│   ├── wrangler.toml               # Cloudflare Workers конфиг
│   ├── env.example.txt             # Пример .env файла
│   ├── .gitignore                  # Git ignore правила
│   └── .cursorignore               # Cursor ignore правила
│
├── 📚 ДОКУМЕНТАЦИЯ
│   ├── START_HERE.md               # 👈 НАЧНИТЕ С ЭТОГО!
│   ├── QUICKSTART.md               # Быстрый старт (5 минут)
│   ├── README.md                   # Полная документация
│   ├── DEPLOYMENT.md               # Гайд по деплою
│   ├── DEVELOPER_NOTES.md          # Для разработчиков
│   ├── PROJECT_SUMMARY.md          # Сводка проекта
│   ├── PROJECT_STRUCTURE.md        # Этот файл
│   ├── CHECKLIST.md                # Чеклист готовности
│   └── pm-simulator.md             # Техническое задание
│
└── 📦 ГЕНЕРИРУЕМЫЕ ФАЙЛЫ (не в git)
    ├── node_modules/               # NPM пакеты
    ├── dist/                       # Продакшн сборка
    ├── .env                        # Переменные окружения
    └── *.log                       # Лог-файлы
```

---

## 🎯 Назначение ключевых файлов

### JavaScript модули

| Файл | Строк | Назначение |
|------|-------|-----------|
| `main.js` | ~250 | Главный контроллер, инициализация, игровой цикл |
| `gameState.js` | ~150 | Хранение состояния: уровень, очки, текущая задача |
| `gameLogic.js` | ~200 | Чистые функции: расчеты очков, таймеров, приоритетов |
| `dragDrop.js` | ~180 | Обработка drag & drop для мыши и тача |
| `ui.js` | ~200 | Рендеринг, анимации, обновление интерфейса |
| `supabaseLoader.js` | ~120 | Загрузка данных из Supabase или локально |
| `utils.js` | ~80 | Математические утилиты, форматирование |

### JSON данные

| Файл | Размер | Содержание |
|------|--------|-----------|
| `departments.json` | ~15 KB | 11 отделов, ~500 задач |
| `config.json` | ~3 KB | Настройки балансировки |
| `task_authors.json` | ~500 B | 5 авторов с аватарами |
| `priority_comments.json` | ~5 KB | 60+ сообщений для 3 приоритетов |

### Документация

| Файл | Для кого | Примерное время чтения |
|------|----------|------------------------|
| `START_HERE.md` | Новички | 2 минуты |
| `QUICKSTART.md` | Пользователи | 5 минут |
| `README.md` | Все | 10 минут |
| `DEPLOYMENT.md` | DevOps | 15 минут |
| `DEVELOPER_NOTES.md` | Разработчики | 20 минут |
| `PROJECT_SUMMARY.md` | PM/Заказчик | 10 минут |
| `CHECKLIST.md` | QA/Тестеры | 15 минут |
| `PROJECT_STRUCTURE.md` | Все | 5 минут (этот файл) |

---

## 🔄 Поток данных

```
[Supabase Storage] OR [Local Files]
         ↓
   supabaseLoader.js
         ↓
     gameData {}
         ↓
    GameState class
         ↓
   ┌────────────────┐
   │  Game Loop     │
   │  (main.js)     │
   └────────────────┘
         ↓
   ┌────────────────────────────┐
   │  Task spawn                │
   │  - gameLogic.js (formulas) │
   │  - gameState.js (storage)  │
   └────────────────────────────┘
         ↓
   ┌────────────────┐
   │  UI render     │
   │  (ui.js)       │
   └────────────────┘
         ↓
   ┌────────────────┐
   │  User action   │
   │  (dragDrop.js) │
   └────────────────┘
         ↓
   ┌────────────────────────────┐
   │  Validation & scoring      │
   │  - gameLogic.js            │
   │  - gameState.js update     │
   └────────────────────────────┘
         ↓
   ┌────────────────┐
   │  UI update     │
   │  (ui.js)       │
   └────────────────┘
         ↓
    [Next task OR Level up]
```

---

## 📐 Архитектура кода

### Слои приложения

```
┌─────────────────────────────────┐
│    main.js (Orchestrator)       │  ← Главный контроллер
├─────────────────────────────────┤
│    ui.js (Presentation)         │  ← Отображение
├─────────────────────────────────┤
│    dragDrop.js (Interaction)    │  ← Взаимодействие
├─────────────────────────────────┤
│    gameState.js (State)         │  ← Состояние
├─────────────────────────────────┤
│    gameLogic.js (Business Logic)│  ← Бизнес-логика
├─────────────────────────────────┤
│    utils.js (Utilities)         │  ← Утилиты
├─────────────────────────────────┤
│  supabaseLoader.js (Data Layer) │  ← Данные
└─────────────────────────────────┘
```

### Принципы
- **Separation of Concerns**: Каждый модуль отвечает за свою область
- **Pure Functions**: gameLogic.js содержит только чистые функции
- **Single Source of Truth**: Состояние в GameState
- **Dependency Injection**: Модули получают зависимости через конструктор

---

## 🎨 CSS архитектура

```css
styles.css
├── CSS Variables          (colors, spacing, etc)
├── Global Styles          (reset, body, fonts)
├── Loading Screen         (spinner, text)
├── Error Screen           (panel, button)
├── Game Container         (layout)
├── Top Header             (author panel, scoreboard)
├── Center Board Area      (task card, timer, animations)
├── Bottom Departments     (dock, blocks, hover effects)
└── Responsive Design      (media queries)
```

**Методология**: BEM-like naming, компонентный подход

---

## 🗂️ Зависимости

### Production
- **Vite**: ^5.0.0 (сборщик)

### Runtime (браузер)
- Vanilla JavaScript (ES6 modules)
- CSS3 (Grid, Flexbox, Animations)
- Fetch API
- DOM API

### Нет зависимостей
- ❌ Фреймворков (React, Vue, etc)
- ❌ UI библиотек (Bootstrap, etc)
- ❌ Утилит (lodash, etc)

**Размер bundle**: ~50 KB (минифицированный)

---

## 📦 Процесс сборки

```
Source files          Build process         Output
─────────────────    ─────────────────    ───────────────
index.html     ─┐
styles.css     ─┤
js/*.js        ─┤──► npm run build ──►  dist/
*.json         ─┤                         ├── index.html
*-icons/       ─┘                         ├── assets/*.js
                                          ├── assets/*.css
                                          ├── *.json
                                          └── *-icons/
```

### Шаги сборки
1. `vite build` - собирает HTML/CSS/JS
2. `copy-assets.js` - копирует JSON и иконки
3. Результат в `dist/` готов к деплою

---

## 🚀 Deployment paths

### Local Development
```
Source → Dev Server (Vite) → Browser
```

### Cloudflare Pages (Local files)
```
Source → npm run build → dist/ → Cloudflare Pages → CDN
```

### Cloudflare Pages + Supabase
```
Source → npm run build → dist/ → Cloudflare Pages
                                        ↓
                                  Browser load
                                        ↓
JSON/Icons ← Supabase Storage ← Fetch at runtime
```

---

## 🔐 Environment Variables

### Local (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_BUCKET=pm-sim-assets
VITE_SUPABASE_BASE_PATH=game/
```

### Cloudflare Pages
Те же переменные устанавливаются через Dashboard

### Fallback
Если переменные не установлены → использование локальных файлов

---

## 📊 Размеры файлов (примерно)

```
Total project size: ~2 MB

Code:
  - HTML: ~5 KB
  - CSS: ~15 KB
  - JS (all): ~50 KB (source), ~20 KB (minified)

Data:
  - JSON (all): ~25 KB

Assets:
  - Icons: ~500 KB
  - Avatars: ~300 KB

Documentation:
  - MD files: ~100 KB

Dependencies:
  - node_modules: ~10 MB (dev only)

Built dist/:
  - Total: ~850 KB (ready to deploy)
```

---

## 🎯 Entry Points

### Пользователь
1. Открывает `START_HERE.md`
2. Запускает `npm run dev`
3. Играет в браузере

### Разработчик
1. Читает `DEVELOPER_NOTES.md`
2. Изучает `js/main.js`
3. Модифицирует модули

### DevOps
1. Читает `DEPLOYMENT.md`
2. Настраивает CI/CD
3. Деплоит `dist/`

---

## ✅ Чек-лист перед деплоем

- [ ] `npm run build` выполнен успешно
- [ ] Папка `dist/` содержит все файлы
- [ ] JSON файлы в dist/ (4 шт)
- [ ] Иконки в dist/ (3 папки)
- [ ] Тестирование через `npm run preview`
- [ ] Environment variables настроены (если Supabase)
- [ ] .gitignore правильный
- [ ] Документация актуальна

---

## 🎓 Обучающий путь

### Уровень 1: Игрок (10 минут)
1. `START_HERE.md`
2. `npm run dev`
3. Играть!

### Уровень 2: Кастомизатор (30 минут)
1. `QUICKSTART.md` → раздел кастомизации
2. Редактировать JSON
3. Перезапустить

### Уровень 3: Деплоер (1 час)
1. `DEPLOYMENT.md`
2. Cloudflare Pages setup
3. Deploy!

### Уровень 4: Разработчик (2-3 часа)
1. `DEVELOPER_NOTES.md`
2. Изучить код модулей
3. Добавить функционал

---

**📌 Совет**: Начните с `START_HERE.md` и следуйте инструкциям!

