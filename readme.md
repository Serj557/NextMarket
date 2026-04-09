# NextMarket

Проект реализует работу с пользователями, товарами, заказами и рейтингами товаров, своего рода аналог "Авито".

## Архитектура

Стек:
- .NET 8 (`ASP.NET Core Web API`)
- Entity Framework Core 8
- PostgreSQL (`Npgsql`)
- Swagger/OpenAPI

Основные сущности:
- `users`
- `products`
- `orders`
- `order_items`
- `product_ratings`

Связи:
- `users (1) -> (M) products`
- `users (1) -> (M) orders`
- `orders (1) -> (M) order_items`
- `products (1) -> (M) order_items`
- `users (1) -> (M) product_ratings`
- `products (1) -> (M) product_ratings`

Ограничения данных:
- `products.price > 0`
- `products.stock_qty >= 0`
- `order_items.quantity > 0`
- `order_items.unit_price > 0`
- `product_ratings.rating BETWEEN 1 AND 5`
- `users.email` — уникальный
- `product_ratings(product_id, user_id)` — уникальная пара

Структура backend:
- `NextMarket.Api/Domain` — доменные модели и enum статусов заказа
- `NextMarket.Api/Data` — `AppDbContext`, конфигурация таблиц, связей, индексов и ограничений
- `NextMarket.Api/Contracts` — DTO запросов и ответов
- `NextMarket.Api/Controllers` — REST API
- `NextMarket.Api/Services` — бизнес-логика создания заказов

## Запуск

1. Указать строку подключения к PostgreSQL в `NextMarket.Api/appsettings.json`:

`ConnectionStrings:DefaultConnection`

2. Перейти в папку проекта:

`cd NextMarket.Api`

3. Выполнить команды:

`dotnet restore`  
`dotnet build`  
`dotnet run`

4. Swagger:

`https://localhost:<port>/swagger`