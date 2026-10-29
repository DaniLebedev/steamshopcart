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
      "/html/body/div[1]/div/div/div/section/div[2]/div[2]/div[3]/div[1]/div[1]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue.childNodes.length;

    for (let i = 1; i <= gameslenght; i++) {
      const base = `/html/body/div[1]/div/div/div/section/div[2]/div[2]/div[3]/div[1]/div[1]/div[${i}]/div/div/div[2]`;
      const xpathName = `${base}/div[1]/div[1]`;
      const xpathPriceNorm = `${base}/div[4]/div[2]/span/div/div[2]`;
      const xpathPriceAlt =  `${base}/div[3]/div[2]/span/div/div[2]`;
      const xpathPriceAlt2 = `${base}/div[3]/div[2]/span/div`;

      const element = document.evaluate(
        xpathName, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
      ).singleNodeValue;

      if (!element) continue;

      // Сначала обычный путь, если не вышло — альтернативный
      let price = getPriceByXPath(xpathPriceNorm);
      if (price === null) {
        price = getPriceByXPath(xpathPriceAlt);
      }
      if (price === null) {
        price = getPriceByXPath(xpathPriceAlt2);
      }
      if (price === null) {
        price = '—';
      }

      gameElements.push({
        id: i,
        name: element.textContent.trim(),
        xpath: xpathName,
        price: price
      });
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
        xpath: getXPath(el),
        price: elementprice ? elementprice.textContent.trim() : '—'
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

// Достаёт текст цены по XPath. Возвращает строку или null.
function getPriceByXPath(xpath) {
  const el = document.evaluate(
    xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
  ).singleNodeValue;

  if (!el) return null;

  const text = el.textContent.trim();

  // Считаем ценой то, где есть цифра или символ ₸
  if (!(/\d/.test(text) && text.includes('₸'))) return null;

  return text;
}