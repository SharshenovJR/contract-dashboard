import {
  mockOrpActivity,
  mockProjectActivity,
  mockCuratorActivity,
  mockDailyActivity,
} from './activityMock';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Мониторинг активности на демонстрационных данных вместо API
export const ACTIVITY_MOCK = process.env.REACT_APP_ACTIVITY_MOCK === 'true';
const DATE_STATS_PIE_URL = `${API_BASE_URL}/contract-stats/date/pie`;
const DATE_STATS_TABLE_URL = `${API_BASE_URL}/contract-stats/date/table`;
const STATUS_STATS_PIE_URL = `${API_BASE_URL}/contract-stats/status/pie`;
const STATUS_STATS_TABLE_URL = `${API_BASE_URL}/contract-stats/status/table`;
const PROJECT_STATS_PIE_URL = `${API_BASE_URL}/project-stats/date/pie`;
const PROJECT_STATS_TABLE_URL = `${API_BASE_URL}/project-stats/date/table`;

const ACTIVITY_ORP_URL = `${API_BASE_URL}/activity-stats/orp`;
const ACTIVITY_PROJECTS_URL = `${API_BASE_URL}/activity-stats/projects`;
const ACTIVITY_CURATORS_URL = `${API_BASE_URL}/activity-stats/curators`;
const ACTIVITY_DAILY_URL = `${API_BASE_URL}/activity-stats/daily`;


const fetchData = async (url, options) => {
  console.log("Fetching from:", url); // Логируем URL запроса
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === 'object') {
           errorDetail = errorBody.message || JSON.stringify(errorBody);
      } else if (typeof errorBody === 'string') {
           errorDetail = errorBody;
      }
    } catch (e) {
      console.error("Ошибка при обработке тела ответа:", e);
    }
    throw new Error(`Ошибка HTTP! Статус: ${response.status}, Детали: ${errorDetail}`);
  }

  const data = await response.json();
  return data;
};

export const fetchDateStatsPie = async () => {
  return fetchData(DATE_STATS_PIE_URL);
};

export const fetchDateStatsTable = async (category) => {
   let url = DATE_STATS_TABLE_URL;
   if (category) {
       url = `${url}?category=${encodeURIComponent(category)}`;
   }
   return fetchData(url);
};

export const fetchStatusStatsPie = async () => {
  return fetchData(STATUS_STATS_PIE_URL);
};

export const fetchStatusStatsTable = async (category) => {
    let url = STATUS_STATS_TABLE_URL;
    if (category) {
        url = `${url}?category=${encodeURIComponent(category)}`;
    } 
   return fetchData(url);
};

export const fetchProjectDateStatsPie = async () => {
  return fetchData(PROJECT_STATS_PIE_URL);
};

export const fetchProjectDateStatsTable = async (category) => {
  let url = PROJECT_STATS_TABLE_URL;
  if (category) {
    url = `${url}?category=${encodeURIComponent(category)}`;
  }
  return fetchData(url);
};

export const fetchOrpActivity = async () => {
  if (ACTIVITY_MOCK) return mockOrpActivity();
  return fetchData(ACTIVITY_ORP_URL);
};

export const fetchProjectActivity = async () => {
  if (ACTIVITY_MOCK) return mockProjectActivity();
  return fetchData(ACTIVITY_PROJECTS_URL);
};

export const fetchCuratorActivity = async () => {
  if (ACTIVITY_MOCK) return mockCuratorActivity();
  return fetchData(ACTIVITY_CURATORS_URL);
};

export const fetchDailyActivity = async (days) => {
  if (ACTIVITY_MOCK) return mockDailyActivity(days);
  return fetchData(`${ACTIVITY_DAILY_URL}?days=${encodeURIComponent(days)}`);
};
