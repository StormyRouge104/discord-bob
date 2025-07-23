<p align="center">
  <p align="center"> Local discord bot</p>
</p>
кастомный бот 104 йоу
на данный момент умеет только в команду /pic (импортозамещение с телеграмма). для того чтобы получать изображения бот делает HTTP запрос к моему локальному SearxNG серверу, затем вытаскивает из ответа img_src у найденных результатов
кидает запрос - получает JSON - фильтрует картинки - отправляет в дискорд


--------------------------


a local bot for my private discord server
Currently, it only has a /pic command. to get images bot makes HTTP requests to my local SearxNG server, then gets img_src
sending request - receives JSON - filters images sources - return images to discord
