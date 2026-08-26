// popup.js - работает в popup окне

let games = [];
let gamelist = document.getElementById("games-container");
let btnget = document.querySelector(".btn-get");

// Функция для получения данных со страницы
async function getGamesFromPage() {
  try {
    // 1. Получаем активную вкладку
    const [tab] = await browser.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    console.log('Отправляем запрос в content.js для вкладки:', tab.id);
    
    // 2. Отправляем запрос в content.js
    const response = await browser.tabs.sendMessage(tab.id, {
      action: 'getPageInfo'
    });
    
    console.log('Получен ответ от content.js:', response);
    
    // 3. Обрабатываем ответ
    if (response.success) {
      // Сохраняем игры
      games = response.games.map((game, index) => ({
        id: index,
        name: game.name,
        pageId: game.id
      }));
      
      // Отображаем игры в popup
      displayGames();
      
      // Показываем информацию
      document.getElementById('status').textContent = 
        `Найдено ${response.totalGames} игр на странице ${response.title}`;
      
    } else {
      document.getElementById('status').textContent = 'Не удалось получить данные';
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
    document.getElementById('status').textContent = 
      'Ошибка: ' + error.message;
  }
}

// Функция для поиска элемента по XPath
async function getElementByXPath(xpath) {
  try {
    const [tab] = await browser.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    const response = await browser.tabs.sendMessage(tab.id, {
      action: 'getElementByXPath',
      xpath: xpath
    });
    
    console.log('Результат поиска по XPath:', response);
    return response;
    
  } catch (error) {
    console.error('Ошибка:', error);
    return null;
  }
}

// Функция для отображения игр в popup
function displayGames() {
  if (!gamelist) return;
  
  // Очищаем контейнер
  gamelist.innerHTML = '';
  
  if (games.length === 0) {
    gamelist.innerHTML = '<p>Игры не найдены</p>';
    return;
  }
  
  // Добавляем каждую игру
  games.forEach((game, index) => {
    gamelist.innerHTML += `
      <div class="game" data-index="${index}">
        <label>
          <h1 class="game-id">${game.id} : ${game.name}</h1>
        </label>
      </div>
    `;
  });
}



// Функция ручного добавления игр (как у вас было)
function SetGames() {
  console.clear();
  games = [];
  
  for (let i = 0; i < 5; i++) {
    games.push({ id: i, name: `game ${i}` });
  }
  
  displayGames();
  console.log('Созданы игры:', games);
}

// Обработчик кнопки "Получить игры со страницы"
btnget.addEventListener("click", () => {
  getGamesFromPage();
});

// Обработчик кнопки "Создать тестовые игры" (если есть)
const btnSetGames = document.querySelector(".btn-set-games");
if (btnSetGames) {
  btnSetGames.addEventListener("click", SetGames);
}

// Загрузка при открытии popup
document.addEventListener('DOMContentLoaded', () => {
  // Показываем статус
  const status = document.getElementById('status');
  if (status) {
    status.textContent = 'Нажмите кнопку для получения игр';
  }
  
  // Если есть сохранённые игры, загружаем их
  loadGamesFromStorage();
});

// Сохранение игр в storage
async function saveGamesToStorage() {
  await browser.storage.local.set({ games: games });
  console.log('Игры сохранены в storage');
}

// Загрузка игр из storage
async function loadGamesFromStorage() {
  const result = await browser.storage.local.get('games');
  if (result.games) {
    games = result.games;
    displayGames();
    console.log('Игры загружены из storage:', games);
  }
}