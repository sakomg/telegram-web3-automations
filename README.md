## Руководство по использованию

01. Создайте папку data в корневом каталоге проекта и поместите в неё файл apps.json. Содержимое apps.json:

  ```json
  [
    {
      "id": "Account_1",
      "active": true,
      "username": "username",
      "ua": "User-Agent", // example: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.122 Safari/537.00
      "proxy": {
        "soft": "soft_value",
        "type": "type_value",
        "host": "ip_value",
        "port": "port_value",
        "user": "user_value",
        "password": "password_value"
      },
      "games": {
        "blum": "link from tg",
        "iceberg": "linf from tg",
        "hamster": "link from tg"
      }
    }
  ]
  ```

02. Выполните команду для создания и заполнения файла .env: `npm run copy:env`
03. Установите ADS Power браузер и создайте в нём профиль с именем **General**.
04. Вызвать в теминале: `npm run start`
05. Автору на кофе (EVM): `0x0D7D1Dd57D03872298236403d8d5d7A78135d417`