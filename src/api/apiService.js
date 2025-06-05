const API_BASE_URL = 'http://localhost:8080/aidstat/ws/public';
const DATE_STATS_PIE_URL = `${API_BASE_URL}/contract-stats/date/pie`;
const DATE_STATS_TABLE_URL = `${API_BASE_URL}/contract-stats/date/table`;
const STATUS_STATS_PIE_URL = `${API_BASE_URL}/contract-stats/status/pie`;
const STATUS_STATS_TABLE_URL = `${API_BASE_URL}/contract-stats/status/table`;

const fetchData = async (url) => {
  console.log("Fetching from:", url); // Логируем URL запроса
  const response = await fetch(url);

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
       // ignore
    }
    throw new Error(`Ошибка HTTP! Статус: ${response.status}, Детали: ${errorDetail}`);
  }

  const data = await response.json();
  return data; // Ожидается список DTO
};

export const fetchDateStatsPie = async () => {
  return fetchData(DATE_STATS_PIE_URL);
};

export const fetchDateStatsTable = async (category) => {
    let param;
    switch (category) {
        case 'Контракты завершены раньше срока':
            param = 'Завершен раньше срока';
            break;
        case 'Контракты завершены вовремя':
            param = 'Завершен вовремя';
            break;
        case 'Контракты завершены позже срока':
            param = 'Завершен позже срока';
            break;
        default:
            param = category;
    }
    
   let url = DATE_STATS_TABLE_URL;
   if (category) {
       url = `${url}?category=${encodeURIComponent(param)}`;
   }
   return fetchData(url);
};

export const fetchStatusStatsPie = async () => {
  return fetchData(STATUS_STATS_PIE_URL);
};

export const fetchStatusStatsTable = async (category) => {
    let param;
    switch (category) {
        case 'Завершенные контракты':
            param = 'Завершенный';
            break;
        case 'Текущие контракты':
            param = 'Текущий';
            break;
        default:
            param = category;
    }

    let url = STATUS_STATS_TABLE_URL;
    if (category) {
        url = `${url}?category=${encodeURIComponent(param)}`;
    } 
   return fetchData(url);
};