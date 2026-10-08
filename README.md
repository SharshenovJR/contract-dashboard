# Contract Dashboard

Фронтенд дашбордов AidStat: статистика контрактов и проектов и мониторинг активности ОРП и кураторов.
React 19 + recharts, сборка через CRACO (несколько HTML-страниц из одного проекта).

## Страницы

| Страница | Компонент | Что показывает |
|---|---|---|
| `/contract.html` | `ContractDashboard` | Контракты по сроку завершения (раньше / вовремя / позже срока) и по статусу (текущие / завершенные) |
| `/project.html` | `ProjectDashboard` | Проекты по дате завершения: завершены, в работе в графике, в работе с отставанием |
| `/activity.html` | `ActivityDashboard` | Мониторинг активности: вкладки «ОРП», «Проекты», «Кураторы» |
| `/` | `ProjectDashboard` | То же, что `/project.html` |

**Статистика контрактов и проектов.** Плитки категорий с количеством и долей, кольцевая диаграмма,
список по выбранной категории. Клик по плитке или сектору диаграммы фильтрует список, повторный клик сбрасывает.
В списке есть поиск и экспорт в Excel (выгружаются отфильтрованные строки). Без выбранной категории список
контрактов пустой — так отдает бэкенд.

**Мониторинг активности.** Плитки с ключевыми показателями, таблица с сортировкой по любой колонке, поиск,
экспорт в Excel. Давность дат подсвечивается: до 7 дней, 8–30 дней, больше 30 дней, никогда.
У каждой колонки и плитки есть подсказка (значок «i»), под таблицей — раздел «Как считаются показатели».

## API

Базовый адрес задается переменной `REACT_APP_API_BASE_URL` (см. «Настройка»).

| Эндпоинт | Где используется |
|---|---|
| `GET /contract-stats/date/pie`, `/contract-stats/date/table?category=` | Контракты по сроку завершения |
| `GET /contract-stats/status/pie`, `/contract-stats/status/table?category=` | Контракты по статусу |
| `GET /project-stats/date/pie`, `/project-stats/date/table?category=` | Проекты по дате завершения |
| `GET /activity-stats/orp`, `/activity-stats/projects`, `/activity-stats/curators` | Мониторинг активности |

`pie` возвращает `[{ name, value, color, status }]`, где `status` — код категории, который передается в `table?category=`.
Запросы активности идут с `credentials: 'include'` (сессия Axelor), бэкенд проверяет роль пользователя.

Бэкенд: модуль `axelor-aid` (`StatWebService`, `ActivityStatWebService`).

## Настройка

| Файл | Значение | Когда используется |
|---|---|---|
| `.env` | `REACT_APP_API_BASE_URL=../ws/public` | Сборка (`npm run build`). Адрес относительный: страница открывается как `/aidstat/front/*.html`, запросы уходят на `/aidstat/ws/public` того же сервера — одна сборка работает и локально, и на проде |
| `.env.development.local` | `REACT_APP_API_BASE_URL=http://localhost:8080/aidstat/ws/public` | `npm start` на `localhost:3000`. Файл в `.gitignore`, создайте его локально |

Переменные подставляются в момент сборки: после изменения `.env` фронт нужно пересобрать.

## Запуск и сборка

```bash
npm install

# Разработка: http://localhost:3000/contract.html, /project.html, /activity.html
npm start

# Сборка всех страниц в build/
npm run build

# Сборка и копирование результата в public/
npm run build:contract
```

## Встраивание в Axelor

Копия проекта лежит в `axelor-open-suite/axelor-aid/src/main/contract-dashboard-master`.
Gradle-задачи модуля `axelor-aid`:

- `buildContractDashboard` — `npm install` + `npm run build`;
- `copyContractDashboardWebapp` — копирует `build/` в `build/webapp/front` приложения.

Обе выполняются автоматически перед `run`, `build` и `war`. В Axelor страницы открываются через меню
как HTML-представления `front/contract.html`, `front/activity.html` и т.д. (`Menu.xml`).

После изменений в этом репозитории перенесите `src/` и `public/` в копию `contract-dashboard-master`.
Чтобы проверить без перезапуска сервера: соберите копию и скопируйте ее `build/` в `build/webapp/front`,
затем обновите страницу через Ctrl+F5.

## Структура

```
src/
  Contract.js, Project.js, Activity.js   точки входа страниц
  index.js                               точка входа main (статистика проектов)
  api/apiService.js                      запросы к API
  components/
    Dashboard.js                         общий дашборд статистики: плитки, диаграмма, список
    ContractDashboard.js                 настройка для контрактов (колонки, отклонение в днях)
    ProjectDashboard.js                  настройка для проектов
    ActivityDashboard.js                 мониторинг активности: вкладки, показатели, подсказки
    PieChartComponent.js                 кольцевая диаграмма
    TableComponent.js                    таблица (даты, статусы, вычисляемые колонки)
    Widget.js                            карточка с заголовком и действиями
  utils/exportUtils.js                   экспорт в Excel (exceljs)
  styles/App.css                         общие стили (цвета и размеры — CSS-переменные в :root)
public/
  contract.html, project.html, activity.html, index.html   HTML-шаблоны страниц
craco.config.js                          точки входа webpack и HTML-страницы
```

Колонки таблиц задаются массивом `{ header, accessor, ... }`. Дополнительные поля:
`date` — формат ДД.ММ.ГГГГ, `numeric` — выравнивание вправо, `status` — цветная метка,
`value(row)` — вычисляемое значение (используется и в экспорте), `tone(row)` — класс ячейки,
`clamp` — обрезка до 2 строк, `wide` — широкая колонка; в мониторинге активности также `hint` — текст подсказки.
