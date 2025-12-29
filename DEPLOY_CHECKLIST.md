# 📋 Быстрый чеклист деплоя

## Шаг 1: Supabase (5 минут)

- [ ] Создать проект на https://supabase.com
- [ ] Создать bucket `pm-sim-assets` (публичный)
- [ ] Создать папку `game/` в bucket
- [ ] Загрузить файлы:
  - [ ] `config.json`
  - [ ] `departments.json`
  - [ ] `task_authors.json`
  - [ ] `priority_comments.json`
  - [ ] Папка `dep-icons/` (11 файлов)
  - [ ] Папка `priority-icons/` (3 файла)
  - [ ] Папка `authors-icons/` (5 файлов)
- [ ] Скопировать **Project URL** и **anon key** из Settings > API

## Шаг 2: Git (2 минуты)

```bash
git init
git add .
git commit -m "Initial commit"
# Создать репозиторий на GitHub
git remote add origin <your-repo-url>
git push -u origin main
```

## Шаг 3: Cloudflare Pages (3 минуты)

- [ ] Зайти на https://dash.cloudflare.com
- [ ] Workers & Pages > Create > Connect to Git
- [ ] Выбрать репозиторий
- [ ] Build settings:
  - Build command: `npm run build`
  - Output directory: `dist`
- [ ] Environment Variables (Production):
  - [ ] `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
  - [ ] `VITE_SUPABASE_ANON_KEY` = ваш ключ
  - [ ] `VITE_SUPABASE_BUCKET` = `pm-sim-assets`
  - [ ] `VITE_SUPABASE_BASE_PATH` = `game/`
- [ ] Save and Deploy

## Шаг 4: Проверка (1 минута)

- [ ] Открыть URL игры
- [ ] Проверить что игра загружается
- [ ] Изменить что-то в `config.json` в Supabase
- [ ] Перезагрузить игру (Ctrl+F5)
- [ ] Убедиться что изменения применились

---

## 🎉 Готово!

**URL игры:** `https://your-project.pages.dev`

**Редактировать конфиги:**
1. Supabase Dashboard > Storage > pm-sim-assets > game/
2. Изменить нужный файл
3. Игроки получат обновления при перезагрузке страницы

**Обновить код:**
```bash
git add .
git commit -m "Update"
git push
# Cloudflare автоматически задеплоит
```

