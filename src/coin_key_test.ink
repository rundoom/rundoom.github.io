INCLUDE ink_prekoles.ink
~ money_name = "Золота" //Название игровой валюты в родительном падеже
~ money_name = ""//Если наличие денег не подразумевается, делаем пустой строкой
LIST mysterious_room_content = (Ключ), (Монета)// Тут объявляем отдельный список предметов для каждой локации или существа у которых есть предметы.
LIST other_collectables = (Сигарета)//Не забудь тут перечислить те предметы которые есть в игре но никому ни принадлежат
LIST start_items = (Зажигалка), (Телефон)//Тут объявляем те предметы которые не привязаны к локациям или существам - например стартовые предметы  
~ inventory = start_items
-> move(-> mysterious_room)//Переходы делаем через move, а не просто -> knot

=== mysterious_room ===//Knot'ами мы обозначаем локации
~ current_location = "Таинственная комната"
# IMAGE: b4b4b459-8e90-4f7e-953b-4074b9f70847.png
Вы находитесь в таинственной комнате. 
В углу есть запертая дверь. {iterate("На полу есть", mysterious_room_content)} {iterate("а так же", other_collectables)}. 
* [Взять ключ] -> mysterious_room.take_key
* [Взять монету] 
  {to_inventory(mysterious_room_content, Монета)}//Отнимаем Монету у локации и передаём в инвентарь
  Вы взяли монету.
  -> move(-> mysterious_room)
* {inventory has Ключ} [Использовать ключ на двери] -> move(-> mysterious_room.use_key)
* [Выбить дверь ногой # unclickable: kick_the_door] -> //kick_the_door(Переходы на несуществующие ветки необходимо комментить как в этом примере)
+ [Пойти в коридор] -> move(-> corridor)
+ [Выбить дверь головой] 
~ hp -= 5
Это было больно и неэффективно
-> move(-> mysterious_room)

= take_key
{to_inventory(mysterious_room_content, Ключ)}
# IMAGE: 550878ac-6a1b-4bf4-9297-59ebdea5bd6c.png
Вы взяли ключ.
* [Продолжить] -> move(-> mysterious_room)

= use_key
~ inventory -= Ключ
Вы использовали ключ. Дверь открылась и исчезла, открыв проход в сад.
+ [Пойти в сад] -> move(-> garden)
+ [Остаться в комнате] -> move(-> mysterious_room)

=== corridor ===
~ current_location = "Коридор"
# IMAGE: b67f1f2c-886c-4849-91d5-167cff3c9f73.png
Длинный темный коридор. Здесь довольно пусто.
+ [Вернуться в таинственную комнату] -> move(-> mysterious_room)
+ {inventory has Монета} [Подбросить монету]
Вы подбросили монету. {~Выпал орёл|Выпала решка}!
-> move(-> corridor)
+ [Пойти дальше по коридору] -> move(-> corridor.corridor_end)

= corridor_end
Коридор заканчивается тупиком.
+ [Вернуться назад] -> move(-> corridor)

=== garden ===
~ current_location = "Сад"
Красивый сад с цветами и деревьями. Здесь очень мирно.
+ [Вернуться в таинственную комнату] -> move(-> mysterious_room)
* [Закончить игру] -> move(-> end_game)