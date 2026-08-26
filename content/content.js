// content.js - работает на странице, имеет доступ к DOM

// Слушаем сообщения из popup.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('content.js получил сообщение:', message);
  
  // Обработка запроса на получение информации со страницы
  if (message.action === 'getPageInfo') {
    // Получаем данные со страницы
    const title = document.title;
    const url = window.location.href;
    
    // Получаем элементы игр с помощью XPath
    const gameElements = [];
    let gameslenght = document.evaluate(
        "/html/body/div[1]/div[6]/div[7]/div[3]/div/div/div[2]/div[3]/div[1]/div[1]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue.childNodes.length;
    // Ищем игры на странице (например, до 10 штук)
    for (let i = 1; i <= gameslenght; i++) {
      const xpath = `/html/body/div[1]/div[6]/div[7]/div[3]/div/div/div[2]/div[3]/div[1]/div[1]/div[${i}]/div/div/div[2]/div[1]/div[1]`;
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      const element = result.singleNodeValue;
      
      if (element) {
        gameElements.push({
          id: i,
          name: element.textContent.trim(),
          xpath: xpath
        });
      }
    }
    
    // Отправляем ответ обратно в popup.js
    sendResponse({
      success: true,
      title: title,
      url: url,
      games: gameElements,
      totalGames: gameElements.length
    });
  }
  
  // Обработка запроса на поиск по конкретному XPath
  if (message.action === 'getElementByXPath') {
    const result = document.evaluate(
      message.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    
    const element = result.singleNodeValue;
    
    sendResponse({
      found: !!element,
      text: element ? element.textContent.trim() : null,
      html: element ? element.innerHTML : null,
      tag: element ? element.tagName : null
    });
  }
  
  // Обработка запроса на получение всех игр
  if (message.action === 'getAllGames') {
    const games = [];
    
    // Ищем все элементы с классом game (пример)
    const gameElements = document.querySelectorAll('.game, .game-item, [data-game]');
    
    gameElements.forEach((el, index) => {
      games.push({
        id: index + 1,
        name: el.textContent.trim(),
        xpath: getXPath(el)
      });
    });
    
    sendResponse({
      success: true,
      games: games,
      total: games.length
    });
  }
  
  return true; // ВАЖНО: для асинхронного ответа
});

// Вспомогательная функция для получения XPath элемента
function getXPath(element) {
  if (element.id) return '//*[@id="' + element.id + '"]';
  if (element === document.body) return '/html/body';
  
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return getXPath(element.parentNode) + '/' + 
        element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}