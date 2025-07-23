LIST inventory = Ничего
VAR current_location = "Таинственная комната"
VAR hp = 10
VAR max_hp = 10
VAR money = 0
VAR money_name = "Рублей"

=== function show_status() ===
{"-----------------------------------------------------------------------------"}
📍 Локация: {current_location}
❤️ Здоровье: {hp}/{max_hp} ({get_hp_status()})
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
->->

=== move(-> place_to_return_to)
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
