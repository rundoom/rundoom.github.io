(function(storyContent) {
    // Создаем историю из контента
    var story = new inkjs.Story(storyContent);

    // Состояние игры
    var savePoint = "";
    var savedTheme;
    var globalTagTheme;
    var lastChoiceText = ""; // Сохраняем последнее действие
    window.hasDoneChoice = false

    // Получаем ссылки на панели
    var storyPanel = document.getElementById('story-content');
    var imagePanel = document.getElementById('image-content');
    var choicesPanel = document.getElementById('choices-content');
    var statusPanel = document.getElementById('status-content');

    // Обработка глобальных тегов
    var globalTags = story.globalTags;
    if (globalTags) {
        for (var i = 0; i < globalTags.length; i++) {
            var globalTag = globalTags[i];
            var splitTag = splitPropertyTag(globalTag);

            if (splitTag && splitTag.property == "theme") {
                globalTagTheme = splitTag.val;
            }

            if (splitTag && splitTag.property == "author") {
                var titleElement = document.getElementById('story-title');
                if (titleElement) {
                    titleElement.innerHTML += '<br><small>by ' + splitTag.val + '</small>';
                }
            }
        }
    }

    // Настройка темы и кнопок
    setupTheme(globalTagTheme);
    var hasSave = loadSavePoint();
    setupButtons(hasSave);

    // Установка начальной точки сохранения (только если не загружали сохранение)
    if (!hasSave) {
        savePoint = JSON.stringify({
            storyState: story.state.toJson(),
            lastChoice: ""
        });
    }

    // Запуск истории
    continueStory(!hasSave); // true только если это новая игра, не загрузка

    // Автосохранение при покидании страницы
    setupAutoSave();

    // Основная функция продолжения истории
    function continueStory(firstTime) {
        // Очищаем панели при первом запуске
        if (firstTime) {
            clearPanel(storyPanel);
            clearPanel(choicesPanel);
            // Картинку и статус очищаем только если это рестарт
        }

        var storyText = '';
        var hasNewContent = false;

        // Собираем весь доступный контент
        while (story.canContinue) {
            var paragraphText = story.Continue();
            var tags = story.currentTags;

            // Обработка тегов
            var shouldShowText = true;
            var imageProcessed = false;

            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                var splitTag = splitPropertyTag(tag);

                if (splitTag) {
                    splitTag.property = splitTag.property.toUpperCase();

                    // IMAGE: путь к картинке
                    if (splitTag.property == "IMAGE") {
                        updateImagePanel(splitTag.val);
                        imageProcessed = true;
                    }

                    // CLASS: стили для текста (оставляем для совместимости)
                    if (splitTag.property == "CLASS") {
                        // Можно добавить классы к тексту если нужно
                    }
                }

                // Специальные теги
                if (tag == "CLEAR") {
                    clearPanel(storyPanel);
                    clearPanel(imagePanel);
                    shouldShowText = false;
                }

                if (tag == "RESTART") {
                    restart();
                    return;
                }
            }

            // Добавляем текст в панель истории, если он не пустой
            if (shouldShowText && paragraphText.trim().length > 0) {
                storyText += paragraphText + '\n\n';
                hasNewContent = true;
            }
        }

        // Обновляем панель истории если есть новый контент
        if (hasNewContent) {
            // Всегда добавляем как блок результата (для единообразия)
            addStoryBlock('result', storyText.trim());
        }

        // Обновляем статус персонажа
        updateStatusPanel();

        // Обновляем выборы
        updateChoicesPanel();
    }

    // Добавление блока истории (выбор или результат)
    function addStoryBlock(type, text) {
        var blockDiv = document.createElement('div');
        blockDiv.classList.add('story-block');
        blockDiv.classList.add('story-block-' + type);

        if (type === 'choice') {
            // Блок с выбранным действием - ИСПРАВЛЕНО
            blockDiv.innerHTML = '<div class="choice-header">▶ ' + text + '</div>';
        } else if (type === 'result') {
            // Блок с результатом действия
            var paragraphs = text.split('\n\n');
            var content = '';
            for (var i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i].trim()) {
                    content += '<p>' + paragraphs[i].trim() + '</p>';
                }
            }
            blockDiv.innerHTML = content;
        }

        // Добавляем с анимацией
        blockDiv.classList.add('hide');
        storyPanel.appendChild(blockDiv);

        setTimeout(function() {
            blockDiv.classList.remove('hide');
        }, 50);

        // Прокрутка вниз
        setTimeout(function() {
            storyPanel.scrollTop = storyPanel.scrollHeight;
        }, 100);
    }

    // Обновление панели истории
    function updateStoryPanel(text) {
        if (text) {
            var paragraphs = text.split('\n\n');
            for (var i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i].trim()) {
                    var p = document.createElement('p');
                    p.innerHTML = paragraphs[i].trim();
                    p.classList.add('hide');
                    storyPanel.appendChild(p);

                    // Анимация появления
                    setTimeout(function(element) {
                        return function() {
                            element.classList.remove('hide');
                        };
                    }(p), i * 100);
                }
            }

            // Прокрутка вниз
            storyPanel.scrollTop = storyPanel.scrollHeight;
        }
    }

    // Обновление панели картинки
    function updateImagePanel(imagePath) {
        imagePanel.innerHTML = '';
        var img = document.createElement('img');

        // Автоматически добавляем путь к папке images/ если путь не содержит слеш
        var fullPath = imagePath;
        if (imagePath.indexOf('/') === -1 && imagePath.indexOf('http') !== 0) {
            fullPath = 'images/' + imagePath;
        }

        img.src = fullPath;
        img.alt = 'Изображение сцены';
        img.onerror = function() {
            imagePanel.innerHTML = '<div class="placeholder-image"><span>Изображение не найдено:<br>' + fullPath + '</span></div>';
        };
        imagePanel.appendChild(img);
    }

    // Обновление панели статуса через прямое чтение переменных
    function updateStatusPanel() {
        try {
            // Получаем переменные напрямую через variablesState
            var location = story.variablesState.current_location || "Неизвестно";
            var hp = story.variablesState.hp || 0;
            var maxHp = story.variablesState.max_hp || 10;
            var hunger = story.variablesState.hunger || 0;
            var maxHunger = story.variablesState.max_hunger || 10;
            var money = story.variablesState.money || 0;
            var moneyName = story.variablesState.money_name || "";

            // Получаем инвентарь и обрабатываем его
            var inventory = getInventoryDisplay();

            // Формируем строки статуса
            var statusLines = [
                '📍 Локация: ' + location,
                '❤️ Здоровье: ' + hp + '/' + maxHp + ' (' + getHpStatus(hp) + ')',
                '🍖 Голод: ' + hunger + '/' + maxHunger + ' (' + getHungerStatus(hunger) + ')',
                '🎒 Инвентарь: ' + inventory
            ];

            // Добавляем деньги если они есть
            if (moneyName && moneyName !== "") {
                statusLines.push('💎 ' + moneyName + ': ' + money);
            }

            displayStatus(statusLines);
        } catch (e) {
            console.error('Ошибка получения статуса:', e);
            displayStatus([
                '❌ Ошибка загрузки статуса',
                'Проверьте консоль для деталей'
            ]);
        }
    }

    // Получение статуса здоровья
    function getHpStatus(hp) {
        if (hp >= 10) return "💚 Абсолютно здоров";
        if (hp >= 9) return "💚 Почти идеально";
        if (hp >= 8) return "💚 В хорошей форме";
        if (hp >= 7) return "💛 Лёгкие царапины";
        if (hp >= 6) return "💛 Немного побит";
        if (hp >= 5) return "💛 Заметно потрепан";
        if (hp >= 4) return "🧡 Сильно ранен";
        if (hp >= 3) return "🧡 Тяжело ранен";
        if (hp >= 2) return "❤️ Критическое состояние";
        if (hp >= 1) return "❤️ При смерти";
        if (hp <= 0) return "💀 Мёртв";
        return "⭐ Сверхчеловек";
    }

    // Получение статуса голода
    function getHungerStatus(hunger) {
        if (hunger >= 10) return "💚 Сыт";
        if (hunger >= 9) return "💚 Почти сыт";
        if (hunger >= 8) return "💚 Легкое чувство голода";
        if (hunger >= 7) return "💛 Немного голоден";
        if (hunger >= 6) return "💛 Заметно голоден";
        if (hunger >= 5) return "💛 Довольно голоден";
        if (hunger >= 4) return "🧡 Сильно голоден";
        if (hunger >= 3) return "🧡 Очень голоден";
        if (hunger >= 2) return "❤️ Критически голоден";
        if (hunger >= 1) return "❤️ Умирает от голода";
        if (hunger <= 0) return "💀 Умер от голода";
        return "⭐ Сверхнасыщен";
    }

    // Получение отображения инвентаря
    function getInventoryDisplay() {
        try {
            var inventory = story.variablesState.inventory;

            // Если инвентарь пустой или это специальное значение "Ничего"
            if (!inventory || inventory === "Ничего") {
                return "Пусто";
            }

            // Если это InkList (список в Ink)
            if (inventory && typeof inventory === 'object' && inventory.Count !== undefined) {
                if (inventory.Count === 0) {
                    return "Пусто";
                }

                // Получаем элементы списка
                var items = [];
                if (inventory.orderedItems) {
                    for (var i = 0; i < inventory.orderedItems.length; i++) {
                        var item = inventory.orderedItems[i];
                        if (item.Key && item.Key.itemName) {
                            items.push(item.Key.itemName);
                        }
                    }
                }

                if (items.length === 0) {
                    return "Пусто";
                } else if (items.length === 1) {
                    return items[0];
                } else if (items.length === 2) {
                    return items[0] + " и " + items[1];
                } else {
                    return items.slice(0, -1).join(", ") + " и " + items[items.length - 1];
                }
            }

            // Если это строка или другой тип
            return inventory.toString();

        } catch (e) {
            console.error('Ошибка получения инвентаря:', e);
            return "Ошибка";
        }
    }

    // Отображение статуса
    function displayStatus(statusLines) {
        statusPanel.innerHTML = '';

        for (var i = 0; i < statusLines.length; i++) {
            var line = statusLines[i];
            if (line.trim()) {
                var p = document.createElement('p');
                p.textContent = line;
                statusPanel.appendChild(p);
            }
        }
    }

    // Обновление панели выборов
    function updateChoicesPanel() {
        choicesPanel.innerHTML = '';

        var choices = story.currentChoices;

        if (choices.length === 0) {
            var noChoices = document.createElement('p');
            noChoices.textContent = 'Нет доступных действий';
            noChoices.style.color = 'var(--text-secondary)';
            noChoices.style.fontStyle = 'italic';
            choicesPanel.appendChild(noChoices);
            return;
        }

        choices.forEach(function(choice, index) {
            var choiceElement = document.createElement('div');
            choiceElement.classList.add('choice');

            // Проверяем теги выбора
            var isClickable = true;
            var customClasses = [];
            var choiceTags = choice.tags || [];

            for (var i = 0; i < choiceTags.length; i++) {
                var tag = choiceTags[i];
                if (tag.toUpperCase() === "UNCLICKABLE") {
                    isClickable = false;
                }

                var splitTag = splitPropertyTag(tag);
                if (splitTag && splitTag.property.toUpperCase() === "CLASS") {
                    customClasses.push(splitTag.val);
                }
            }

            // Добавляем кастомные классы
            for (var i = 0; i < customClasses.length; i++) {
                choiceElement.classList.add(customClasses[i]);
            }

            if (isClickable) {
                var link = document.createElement('a');
                link.href = '#';
                link.textContent = choice.text;
                link.addEventListener('click', function(choiceIndex) {
                    return function(event) {
                        event.preventDefault();
                        window.hasDoneChoice = true
                        makeChoice(choiceIndex);
                    };
                }(choice.index));
                choiceElement.appendChild(link);
            } else {
                var span = document.createElement('span');
                span.classList.add('unclickable');
                span.textContent = choice.text;
                choiceElement.appendChild(span);
            }

            choicesPanel.appendChild(choiceElement);
        });
    }

    // Выполнение выбора
    function makeChoice(choiceIndex) {
        // Находим выбранный вариант
        var selectedChoice = null;
        var choices = story.currentChoices;
        for (var i = 0; i < choices.length; i++) {
            if (choices[i].index === choiceIndex) {
                selectedChoice = choices[i];
                break;
            }
        }

        // Очищаем панель выборов
        choicesPanel.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Выполняется...</p>';

        // Добавляем блок с выбранным действием
        if (selectedChoice) {
            lastChoiceText = selectedChoice.text; // Сохраняем выбор
            addStoryBlock('choice', selectedChoice.text);
        }

        // Выбираем вариант
        story.ChooseChoiceIndex(choiceIndex);

        // Обновляем точку сохранения (включая последнее действие)
        savePoint = JSON.stringify({
            storyState: story.state.toJson(),
            lastChoice: lastChoiceText
        });

        // Продолжаем историю
        setTimeout(function() {
            continueStory();
        }, 100);
    }

    // Очистка панели
    function clearPanel(panel) {
        if (panel) {
            panel.innerHTML = '';
        }
    }

    // Перезапуск игры
    function restart() {
        story.ResetState();
        lastChoiceText = ""; // Сбрасываем последний выбор
        clearPanel(storyPanel);
        clearPanel(choicesPanel);

        // Возвращаем placeholder для картинки
        imagePanel.innerHTML = '<div class="placeholder-image"><span>Изображение</span></div>';

        // Сброс статуса
        statusPanel.innerHTML = '<div class="status-placeholder"><p>📍 Локация: Загрузка...</p><p>❤️ Здоровье: --/--</p><p>🎒 Инвентарь: Загрузка...</p></div>';

        savePoint = JSON.stringify({
            storyState: story.state.toJson(),
            lastChoice: ""
        });
        continueStory(true);
    }

    // Парсинг тегов вида "PROPERTY: value"
    function splitPropertyTag(tag) {
        var colonIndex = tag.indexOf(":");
        if (colonIndex !== -1) {
            var property = tag.substr(0, colonIndex).trim();
            var val = tag.substr(colonIndex + 1).trim();
            return {
                property: property,
                val: val
            };
        }
        return null;
    }

    // Загрузка сохранения
    function loadSavePoint() {
        try {
            var savedData = window.localStorage.getItem('ink-save-state');
            if (savedData) {
                var parsedData = JSON.parse(savedData);

                // Поддержка старого формата сохранений (только состояние истории)
                if (typeof parsedData === 'string') {
                    story.state.LoadJson(parsedData);
                    lastChoiceText = "";
                } else {
                    // Новый формат (состояние + последний выбор)
                    story.state.LoadJson(parsedData.storyState);
                    lastChoiceText = parsedData.lastChoice || "";
                }

                // Очищаем панели
                clearPanel(storyPanel);
                clearPanel(choicesPanel);

                // Показываем последнее действие при загрузке (если есть)
                if (lastChoiceText) {
                    addStoryBlock('choice', lastChoiceText);
                }

                return true;
            }
        } catch (e) {
            console.debug("Couldn't load save state");
        }
        return false;
    }

    // Настройка темы
    function setupTheme(globalTagTheme) {
        var savedTheme;
        try {
            savedTheme = window.localStorage.getItem('ink-theme');
        } catch (e) {
            console.debug("Couldn't load saved theme");
        }

        var browserDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "light" ||
            (savedTheme == undefined && globalTagTheme === "light") ||
            (savedTheme == undefined && globalTagTheme == undefined && !browserDark)) {
            document.body.classList.add("light");
        }
    }

    // Настройка кнопок
    function setupButtons(hasSave) {
        var rewindEl = document.getElementById("rewind");
        if (rewindEl) {
            rewindEl.addEventListener("click", function() {
                restart();
            });
        }

        var saveEl = document.getElementById("save");
        if (saveEl) {
            saveEl.addEventListener("click", function() {
                try {
                    window.localStorage.setItem('ink-save-state', savePoint);
                    document.getElementById("reload").removeAttribute("disabled");
                    window.localStorage.setItem('ink-theme', document.body.classList.contains("light") ? "light" : "dark");

                    // Показываем уведомление
                    saveEl.textContent = "✓ Сохранено";
                    setTimeout(function() {
                        saveEl.textContent = "💾 Сохранить";
                    }, 1000);
                } catch (e) {
                    console.warn("Couldn't save state");
                }
            });
        }

        var reloadEl = document.getElementById("reload");
        if (reloadEl) {
            if (!hasSave) {
                reloadEl.setAttribute("disabled", "disabled");
            }
            reloadEl.addEventListener("click", function() {
                if (reloadEl.getAttribute("disabled")) return;

                // Просто перезагружаем страницу - это проще и надежнее
                window.location.reload();
            });
        }

        var themeSwitchEl = document.getElementById("theme-switch");
        if (themeSwitchEl) {
            themeSwitchEl.addEventListener("click", function() {
                document.body.classList.toggle("light");

                // Сохраняем выбор темы
                try {
                    window.localStorage.setItem('ink-theme', document.body.classList.contains("light") ? "light" : "dark");
                } catch (e) {
                    console.debug("Couldn't save theme preference");
                }
            });
        }
    }

    function setupAutoSave() {
        // Сохранение при покидании страницы
        window.addEventListener('beforeunload', function() {
            try {
                if(window.hasDoneChoice) {
                    window.localStorage.setItem('ink-save-state', savePoint);
                }
                window.localStorage.setItem('ink-theme', document.body.classList.contains("light") ? "light" : "dark");
            } catch (e) {
                console.warn("Couldn't auto-save state");
            }
        })}

})(storyContent);