# ☁️ Настройка Cloudflare Pages - Финальный шаг!

## ✅ Готово к деплою:
- ✅ Supabase Storage настроен
- ✅ Файлы загружены
- ✅ GitHub репозиторий готов

---

## 🚀 Cloudflare Pages - Последний шаг (3 минуты)

### Шаг 1: Откройте Cloudflare Dashboard

Перейдите на: **https://dash.cloudflare.com/**

Если нет аккаунта:
1. Создайте бесплатный аккаунт
2. Подтвердите email

### Шаг 2: Создайте Pages проект

1. В левом меню найдите **"Workers & Pages"**
2. Нажмите **"Create application"** (синяя кнопка справа)
3. Выберите вкладку **"Pages"**
4. Нажмите **"Connect to Git"**

### Шаг 3: Подключите GitHub

1. Выберите **GitHub**
2. При первом подключении:
   - Нажмите **"Authorize"**
   - Выберите какие репозитории дать доступ (можно только `pm-simulator`)
3. Выберите репозиторий: **`Pitcha-ru/pm-simulator`**
4. Нажмите **"Begin setup"**

### Шаг 4: Настройте Build

Заполните форму:

```
Project name: pm-simulator
Production branch: main
```

**Build settings:**

```
Framework preset: None (или Vite)
Build command: npm run build
Build output directory: dist
Root Directory (path): /
```

### Шаг 5: Environment Variables ⚠️ ВАЖНО!

Нажмите **"Environment variables (advanced)"**

**ВАЖНО:** Убедитесь что добавляете в **Production** (не Preview)!

Добавьте эти 4 переменные:

| Variable name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `https://oprtnnmlsmvdbboasels.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_acCJtIVPS5E4kQccw76dmw_Rfsk7z_O` |
| `VITE_SUPABASE_BUCKET` | `pm-sim-assets` |
| `VITE_SUPABASE_BASE_PATH` | `game/` |

**Как добавить:**
1. Нажмите **"Add variable"**
2. Введите имя переменной
3. Введите значение
4. Убедитесь что выбран **Production environment**
5. Повторите для всех 4 переменных

### Шаг 6: Deploy!

1. Нажмите **"Save and Deploy"** (внизу страницы)
2. ⏳ Подождите 1-2 минуты пока идет сборка
3. ✅ Готово!

---

## 🎉 Ваша игра онлайн!

После завершения деплоя Cloudflare покажет:

```
✅ Success! Your site is live at:
https://pm-simulator-xxx.pages.dev
```

### Проверьте работу:

1. Откройте URL в браузере
2. Должен загрузиться стартовый экран
3. Введите имя и начните игру
4. Проверьте что:
   - ✅ Иконки департаментов видны
   - ✅ Карточки задач появляются
   - ✅ Drag & drop работает
   - ✅ Лидерборд сохраняется

### Если белый экран:

1. Откройте консоль браузера (F12)
2. Посмотрите ошибки
3. Возможные причины:
   - Environment variables неправильно введены → проверьте шаг 5
   - Bucket не публичный в Supabase → Storage → pm-sim-assets → Settings → Make public
   - Файлы не в папке `game/` → проверьте структуру в Supabase

---

## ⚙️ Редактирование после деплоя

### Изменить баланс игры (БЕЗ редеплоя):

1. Зайдите в Supabase Dashboard
2. Storage → pm-sim-assets → game → config.json
3. Download → Редактируйте → Upload обратно
4. Игроки получат изменения при refresh

**Что можно менять:**
- Жизни
- Таймеры задач
- Очки и бонусы
- Шансы приоритетов
- Все параметры игры

См. [CONFIG_GUIDE.md](./CONFIG_GUIDE.md)

### Обновить код игры (автоматический редеплой):

```bash
# Внесите изменения
git add .
git commit -m "Update game"
git push

# Cloudflare автоматически пересоберет и задеплоит!
```

---

## 🎮 Готово!

Теперь у вас:
- ✅ Игра доступна всему миру
- ✅ Можно редактировать баланс без редеплоя
- ✅ Автоматический деплой при push
- ✅ Бесплатный хостинг

**Поделитесь ссылкой с друзьями и соберите feedback!** 🎉

---

## 📝 Дополнительно

### Кастомный домен (опционально)

1. В Cloudflare Pages → Custom domains
2. Add a custom domain
3. Следуйте инструкциям для DNS

### Analytics

Cloudflare предоставляет бесплатную аналитику:
- Pages проект → Analytics

### Troubleshooting

**Ошибки при сборке:**
- Проверьте что `npm run build` работает локально
- Посмотрите логи сборки в Cloudflare

**Игра не загружается:**
- Проверьте Environment variables
- Убедитесь что Supabase bucket публичный
- Проверьте консоль браузера (F12)

**Нужна помощь?**
- См. [DEPLOYMENT.md](./DEPLOYMENT.md) - раздел Troubleshooting
- См. [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

**Удачи! 🚀**



