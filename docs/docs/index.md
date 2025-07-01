# Диаграмма контейнеров




```puml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title Кинобездна — Container Diagram (упрощённая C4)

Person(user, "User", "Пользователь любого клиентского приложения")
Person(admin, "Admin", "Администратор кинотеатра")

Container(mobileApp, "Mobile App", "Flutter/Kotlin", "Мобильное приложение")
Container(webApp, "Web App", "React", "Веб-клиент")
Container(smartTvApp, "SmartTV App", "Tizen/AndroidTV", "Приложение для ТВ")
Container(adminApp, "Admin Web App", "React", "Веб-приложение для админов")

System_Boundary(cb, "Кинобездна (CinemaAbyss)") {
    Container(apiGw, "API Gateway", "Nginx/Kong", "Единая точка входа; маршрутизация, авторизация (JWT), троттлинг")
    Container(authSvc, "Auth Service", "Go", "Взаимодействие с Keycloak, проверка JWT, регистрация/логин")
    Container(userSvc, "User Service", "Go", "Пользовательские профили и избранное")
    Container(metadataSvc, "Metadata Service", "Go", "Каталог фильмов, жанры, актёры и оценки")
    Container(contentSvc, "Content Service", "Go", "Загрузка и ссылки на видео-контент")
    Container(paymentSvc, "Payment Service", "Go", "Платежи, скидки, подписки")
    Container(subscriptionSvc, "Subscription Service", "Go", "Учёт активных подписок")
    Container(historySvc, "History Service", "Go", "История просмотров")
    Container(ratingSvc, "Rating/Favorite Service", "Go", "Оценки, Add to Favorite")
    Container(notificationSvc, "Notification Service", "Go", "Email, sms, push рассылки")
    Container(recoIntegrator, "Recommendation Integrator", "Go", "Асинхронное обновление рекомендаций (Kafka)")

    Container(kafka, "Kafka", "Kafka", "Event bus: user actions, recommendations, notifications")
    ContainerDb(pgUser, "UserDB", "PostgreSQL", "Данные пользователей, логины")
    ContainerDb(pgMeta, "MetadataDB", "PostgreSQL", "Метаданные фильмов")
    ContainerDb(pgPay, "PaymentDB", "PostgreSQL", "Финансовые транзакции")
    ContainerDb(pgSub, "SubscriptionDB", "PostgreSQL", "Активные подписки")
    ContainerDb(pgContent, "ContentDB", "PostgreSQL", "Видео-файлы, ссылки")
    ContainerDb(pgFav, "RatingDB", "PostgreSQL", "Оценки и избранное")
    ContainerDb(pgHist, "HistoryDB", "PostgreSQL", "История просмотров")
    ContainerDb(pgNotif, "NotifDB", "PostgreSQL", "Отправленные уведомления")
}

System(keycloak, "Keycloak", "OAuth2-сервер, централизованная авторизация")
System(recoSys, "Recommendation System", "Внешняя рекомендательная система (через Kafka)")
System(payExt, "Payment Gateway", "Внешний платёжный провайдер")
System(emailSys, "Email Provider", "Сервис отправки email")
System(smsSys, "SMS Provider", "Сервис отправки SMS")
System(pushSys, "Push Provider", "Push для мобильных устройств")
System(k8s, "Kubernetes Cluster", "Контейнерная оркестрация")
System(ci, "CI/CD Pipeline", "GitHub Actions/Jenkins")

Rel(user, mobileApp, "Пользуется")
Rel(user, webApp, "Пользуется")
Rel(user, smartTvApp, "Пользуется")
Rel(admin, adminApp, "Пользуется")

Rel(mobileApp, apiGw, "REST/gRPC")
Rel(webApp, apiGw, "REST/gRPC")
Rel(smartTvApp, apiGw, "REST/gRPC")
Rel(adminApp, apiGw, "REST/gRPC")

Rel(apiGw, authSvc, "Аутентификация")
Rel(apiGw, userSvc, "Запросы по user REST/gRPC")
Rel(apiGw, metadataSvc, "Получение фильмов")
Rel(apiGw, contentSvc, "Доступ к контенту")
Rel(apiGw, paymentSvc, "Платежные методы")
Rel(apiGw, subscriptionSvc, "Подписки")
Rel(apiGw, historySvc, "История просмотров")
Rel(apiGw, ratingSvc, "Оценки/Избранное")
Rel(apiGw, notificationSvc, "Уведомления")
Rel(apiGw, recoIntegrator, "Получить рекомендации")

Rel(authSvc, keycloak, "OAuth2/JWT")
Rel(userSvc, pgUser, "CRUD")
Rel(metadataSvc, pgMeta, "CRUD")
Rel(contentSvc, pgContent, "CRUD")
Rel(paymentSvc, pgPay, "CRUD")
Rel(subscriptionSvc, pgSub, "CRUD")
Rel(historySvc, pgHist, "CRUD")
Rel(ratingSvc, pgFav, "CRUD")
Rel(notificationSvc, pgNotif, "CRUD")

Rel(userSvc, kafka, "Публикует user actions")
Rel(historySvc, kafka, "Публикует просмотры")
Rel(ratingSvc, kafka, "Публикует/читает рейтинги")
Rel(recoIntegrator, kafka, "Пишет/читает рекомендации")

Rel(kafka, recoSys, "user_action/recommendations")
Rel(recoSys, kafka, "recommendations (async)")

Rel(notificationSvc, emailSys, "Отправляет email")
Rel(notificationSvc, smsSys, "Отправляет SMS")
Rel(notificationSvc, pushSys, "Отправляет PUSH")

Rel(paymentSvc, payExt, "Оплата, возвраты")
Rel_U(ci, k8s, "Deploy/Docker/Helm")
@enduml
```
