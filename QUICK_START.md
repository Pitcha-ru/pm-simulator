# 🚀 Быстрый старт

## Локальная разработка (3 команды)

```bash
npm install
npm run dev
# Откроется http://localhost:3000
```

Готово! Игра работает с локальными конфигами.

---

## Деплой в продакшн (10 минут)

### 1️⃣ Supabase Storage (5 минут)

1. Создайте проект на https://supabase.com
2. Создайте PUBLIC bucket: `pm-sim-assets`
3. Загрузите файлы:
   ```
   pm-sim-assets/
   └── game/
       ├── config.json
       ├── departments.json
       ├── task_authors.json
       ├── priority_comments.json
       ├── dep-icons/ (11 файлов)
       ├── priority-icons/ (3 файла)
       └── authors-icons/ (5 файлов)
   ```

**Быстрая загрузка через CLI:**
```bash
npm install -g supabase
supabase login
./upload-to-supabase.sh
```

📖 Подробно: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 2️⃣ Cloudflare Pages (3 минуты)

1. Push проект на GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo>
   git push -u origin main
   ```

2. Создайте проект на https://dash.cloudflare.com
   - Workers & Pages → Create → Connect to Git
   - Выберите репозиторий
   - Build command: `npm run build`
   - Output directory: `dist`

3. Добавьте Environment Variables (Production):
   - `VITE_SUPABASE_URL` = ваш Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key из Supabase
   - `VITE_SUPABASE_BUCKET` = `pm-sim-assets`
   - `VITE_SUPABASE_BASE_PATH` = `game/`

4. Save and Deploy

### 3️⃣ Готово! ✨

Ваша игра онлайн: `https://your-project.pages.dev`

📖 Подробная инструкция: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔧 Редактирование баланса БЕЗ редеплоя

1. Зайдите в Supabase Dashboard → Storage → `pm-sim-assets/game/`
2. Измените `config.json`
3. Сохраните
4. Игроки получат изменения при перезагрузке (Ctrl+F5)

📖 Что можно менять: [CONFIG_GUIDE.md](./CONFIG_GUIDE.md)

---

## 📚 Полная документация

| Файл | Описание |
|------|----------|
| [README.md](./README.md) | Общее описание проекта |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Полная инструкция по деплою |
| [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | Чеклист для деплоя |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Настройка Supabase с скриншотами |
| [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) | Руководство по балансу игры |
| [pm-simulator.md](./pm-simulator.md) | Техническое задание |

---

## ⚡ Команды

```bash
npm run dev        # Разработка (localhost:3000)
npm run build      # Production сборка
npm run preview    # Предпросмотр build
```

---

## 🆘 Помощь

**Белый экран?**
- Откройте консоль (F12) → проверьте ошибки
- Убедитесь что Supabase bucket публичный
- Проверьте environment variables в Cloudflare

**Конфиги не обновляются?**
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R на Mac)
- Очистите кэш браузера

**Вопросы?**
- Посмотрите [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting)
- Проверьте консоль браузера на ошибки

---

**Готово! Начните играть! 🎮**

