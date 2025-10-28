<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DnD Character Manager</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
</head>
<body>
    <div id="app">
        <!-- Хедер с аутентификацией -->
        <header class="app-header">
            <div class="header-content">
                <h1 class="app-title">🎭 DnD Character Manager</h1>
                
                <div class="auth-container">
                    <!-- Секция для неавторизованных пользователей -->
                    <div id="auth-section" class="auth-section">
                        <button id="signin-btn" class="btn-secondary">Войти</button>
                        <button id="signup-btn" class="btn-primary">Регистрация</button>
                    </div>
                    
                    <!-- Секция для авторизованных пользователей -->
                    <div id="user-section" class="user-section" style="display: none;">
                        <span class="user-info">
                            <span id="user-email"></span>
                        </span>
                        <button id="logout-btn" class="btn-secondary">Выйти</button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Навигация -->
        <nav class="tabs">
            <button class="tab-button active" data-tab="characters">🎭 Персонажи</button>
            <button class="tab-button" data-tab="spells">✨ Заклинания</button>
            <button class="tab-button" data-tab="dice">🎲 Кубики</button>
            <button class="tab-button" data-tab="combat">⚔️ Бой</button>
        </nav>

        <!-- Контент вкладок -->
        <div class="tab-content">
            <!-- Вкладка Персонажи -->
            <div id="characters" class="tab-pane active">
                <div class="characters-header">
                    <h2>Мои персонажи</h2>
                    <button id="add-character" class="btn-primary">
                        ＋ Создать персонажа
                    </button>
                </div>
                
                <div id="characters-list" class="characters-grid">
                    <!-- Список персонажей будет здесь -->
                </div>
            </div>
            
            <!-- Вкладка Заклинания -->
            <div id="spells" class="tab-pane">
                <div class="spells-header">
                    <h2>Библиотека заклинаний</h2>
                </div>
                
                <div class="spells-filters">
                    <div class="filter-group">
                        <label for="spell-level-filter">Уровень:</label>
                        <select id="spell-level-filter">
                            <option value="all">Все уровни</option>
                            <option value="0">Заговоры</option>
                            <option value="1">1 уровень</option>
                            <option value="2">2 уровень</option>
                            <option value="3">3 уровень</option>
                            <option value="4">4 уровень</option>
                            <option value="5">5 уровень</option>
                            <option value="6">6 уровень</option>
                            <option value="7">7 уровень</option>
                            <option value="8">8 уровень</option>
                            <option value="9">9 уровень</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="spell-class-filter">Класс:</label>
                        <select id="spell-class-filter">
                            <option value="all">Все классы</option>
                            <option value="Бард">Бард</option>
                            <option value="Волшебник">Волшебник</option>
                            <option value="Жрец">Жрец</option>
                            <option value="Друид">Друид</option>
                            <option value="Паладин">Паладин</option>
                            <option value="Следопыт">Следопыт</option>
                            <option value="Чародей">Чародей</option>
                            <option value="Колдун">Колдун</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="spell-school-filter">Школа:</label>
                        <select id="spell-school-filter">
                            <option value="all">Все школы</option>
                            <option value="Вызов">Вызов</option>
                            <option value="Ограждение">Ограждение</option>
                            <option value="Воплощение">Воплощение</option>
                            <option value="Прорицание">Прорицание</option>
                            <option value="Очарование">Очарование</option>
                            <option value="Иллюзия">Иллюзия</option>
                            <option value="Некромантия">Некромантия</option>
                            <option value="Преобразование">Преобразование</option>
                        </select>
                    </div>
                    
                    <div class="filter-group search-group">
                        <label for="spell-search">Поиск:</label>
                        <input type="text" id="spell-search" placeholder="Название или описание...">
                    </div>
                </div>
                
                <div id="spells-list" class="spells-list">
                    <!-- Список заклинаний будет здесь -->
                </div>
            </div>
            
            <div id="dice" class="tab-pane">
                <h2>Бросок кубиков</h2>
                <div class="dice-buttons">
                    <button class="dice" data-sides="4">d4</button>
                    <button class="dice" data-sides="6">d6</button>
                    <button class="dice" data-sides="8">d8</button>
                    <button class="dice" data-sides="10">d10</button>
                    <button class="dice" data-sides="12">d12</button>
                    <button class="dice" data-sides="20">d20</button>
                    <button class="dice" data-sides="100">d100</button>
                </div>
                <div id="dice-result"></div>
            </div>
            
            <div id="combat" class="tab-pane">
                <h2>Трекер боя</h2>
                <button id="add-combatant">＋ Добавить участника</button>
                <div id="initiative-list"></div>
            </div>
        </div>
    </div>

    <!-- Модальное окно аутентификации -->
    <div id="auth-modal" class="modal-overlay" style="display: none;">
        <div class="modal auth-modal">
            <div class="modal-header">
                <h3 id="auth-modal-title">Вход</h3>
                <button id="auth-modal-close" class="btn-close">×</button>
            </div>
            
            <form id="auth-form" class="auth-form">
                <div class="form-group">
                    <label for="auth-email">Email</label>
                    <input type="email" id="auth-email" required>
                </div>
                
                <div class="form-group">
                    <label for="auth-password">Пароль</label>
                    <input type="password" id="auth-password" required minlength="6">
                </div>
                
                <div id="auth-username-field" class="form-group" style="display: none;">
                    <label for="auth-username">Имя пользователя</label>
                    <input type="text" id="auth-username">
                </div>
                
                <div id="auth-error" class="error-message"></div>
                
                <div class="form-actions">
                    <button type="button" id="auth-cancel-btn" class="btn-secondary">Отмена</button>
                    <button type="submit" id="auth-submit-btn" class="btn-primary">Войти</button>
                </div>
            </form>
        </div>
    </div>

    <script src="js/db.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/spell-structure.js"></script>
    <script src="js/spell-loader.js"></script>
    <script src="js/spells-manager.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
