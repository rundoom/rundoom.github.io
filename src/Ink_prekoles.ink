LIST inventory = Ничего
VAR current_location = "Таинственная комната"
VAR hp = 10
VAR max_hp = 10
VAR hunger = 10
VAR max_hunger = 10
VAR money = 0
VAR money_name = "Рублей"

=== function show_status() ===
{"-----------------------------------------------------------------------------"}
📍 Локация: {current_location}
❤️ Здоровье: {hp}/{max_hp} ({get_hp_status()})
🍖 Голод: {hunger}/{max_hunger} ({get_hunger_status()})
🎒 Инвентарь: {get_inventory_display()}
{money_name != "": 💎 {money_name}: {money}}
{"-----------------------------------------------------------------------------"}


=== function get_hp_status() ===
{
- hp == 10: ~ return "💚 Абсолютно здоров"
- hp == 9: ~ return "💚 Почти идеально"
- hp == 8: ~ return "💚 В хорошей форме"
- hp == 7: ~ return "💛 Лёгкие царапины"
- hp == 6: ~ return "💛 Немного побит"
- hp == 5: ~ return "💛 Заметно потрепан"
- hp == 4: ~ return "🧡 Сильно ранен"
- hp == 3: ~ return "🧡 Тяжело ранен"
- hp == 2: ~ return "❤️ Критическое состояние"
- hp == 1: ~ return "❤️ При смерти"
- hp <= 0: ~ return "💀 Мёртв"
- else: ~ return "⭐ Сверхчеловек"
}

=== function get_hunger_status() ===
{
- hunger == 10: ~ return "💚 Сыт"
- hunger == 9: ~ return "💚 Почти сыт"
- hunger == 8: ~ return "💚 Легкое чувство голода"
- hunger == 7: ~ return "💛 Немного голоден"
- hunger == 6: ~ return "💛 Заметно голоден"
- hunger == 5: ~ return "💛 Довольно голоден"
- hunger == 4: ~ return "🧡 Сильно голоден"
- hunger == 3: ~ return "🧡 Очень голоден"
- hunger == 2: ~ return "❤️ Критически голоден"
- hunger == 1: ~ return "❤️ Умирает от голода"
- hunger <= 0: ~ return "💀 Умер от голода"
- else: ~ return "⭐ Сверхнасыщен"
}

=== function get_inventory_display() ===
{inventory == (): Пусто|{inventory}}

=== function to_inventory(ref list_from, item) ===
~ list_from -= item
~ inventory += item


=== status_thread ===
{show_status()}
{hp <= 0:
П О Т Р А Ч Е Н О
-> end_game
}
{hunger <= 0:
У М Е Р   О Т   Г О Л О Д А
-> end_game
}
->->

=== move(-> place_to_return_to)
~ temp random_hunger = RANDOM(1, 3)
{random_hunger == 1:
    ~ hunger -= 1
}
-> status_thread -> place_to_return_to


=== function iterate(prefix, list_to_iterate) ===
~ temp count = LIST_COUNT(list_to_iterate)

// Если список пустой
{count == 0:
    ~ return ""
}

// Если один элемент - используем интерполяцию
{count == 1:
    ~ return prefix + " {list_to_iterate}"
}

// Если два элемента
{count == 2:
    ~ temp first = LIST_MIN(list_to_iterate)
    ~ temp second = LIST_MAX(list_to_iterate)
    ~ return prefix + " {first} и {second}"
}

// Если больше двух элементов
{count > 2:
    ~ return prefix + " " + format_list_items(list_to_iterate)
}

~ return ""

=== function format_list_items(items) ===
~ temp count = LIST_COUNT(items)
~ temp first = LIST_MIN(items)
~ temp remaining = items - first

{
- count == 1:
    ~ return "{first}"
- count == 2:
    ~ temp last = LIST_MAX(remaining)
    ~ return "{first} и {last}"
- else:
    ~ return "{first}, " + format_list_items(remaining)
}


=== end_game ===
Игра окончена!
-> END
//Как видишь файл мы заканчиваем пустой строкой