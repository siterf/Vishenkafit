# Vishenka — Студия фитнеса и заботы о теле (Петрозаводск)

Официальный веб-сайт фитнес-студии **Vishenka** в Петрозаводске.

## 📌 Особенности проекта
- **Современный чистый дизайн (Editorial / Wellness style):** гармоничная типографика, адаптивная верстка под все типы экранов (Mobile / Tablet / Desktop / 4K).
- **Интерактивное расписание:** переключение по 2 филиалам (*наб. Ла-Рошель, 13* и *ул. Зайцева, 67*) и дням недели, фильтрация по направлениям.
- **Всплывающая форма онлайн-записи (Booking Modal):** удобный выбор тренировки, филиала, тренера и отправка заявки.
- **Фотогалерея интерьеров (`space.html`):** адаптивная мозаика залов с полноэкранным Lightbox-просмотром.
- **GEO & AI Search Ready:** внедрен расширенный Schema.org JSON-LD (`HealthClub` + `Person` + `ExerciseGym` + `FAQPage`), разрешающий `robots.txt` для нейросетей (ChatGPT Search, Яндекс Нейро, Perplexity, Gemini, Claude) и `sitemap.xml`.

---

## 🚀 Инструкция по публикации на GitHub Pages

### Вариант 1: Через веб-интерфейс GitHub (без консоли)
1. Создайте новый репозиторий на [GitHub.com](https://github.com/new), например `vishenka-site` (Public).
2. Загрузите все файлы из этой папки (`github_ready`) в репозиторий.
3. Перейдите в **Settings** репозитория → вкладка **Pages**.
4. В разделе **Build and deployment** выберите:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (или `master`), папка `/ (root)`
   - Нажмите **Save**.
5. Через 1-2 минуты ваш сайт будет доступен по ссылке: `https://<ваш-логин>.github.io/vishenka-site/`.

---

### Вариант 2: Через Git в терминале
```bash
git init
git add .
git commit -m "Initial commit: Vishenka boutique fitness studio website"
git branch -M main
git remote add origin https://github.com/<ваш-логин>/<имя-репозитория>.git
git push -u origin main
```

---

## 🌐 Подключение своего домена (например, `vishenkaptz.ru`)
1. В настройках **GitHub Pages** в поле **Custom domain** введите ваш домен: `vishenkaptz.ru`.
2. У вашего регистратора домена (Reg.ru, Beget, TimeWeb) добавьте DNS-записи:
   - **A-записи** на IP-адреса GitHub:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **CNAME-запись** для поддомена `www`: `www` -> `<ваш-логин>.github.io`.
3. Включите галочку **Enforce HTTPS** в настройках GitHub Pages.

---

## 📂 Структура файлов
- `index.html` — Главная страница (программы, расписание, абонементы, основатель, отзывы, контакты)
- `space.html` — Фотогалерея интерьеров залов
- `privacy.html` — Политика конфиденциальности
- `offer.html` — Публичная оферта
- `legal.html` — Правила посещения студии
- `robots.txt` — Конфигурация для поисковых систем и ИИ-краулеров
- `sitemap.xml` — Карта сайта для поисковиков
- `assets/` — Стили CSS, скрипты JS, оптимизированные фотографии и логотип
