// Демонстрационные данные мониторинга активности (включаются REACT_APP_ACTIVITY_MOCK=true).
// Генератор детерминированный: при каждой загрузке одни и те же данные относительно сегодняшней даты.

const DAY_MS = 24 * 60 * 60 * 1000;

const createRandom = (initial) => {
  let seed = initial;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const int = (min, max) => Math.floor(min + next() * (max - min + 1));
  return { next, int, pick: (arr) => arr[int(0, arr.length - 1)] };
};

const pad = (n) => String(n).padStart(2, '0');
const toLocalIso = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
const toLocalDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const ORP_NAMES = [
  'Министерство транспорта и коммуникаций',
  'Министерство здравоохранения',
  'Министерство образования и науки',
  'Министерство водных ресурсов, сельского хозяйства и перерабатывающей промышленности',
  'Министерство энергетики',
  'Министерство природных ресурсов, экологии и технического надзора',
  'Министерство цифрового развития и инновационных технологий',
  'Министерство чрезвычайных ситуаций',
  'Министерство экономики и коммерции',
  'Министерство труда, социального обеспечения и миграции',
  'Государственное агентство архитектуры, строительства и ЖКХ',
  'Фонд развития Иссык-Кульской области',
  'Фонд развития Ошской области',
  'Фонд развития Джалал-Абадской области',
  'Фонд развития Нарынской области',
  'Фонд развития Таласской области',
  'Фонд развития Баткенской области',
  'Фонд развития Чуйской области',
  'Мэрия города Бишкек',
  'Мэрия города Ош',
];

const PROJECT_NAMES = [
  'Реконструкция автодороги Бишкек — Нарын — Торугарт, участок км 272–365',
  'Модернизация систем водоснабжения и водоотведения в малых городах',
  'Улучшение качества первичной медико-санитарной помощи',
  'Строительство и оснащение школ в сельских районах',
  'Развитие широкополосной связи в регионах',
  'Развитие ирригационной инфраструктуры Чуйской долины',
  'Повышение энергоэффективности общественных зданий',
  'Поддержка устойчивого животноводства',
  'Укрепление системы реагирования на чрезвычайные ситуации',
  'Развитие системы электронного правительства',
  'Реабилитация гидроэлектростанций Токтогульского каскада',
  'Поддержка малого и среднего предпринимательства в регионах',
  'Строительство очистных сооружений г. Каракол',
  'Модернизация системы социальной защиты',
  'Развитие городского общественного транспорта г. Бишкек',
  'Реконструкция межгосударственной ЛЭП 500 кВ',
];

const CURATORS = [
  'Асанов Бакыт Кубанычбекович',
  'Жумабекова Айгуль Токтосуновна',
  'Токтогулов Нурлан Эркинович',
  'Сыдыкова Гульмира Маратовна',
  'Абдыкалыков Руслан Сатарович',
  'Мамбетова Жылдыз Алмазовна',
  'Осмонов Талант Бекболотович',
  'Касымова Динара Нурбековна',
  'Иманалиев Эрлан Кадырбекович',
  'Бекболотова Салтанат Усеновна',
  'Орозбаева Назгуль Кубатовна',
  'Турдубаев Азамат Жолдошевич',
];

const build = () => {
  const { next, int, pick } = createRandom(20261013);
  const now = Date.now();
  const ago = (days) => (days === null ? null : toLocalIso(new Date(now - days * DAY_MS - int(0, 9) * 3600 * 1000)));
  const maybe = (maxDays, nullChance) => (next() < nullChance ? null : int(0, maxDays));

  const orp = ORP_NAMES.map((name, i) => {
    const upload = maybe(i % 4 === 0 ? 95 : 26, 0.08);
    return {
      id: i + 1,
      name,
      projectCount: int(1, 14),
      userCount: int(1, 9),
      lastUpload: ago(upload),
      lastActive: ago(maybe(upload ?? 45, 0.04)),
    };
  });

  const projects = Array.from({ length: 48 }, (_, i) => {
    const upload = maybe(i % 4 === 0 ? 120 : 27, 0.08);
    const suffix = i >= PROJECT_NAMES.length ? `, этап ${Math.floor(i / PROJECT_NAMES.length) + 1}` : '';
    return {
      id: i + 1,
      name: PROJECT_NAMES[i % PROJECT_NAMES.length] + suffix,
      orp: pick(ORP_NAMES),
      curator: next() < 0.92 ? pick(CURATORS) : null,
      lastUpload: ago(upload),
      quarterlyReports90: int(0, 1),
      monthlyReports90: int(0, 3),
      lastView: ago(maybe(45, 0.06)),
      lastCuratorView: ago(maybe(i % 5 === 0 ? 70 : 25, 0.1)),
    };
  });

  const curators = CURATORS.map((name, i) => {
    const active = maybe(i % 4 === 0 ? 70 : 10, 0.04);
    return {
      id: i + 1,
      name,
      lastActive: ago(active),
      projectCount: int(2, 12),
      pendingQuarterly: int(0, 3),
      pendingMonthly: int(0, 6),
      processedQuarterly30: int(0, 5),
      processedMonthly30: int(0, 14),
      viewsTotal: int(10, 900),
      projectsViewed30: int(0, 12),
      lastProjectView: ago(maybe(40, 0.08)),
    };
  });

  // 90 дней динамики; запросы за 7/30 дней берут хвост
  const daily = Array.from({ length: 90 }, (_, i) => {
    const date = new Date(now - (89 - i) * DAY_MS);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const k = weekend ? 0.25 : 1;
    return {
      date: toLocalDay(date),
      activeOrps: Math.round(int(5, 14) * k),
      activeProjects: Math.round(int(10, 30) * k),
      quarterlyReports: date.getDate() <= 10 ? Math.round(int(0, 6) * k) : int(0, 1),
      monthlyReports: Math.round(int(1, 9) * k),
      views: Math.round(int(40, 160) * k),
      activeCurators: Math.round(int(3, 10) * k),
      statusChanges: Math.round(int(2, 25) * k),
    };
  });

  return { orp, projects, curators, daily };
};

let cache = null;
const data = () => {
  if (!cache) cache = build();
  return cache;
};

// Небольшая задержка, чтобы были видны состояния загрузки
const respond = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 300));

export const mockOrpActivity = () => respond(data().orp);
export const mockProjectActivity = () => respond(data().projects);
export const mockCuratorActivity = () => respond(data().curators);
export const mockDailyActivity = (days) => respond(data().daily.slice(-Math.min(Math.max(days, 1), 90)));
