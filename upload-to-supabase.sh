#!/bin/bash

# Скрипт для загрузки файлов в Supabase Storage
# Требует установленный Supabase CLI: npm install -g supabase

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Upload PM Simulator assets to Supabase Storage ===${NC}\n"

# Проверка установки Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI не установлен!${NC}"
    echo "Установите: npm install -g supabase"
    exit 1
fi

# Параметры
BUCKET="pm-sim-assets"
BASE_PATH="game"

echo -e "${YELLOW}📋 Параметры:${NC}"
echo "  Bucket: $BUCKET"
echo "  Base path: $BASE_PATH"
echo ""

# Проверка авторизации
echo -e "${YELLOW}🔐 Проверка авторизации...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Вы не авторизованы!${NC}"
    echo "Выполните: supabase login"
    exit 1
fi
echo -e "${GREEN}✅ Авторизация успешна${NC}\n"

# Функция для загрузки файла
upload_file() {
    local file=$1
    local target="supabase://${BUCKET}/${BASE_PATH}/${file}"
    
    if [ -f "$file" ]; then
        echo -e "  📤 Загрузка: ${file}"
        supabase storage cp "$file" "$target" 2>&1 | grep -v "Error"
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ Успешно: ${file}${NC}"
        else
            echo -e "  ${RED}❌ Ошибка: ${file}${NC}"
        fi
    else
        echo -e "  ${RED}⚠️  Файл не найден: ${file}${NC}"
    fi
}

# Функция для загрузки папки
upload_folder() {
    local folder=$1
    local target="supabase://${BUCKET}/${BASE_PATH}/${folder}"
    
    if [ -d "$folder" ]; then
        echo -e "  📂 Загрузка папки: ${folder}/"
        supabase storage cp -r "$folder" "$target" 2>&1 | grep -v "Error"
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ Успешно: ${folder}/${NC}"
        else
            echo -e "  ${RED}❌ Ошибка: ${folder}/${NC}"
        fi
    else
        echo -e "  ${RED}⚠️  Папка не найдена: ${folder}${NC}"
    fi
}

# Загрузка JSON файлов
echo -e "${YELLOW}📄 Загрузка JSON конфигов...${NC}"
upload_file "config.json"
upload_file "departments.json"
upload_file "task_authors.json"
upload_file "priority_comments.json"
echo ""

# Загрузка иконок департаментов
echo -e "${YELLOW}🏢 Загрузка иконок департаментов...${NC}"
upload_folder "dep-icons"
echo ""

# Загрузка иконок приоритетов
echo -e "${YELLOW}⚡ Загрузка иконок приоритетов...${NC}"
upload_folder "priority-icons"
echo ""

# Загрузка аватаров
echo -e "${YELLOW}👤 Загрузка аватаров авторов...${NC}"
upload_folder "authors-icons"
echo ""

echo -e "${GREEN}=== Загрузка завершена! ===${NC}"
echo ""
echo -e "${YELLOW}📝 Следующие шаги:${NC}"
echo "1. Проверьте файлы в Supabase Dashboard > Storage > ${BUCKET}"
echo "2. Убедитесь что bucket публичный"
echo "3. Настройте environment variables в Cloudflare Pages:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_SUPABASE_BUCKET=${BUCKET}"
echo "   - VITE_SUPABASE_BASE_PATH=${BASE_PATH}/"
echo ""
echo -e "${GREEN}✨ Готово!${NC}"

