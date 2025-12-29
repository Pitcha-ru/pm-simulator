# Отладка белого экрана

## Проблема
Белый экран на http://localhost:3000

## Возможные причины

1. **JavaScript не загружается**
   - Проверьте консоль браузера (F12 → Console)
   - Ищите ошибки загрузки модулей

2. **JSON файлы не находятся**
   - В dev режиме Vite обслуживает файлы из корня
   - JSON файлы должны быть доступны по `/departments.json` и т.д.

3. **Ошибка в коде**
   - Проверьте консоль на JavaScript ошибки

## Быстрая проверка

### 1. Откройте консоль браузера
Нажмите `F12` или `Cmd+Option+I` (Mac)

### 2. Проверьте вкладку Console
Если есть красные ошибки - скопируйте их

### 3. Проверьте вкладку Network
- Фильтр: All
- Обновите страницу (F5)
- Посмотрите, какие файлы не загружаются (красные, статус 404)

## Что должно работать

1. Должен появиться экран "Загрузка игры..."
2. Затем либо игра, либо экран ошибки

## Если ничего не появляется

Это значит, что JavaScript вообще не запускается.

### Проверьте в консоли:

```javascript
// Откройте консоль и введите:
console.log('test')
```

Если работает, проверьте ошибки выше.

## Временное решение (для тестирования)

Создайте файл `test.html` в корне:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
</head>
<body>
    <h1>Test page</h1>
    <script type="module">
        console.log('Module works!');
        import { loadGameData } from './js/supabaseLoader.js';
        
        loadGameData()
            .then(data => {
                console.log('Game data loaded:', data);
                document.body.innerHTML += '<p>✅ Data loaded successfully!</p>';
            })
            .catch(err => {
                console.error('Error loading data:', err);
                document.body.innerHTML += '<p>❌ Error: ' + err.message + '</p>';
            });
    </script>
</body>
</html>
```

Откройте: http://localhost:3000/test.html

Это покажет, где именно проблема.

## Самая вероятная причина

JSON файлы не загружаются. Проверьте в Network:
- http://localhost:3000/departments.json (должен быть 200 OK)
- http://localhost:3000/config.json (должен быть 200 OK)
- http://localhost:3000/task_authors.json (должен быть 200 OK)
- http://localhost:3000/priority_comments.json (должен быть 200 OK)

Если 404 - файлы в неправильном месте.

