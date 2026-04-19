const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const fs = require('fs/promises'); 
const path = require('path');
const multer = require('multer');
const sharp = require('sharp'); 
const PublicationFileManager = require('./fileManager.cjs');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

app.use(cors({
    origin: 'http://localhost:3000', // Укажите точный источник вашего фронтенда
    credentials: true, // Разрешить отправку и получение куки
  }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Timestamp added to filename to avoid conflicts
    }
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }  // Max file size of 100MB
  });

  // Handle file uploads
  app.post('/api/upload', upload.single('media'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    // Generate file URL to send back to the client
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully', fileUrl });
  });
// --- **Настройка Telegram Bot API** ---

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // ВАШ ТОКЕН
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;   // ВАШ CHAT ID
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// --- **Настройка подключения к MySQL** ---
const dbConfig = {
  host: 'localhost',        // хост БД
  user: 'admin',            // имя пользователя БД
  password: process.env.DB_PASSWORD,    // пароль БД
  database: 'users',    
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+10:00'
};

//  Секретный ключ для JWT (ХРАНИТЕ ЕГО В БЕЗОПАСНОМ МЕСТЕ, например, в .env)
const JWT_SECRET = process.env.JWT_SECRET; // ЗАМЕНИТЕ НА СВОЙ СЕКРЕТНЫЙ КЛЮЧ!

let dbPool; 
let fileManager; 

async function initializeDbPool() {
  try {
      dbPool = await mysql.createPool(dbConfig);
      console.log('Database connection pool created.');
  } catch (error) {
      console.error('Error creating database connection pool:', error);
      throw error;
  }
}

// Middleware для добавления fileManager к запросу
async function fileManagerMiddleware(req, res, next) {
    if (!fileManager) {  // Создаем fileManager только если он еще не создан
        fileManager = new PublicationFileManager(dbPool, __dirname);
        await fileManager.initialize();
    }
    req.fileManager = fileManager; // Добавляем к req
    next();
  }

// --- **Middleware для проверки JWT** ---
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.sendStatus(401);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error("JWT verification error:", error);
      return res.sendStatus(403);
    }
};
  
  // --- **Middleware для проверки роли пользователя** ---
  const authorizeRole = (role) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).send('Unauthorized: No user found');
        }

        let connection;
        try {
            connection = await dbPool.getConnection();
            const [users] = await connection.query('SELECT category_id FROM users WHERE id = ?', [req.user.userId]);

            if (users.length === 0) {
                return res.status(404).send('User not found');
            }

            const user = users[0];
            const [categories] = await connection.query('SELECT name FROM user_categories WHERE id = ?', [user.category_id]);

            if (categories.length === 0) {
                return res.status(404).send('Category not found');
            }

            const userRole = categories[0].name;

            if (userRole !== role) {
                return res.status(403).send('Forbidden: Insufficient permissions');
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).send('Server error during authorization');
        } finally {
            if (connection) connection.release();
        }
    };
};

// --- **Генерация секретного кода** ---
function generateSecretCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Функция сжатия изображения
const compressImage = async (filePath) => {
    try {
        const compressedData = await sharp(filePath)
            .resize({ width: 100 }) // Уменьшаем ширину, сохраняя пропорции
            .jpeg({ quality: 10 }) // Низкое качество для максимального сжатия
            .toBuffer();
        return compressedData;
    } catch (error) {
        console.error('Error compressing image:', error);
        return null;
    }
};

// Функция для кэширования медиа в куки с логированием
const cacheMediaInCookies = async (req, res, mediaUrl) => {
    console.log("КУКИ: Попытка кэширования медиа");
    try {
        if (!mediaUrl || !mediaUrl.startsWith(`http://localhost:5000/uploads/`)) {
            console.log(`КУКИ: Пропущено - не локальный файл: ${mediaUrl}`);
            return;
        }

        const fileName = path.basename(mediaUrl);
        const filePath = path.join(__dirname, 'uploads', fileName);

        await fs.access(filePath, fs.constants.F_OK);
        let fileData = await fs.readFile(filePath);

        const isImage = /\.(jpe?g|png|gif)$/i.test(fileName);
        let base64Data;

        if (isImage) {
            const initialSize = fileData.length;
            if (initialSize > 3000) {
                fileData = await compressImage(filePath);
                if (!fileData || fileData.length > 3000) {
                    console.log(`КУКИ: Пропущено - не удалось сжать изображение до 3KB: ${mediaUrl} (размер: ${fileData ? fileData.length : initialSize} байт)`);
                    return;
                }
                console.log(`КУКИ: Сжато изображение ${mediaUrl} с ${initialSize} до ${fileData.length} байт`);
            }
            base64Data = fileData.toString('base64');
        } else {
            console.log(`КУКИ: Пропущено - не изображение: ${mediaUrl}`);
            return;
        }

        if (base64Data.length > 4096) {
            console.log(`КУКИ: Пропущено - размер base64 превышает 4KB: ${mediaUrl} (${base64Data.length} байт)`);
            return;
        }

        const cookieName = `media_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        res.cookie(cookieName, base64Data, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });
        console.log(`КУКИ: Успешно сохранено в куки: ${cookieName} (размер: ${base64Data.length} байт)`);
    } catch (error) {
        console.error(`КУКИ: Ошибка при кэшировании ${mediaUrl}:`, error);
    }
};


  //----ПОЛУЧЕНИЕ ВСЕХ КАТЕГОРИЙ ПОЛЬЗОВАТЕЛЕЙ
  app.get('/api/categories', async (req, res) => {
      let connection;
      try{
          connection = await dbPool.getConnection();
          const [categories] = await connection.query('SELECT * from user_categories');
          res.json(categories);
      } catch (error) {
          console.error('Ошибка при получении категорий:', error);
          res.status(500).json({ error: 'Ошибка сервера при получении категорий.' });
      } finally {
          if (connection) connection.release();
      }
  });

  // --- **Маршруты** ---
  app.post('/api/login', async (req, res) => {
    const { username, password, secretCode } = req.body;
  
    if (!username || !password || !secretCode) {
      return res.status(400).json({ error: 'Имя пользователя, пароль и секретный код обязательны.' });
    }
  
    let connection;
    try {
      connection = await dbPool.getConnection();
      const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
  
      if (users.length === 0) {
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль.' });
      }
  
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль.' });
      }
  
      if (user.secret_code !== secretCode) {
        return res.status(401).json({ error: 'Неверный секретный код.' });
      }
  
      const [categoryResult] = await connection.query('SELECT name FROM user_categories WHERE id = ?', [user.category_id]);
      const categoryName = categoryResult.length > 0 ? categoryResult[0].name : null;
  
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  
      // Проверяем, есть ли согласие на куки, но не блокируем авторизацию
      const cookieConsent = req.cookies['cookieConsent'];
      if (cookieConsent === 'accepted') {
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 1 день
        });
      }
  
      // Авторизация завершается независимо от куки
      res.json({
        message: 'Вход выполнен успешно!',
        token,
        user: { id: user.id, username: user.username, category: categoryName },
      });
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    } finally {
      if (connection) connection.release();
    }
  });
  
  
  // Регистрация
  app.post('/api/register', async (req, res) => {
    const { username, password, categoryId } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Длина пароля не может быть меньше 6 символов.' });
    }

    if (categoryId && ![1, 2, 3].includes(parseInt(categoryId))) {
        return res.status(400).json({ error: 'Недопустимый ID категории.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();

        const [existingUsers] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким именем уже существует.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const insertQuery = 'INSERT INTO users (username, password_hash, salt, category_id) VALUES (?, ?, ?, ?)';
        await connection.query(insertQuery, [username, passwordHash, salt, categoryId || 3]);

        res.status(201).json({ message: 'Пользователь успешно зарегистрирован.' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    } finally {
        if (connection) connection.release();
    }
});

// Новый маршрут для обработки согласия на куки
app.post('/api/accept-cookies', async (req, res) => {
    const { token, accept } = req.body;
  
    if (!token || typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'Токен и решение обязательны.' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
  
      if (accept) {
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie('cookieConsent', 'accepted', {
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        res.json({ message: 'Куки сохранены.' });
      } else {
        res.cookie('cookieConsent', 'declined', {
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        res.json({ message: 'Куки не сохранены.' });
      }
    } catch (error) {
      console.error('Ошибка при обработке согласия на куки:', error);
      return res.status(500).json({ error: 'Ошибка сервера.' });
    }
  });
  
  // Убедимся, что директория для публикаций существует
  const publicationsDir = path.join(__dirname, 'publications');

  (async () => {
      try {
          await fs.mkdir(publicationsDir, { recursive: true }); // recursive: true создает родительские директории, если их нет
          console.log('Publications directory:', publicationsDir);
      } catch (error) {
          console.error('Error creating publications directory:', error);
          process.exit(1); //  Выход, если не смогли создать директорию
      }
  })();

  // Получение списка публикаций (для главной страницы)
  app.get('/api/publications', async (req, res) => {
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [publications] = await connection.query(`
            SELECT p.id, p.title, p.content, p.created_at, u.username as author, p.image_url
            FROM publications p
            JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);

        const formattedPublications = publications.map(pub => ({
            ...pub,
            created_at: new Date(pub.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            preview: pub.content.length > 100 ? pub.content.substring(0, 100) + "..." : pub.content,
        }));

        res.json(formattedPublications);
    } catch (error) {
        console.error('Ошибка при получении публикаций:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении публикаций.' });
    } finally {
        if (connection) connection.release();
    }
});

// Получение полной информации о публикации (для страницы "Подробнее")
app.get('/api/publications/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [publications] = await connection.query(
            'SELECT p.*, u.username as author FROM publications p JOIN users u ON p.author_id = u.id WHERE p.id = ?',
            [id]
        );

        if (publications.length === 0) {
            return res.status(404).json({ error: 'Публикация не найдена.' });
        }

        const publication = publications[0];
        publication.created_at = new Date(publication.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        res.json(publication);
    } catch (error) {
        console.error('Ошибка при получении публикации:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении публикации.' });
    } finally {
        if (connection) connection.release();
    }
});

app.post('/api/publications', authenticateToken, authorizeRole('admin'), fileManagerMiddleware, async (req, res) => {
    const { title, content, image_url } = req.body;
    const author_id = req.user.userId;

    if (!title || !content) {
        return res.status(400).json({ error: 'Заголовок и содержание обязательны.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO publications (title, content, image_url, author_id) VALUES (?, ?, ?, ?)',
            [title, content, image_url, author_id]
        );

        const publication = {
            id: result.insertId,
            title,
            content,
            image_url
        };

        await req.fileManager.savePublicationFiles(publication);
        if (image_url) {
            await cacheMediaInCookies(req, res, image_url);
        }

        res.status(201).json({
            message: 'Публикация создана',
            ...publication
        });
    } catch (error) {
        console.error('Ошибка при создании публикации:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании публикации.' });
    } finally {
        if (connection) connection.release();
    }
});
  
// PUT запрос для *обновления* публикации
app.put('/api/publications/:id', authenticateToken, authorizeRole('admin'), fileManagerMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, content, image_url } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Заголовок и содержание обязательны.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.query(
            'UPDATE publications SET title = ?, content = ?, image_url = ? WHERE id = ?',
            [title, content, image_url, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Публикация не найдена.' });
        }

        const [updatedPublications] = await connection.query('SELECT * FROM publications WHERE id = ?', [id]);
        if (updatedPublications.length === 0) {
            return res.status(404).json({ error: 'Публикация не найдена после обновления.' });
        }

        if (image_url) {
            await cacheMediaInCookies(req, res, image_url);
        }

        res.json(updatedPublications[0]);
    } catch (error) {
        console.error('Ошибка при обновлении публикации:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении публикации.' });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE запрос для *удаления* публикации.
app.delete('/api/publications/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.query('DELETE FROM publications WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Публикация не найдена.' });
        }
        res.json({ message: 'Публикация удалена.' });
    } catch (error) {
        console.error('Ошибка при удалении публикации:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении публикации.' });
    } finally {
        if (connection) connection.release();
    }
});

// Вспомогательная функция для запроса медиа (файла или URL)
async function askForMedia(chatId, bot) {
    const mediaMsg = await new Promise((resolve) => {
        bot.sendMessage(chatId, 'Отправьте фото, видео, GIF или укажите URL (или "Нет" для пропуска):', {
            reply_markup: { keyboard: [['Нет']], one_time_keyboard: true }
        });
        bot.once('message', (msg) => resolve(msg));
    });

    if (mediaMsg.text && mediaMsg.text.toLowerCase() === 'нет') return null;

    // Проверка, является ли ввод URL-ссылкой
    if (mediaMsg.text && /^https?:\/\/[^\s]+$/.test(mediaMsg.text)) {
        const url = mediaMsg.text;
        console.log(`[ADD] URL provided: ${url}`);
        return url;
    }

    // Обработка файлов
    if (!mediaMsg.photo && !mediaMsg.video && !mediaMsg.document) {
        await bot.sendMessage(chatId, 'Некорректный ввод. Отправьте файл, URL или "Нет".');
        return askForMedia(chatId, bot);
    }

    let fileId, fileType, fileSize;
    if (mediaMsg.photo) {
        fileId = mediaMsg.photo[mediaMsg.photo.length - 1].file_id;
        fileType = 'photo';
        fileSize = mediaMsg.photo[mediaMsg.photo.length - 1].file_size;
    } else if (mediaMsg.video) {
        fileId = mediaMsg.video.file_id;
        fileType = 'video';
        fileSize = mediaMsg.video.file_size;
    } else if (mediaMsg.document && mediaMsg.document.mime_type.startsWith('image/gif')) {
        fileId = mediaMsg.document.file_id;
        fileType = 'gif';
        fileSize = mediaMsg.document.file_size;
    } else {
        await bot.sendMessage(chatId, 'Поддерживаются только фото, видео и GIF.');
        return askForMedia(chatId, bot);
    }

    if (fileSize > 100 * 1024 * 1024) {
        await bot.sendMessage(chatId, 'Файл превышает 100 МБ.');
        return askForMedia(chatId, bot);
    }

    try {
        const fileLink = await bot.getFileLink(fileId);
        const fileName = Date.now() + path.extname(fileLink);
        const mediaUrl = `http://localhost:5000/uploads/${fileName}`;
        const response = await fetch(fileLink);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const buffer = await response.arrayBuffer();
        await fs.writeFile(path.join(__dirname, 'uploads', fileName), Buffer.from(buffer));
        console.log(`[ADD] Media saved: ${mediaUrl}`);
        return mediaUrl;
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        await bot.sendMessage(chatId, error.code === 'ETELEGRAM' ? `Ошибка Telegram: ${error.response.body.description}` : 'Ошибка загрузки медиа.');
        return askForMedia(chatId, bot);
    }
}

  // --- **Обработчик команды /status** ---
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        if (!dbPool) {
            await bot.sendMessage(chatId, '⚠️ Соединение с сервером базы данных не установлено.');
            return;
        }
        await dbPool.query('SELECT 1');
        await bot.sendMessage(chatId, '✅ Сервер базы данных - Онлайн.');
    } catch (error) {
        console.error('Database status check failed:', error);
        let errorMessage = '❌ Сервер базы данных - Оффлайн.\nПричина: ';
        switch (error.code) {
            case 'ECONNREFUSED': errorMessage += 'Соединение отклонено.'; break;
            case 'ENOTFOUND': errorMessage += 'Хост не найден.'; break;
            case 'ER_ACCESS_DENIED_ERROR': errorMessage += 'Доступ запрещен.'; break;
            default: errorMessage += error.message;
        }
        await bot.sendMessage(chatId, errorMessage);
    }
});
  
  // -------------------------------------
  
  bot.onText(/\/set_sale/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) return;

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [activeSales] = await connection.query(
            'SELECT * FROM sales WHERE user_id = ? AND end_date > NOW()',
            [user.id]
        );
        if (activeSales.length > 0) {
            const sale = activeSales[0];
            await bot.sendMessage(chatId, `У вас уже есть активная акция (ID: ${sale.id})!\nНачало: ${new Date(sale.start_date).toLocaleString()}\nОкончание: ${new Date(sale.end_date).toLocaleString()}\nСначала отмените её с помощью /cancel_sale.`);
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки акций:', error);
        await bot.sendMessage(chatId, 'Ошибка при проверке активных акций.');
        return;
    } finally {
        if (connection) connection.release();
    }

    await bot.sendMessage(chatId, 'Введите дату и время начала акции (ГГГГ-ММ-ДД ЧЧ:ММ):');
    bot.once('message', async (startMsg) => {
        const startDate = new Date(startMsg.text);
        if (isNaN(startDate.getTime())) {
            await bot.sendMessage(chatId, 'Неверный формат даты начала.');
            return;
        }

        await bot.sendMessage(chatId, 'Введите дату и время окончания акции (ГГГГ-ММ-ДД ЧЧ:ММ):');
        bot.once('message', async (endMsg) => {
            const endDate = new Date(endMsg.text);
            if (isNaN(endDate.getTime())) {
                await bot.sendMessage(chatId, 'Неверный формат даты окончания.');
                return;
            }
            if (endDate <= startDate) {
                await bot.sendMessage(chatId, 'Дата окончания должна быть позже начала.');
                return;
            }

            let connection;
            try {
                connection = await dbPool.getConnection();
                const [result] = await connection.query(
                    'INSERT INTO sales (start_date, end_date, user_id, telegram_id) VALUES (?, ?, ?, ?)',
                    [startDate, endDate, user.id, msg.from.id]
                );
                const saleId = result.insertId;
                await bot.sendMessage(chatId, `Акция установлена! ID: ${saleId}\nНачало: ${startDate.toLocaleString()}\nОкончание: ${endDate.toLocaleString()}`);
                console.log(`[SET_SALE] User ${user.username} (ID: ${user.id}) set sale: ${startDate} - ${endDate}`);

                const timeToEnd = endDate - new Date();
                if (timeToEnd > 0) {
                    setTimeout(async () => {
                        let conn;
                        try {
                            conn = await dbPool.getConnection();
                            const [sale] = await conn.query('SELECT * FROM sales WHERE id = ?', [saleId]);
                            if (sale.length > 0 && new Date(sale[0].end_date) <= new Date()) {
                                await bot.sendMessage(sale[0].telegram_id, `🔔 Акция (ID: ${sale[0].id}) завершилась!\nНачало: ${new Date(sale[0].start_date).toLocaleString()}\nОкончание: ${new Date(sale[0].end_date).toLocaleString()}`);
                                await conn.query('DELETE FROM sales WHERE id = ?', [sale[0].id]);
                                console.log(`[SALE_EXPIRED] Sale ID: ${sale[0].id} expired and deleted.`);
                            }
                        } catch (error) {
                            console.error(`[SALE_EXPIRED] Error processing sale ID: ${saleId}`, error);
                        } finally {
                            if (conn) conn.release();
                        }
                    }, timeToEnd);
                }
            } catch (error) {
                console.error('Ошибка сохранения акции:', error);
                await bot.sendMessage(chatId, 'Ошибка при установке акции.');
            } finally {
                if (connection) connection.release();
            }
        });
    });
});

bot.onText(/\/cancel_sale/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) return;

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [activeSales] = await connection.query(
            'SELECT * FROM sales WHERE user_id = ? AND end_date > NOW()',
            [user.id]
        );
        if (activeSales.length === 0) {
            await bot.sendMessage(chatId, 'У вас нет активных акций для отмены.');
            return;
        }

        const sale = activeSales[0];
        await bot.sendMessage(chatId, `Вы уверены, что хотите отменить акцию (ID: ${sale.id})?\nНачало: ${new Date(sale.start_date).toLocaleString()}\nОкончание: ${new Date(sale.end_date).toLocaleString()}`, {
            reply_markup: { keyboard: [['Да'], ['Нет']], one_time_keyboard: true }
        });

        bot.once('message', async (confirmMsg) => {
            if (confirmMsg.text.toLowerCase() === 'да') {
                await connection.query('DELETE FROM sales WHERE id = ?', [sale.id]);
                await bot.sendMessage(chatId, `Акция (ID: ${sale.id}) отменена.`);
                console.log(`[CANCEL_SALE] User ${user.username} (ID: ${user.id}) cancelled sale ID: ${sale.id}`);
            } else {
                await bot.sendMessage(chatId, 'Отмена акции отклонена.');
            }
        });
    } catch (error) {
        console.error('Ошибка проверки акций:', error);
        await bot.sendMessage(chatId, 'Ошибка при проверке акций.');
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/sale', async (req, res) => {
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE start_date <= NOW() AND end_date > NOW() ORDER BY start_date ASC LIMIT 1'
        );

        if (sales.length === 0) {
            return res.json({ active: false });
        }

        const sale = sales[0];
        res.json({
            active: true,
            startDate: sale.start_date,
            endDate: sale.end_date,
            id: sale.id
        });
    } catch (error) {
        console.error('Ошибка при получении данных об акции:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных об акции.' });
    } finally {
        if (connection) connection.release();
    }
});

  app.post('/api/send-message', async (req, res) => {
      const { fullName, phone } = req.body;
  
      const messageText = `🔔 Заявка на звонок!\n\nИмя: ${fullName}\nТелефон: ${phone}`;
  
      try {
          await bot.sendMessage(TELEGRAM_CHAT_ID, messageText);
          console.log('Сообщение отправлено в Telegram:', messageText);
          res.json({ message: 'Сообщение успешно отправлено!' });
      } catch (error) {
          console.error('Ошибка отправки в Telegram: ', error);
          res.status(500).json({ error: 'Ошибка сервера.' });
      }
  });

  bot.onText(/\/generate_secret_code/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) {
        await bot.sendMessage(chatId, 'Сначала привяжите Telegram с помощью /check_telegram.');
        return;
    }

    const newSecretCode = generateSecretCode();
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.query('UPDATE users SET secret_code = ? WHERE id = ?', [newSecretCode, user.id]);
        await bot.sendMessage(chatId, `Ваш новый секретный код: **${newSecretCode}**. Сохраните его!`);
        console.log(`[GENERATE_SECRET_CODE] New code "${newSecretCode}" for user ${user.username} (ID: ${user.id}).`);
    } catch (error) {
        console.error('Ошибка генерации кода:', error);
        await bot.sendMessage(chatId, 'Ошибка при генерации кода.');
    } finally {
        if (connection) connection.release();
    }
});

  // Обработчик команды изменения дней очистки
  bot.onText(/\/set_cleanup_days (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const days = parseInt(match[1]);
    if (days < 1 || days > 30) {
        await bot.sendMessage(chatId, '⚠️ Количество дней должно быть от 1 до 30.');
        return;
    }

    try {
        const success = await fileManager.updateCleanupDays(days);
        await bot.sendMessage(chatId, success ? `✅ Период очистки: ${days} дней.` : '❌ Не удалось обновить период.');
    } catch (error) {
        console.error('Ошибка установки дней очистки:', error);
        await bot.sendMessage(chatId, '❌ Ошибка при обновлении периода.');
    }
});

// Обработчик команды проверки статуса очистки
bot.onText(/\/cleanup_status/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const info = await fileManager.getCleanupInfo();
        if (info) {
            await bot.sendMessage(chatId, `📊 Статус очистки:\n🔄 Период: ${info.cleanupDays} дней\n⏳ До очистки: ${info.daysRemaining} дней`);
        } else {
            await bot.sendMessage(chatId, '❌ Не удалось получить информацию.');
        }
    } catch (error) {
        console.error('Ошибка статуса очистки:', error);
        await bot.sendMessage(chatId, '❌ Ошибка при получении статуса.');
    }
});

async function authorizeTelegramUser(chatId, msg) {
    return new Promise(async (resolve) => {
        await bot.sendMessage(chatId, 'Введите ваш логин:');
        bot.once('message', async (loginMsg) => {
            const username = loginMsg.text;
            if (!username) {
                await bot.sendMessage(chatId, 'Логин не введен.');
                await bot.deleteMessage(chatId, loginMsg.message_id);
                resolve(null);
                return;
            }
            await bot.sendMessage(chatId, 'Введите пароль:');
            bot.once('message', async (passwordMsg) => {
                const password = passwordMsg.text;
                if (!password) {
                    await bot.sendMessage(chatId, 'Пароль не введен.');
                    await bot.deleteMessage(chatId, passwordMsg.message_id);
                    resolve(null);
                    return;
                }
                let connection;
                try {
                    connection = await dbPool.getConnection();
                    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
                    if (users.length === 0 || !await bcrypt.compare(password, users[0].password_hash)) {
                        await bot.sendMessage(chatId, 'Неверный логин или пароль.');
                        await bot.deleteMessage(chatId, passwordMsg.message_id);
                        resolve(null);
                        return;
                    }
                    const user = users[0];
                    if (!user.telegram_id) {
                        await bot.sendMessage(chatId, 'Привязать аккаунт к Telegram?', {
                            reply_markup: { keyboard: [['Привязать'], ['Отмена']], one_time_keyboard: true }
                        });
                        bot.once('message', async (linkMsg) => {
                            await bot.deleteMessage(chatId, passwordMsg.message_id);
                            if (linkMsg.text === 'Привязать') {
                                await connection.query('UPDATE users SET telegram_id = ? WHERE id = ?', [msg.from.id, user.id]);
                                await bot.sendMessage(chatId, 'Аккаунт привязан!');
                                console.log(`[AUTH] User ${user.username} (ID: ${user.id}) linked Telegram ID: ${msg.from.id}`);
                                resolve(user);
                            } else {
                                await bot.sendMessage(chatId, 'Авторизация отменена.');
                                resolve(null);
                            }
                        });
                    } else if (user.telegram_id !== msg.from.id) {
                        await bot.sendMessage(chatId, 'Этот Telegram уже привязан к другому пользователю.');
                        await bot.deleteMessage(chatId, passwordMsg.message_id);
                        resolve(null);
                    } else {
                        await bot.sendMessage(chatId, 'Авторизация успешна!');
                        await bot.deleteMessage(chatId, passwordMsg.message_id);
                        resolve(user);
                    }
                } catch (error) {
                    console.error('Ошибка авторизации:', error);
                    await bot.sendMessage(chatId, 'Ошибка при авторизации.');
                    resolve(null);
                } finally {
                    if (connection) connection.release();
                    await bot.deleteMessage(chatId, loginMsg.message_id);
                }
            });
        });
    });
}


// Вспомогательная функция для проверки авторизации пользователя
async function getAuthorizedUser(chatId, telegramId, requireAuth = true) {
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [users] = await connection.query('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
        if (users.length > 0) return users[0];
        if (!requireAuth) return null;

        const user = await authorizeTelegramUser(chatId, { from: { id: telegramId } });
        return user || null;
    } catch (error) {
        console.error('Ошибка проверки Telegram ID:', error);
        await bot.sendMessage(chatId, 'Ошибка при проверке авторизации.');
        return null;
    } finally {
        if (connection) connection.release();
    }
}

// Вспомогательная функция для отправки inline-меню
async function sendInlineMenu(chatId, message, buttons) {
    const inlineKeyboard = buttons.map(btn => [{ text: btn.text, callback_data: btn.callback_data }]);
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: inlineKeyboard }
    });
}

// Обработчик команды /check_telegram
bot.onText(/\/check_telegram/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id, false);
    if (user) {
        await bot.sendMessage(chatId, `Ваш Telegram привязан к пользователю: ${user.username}`);
        console.log(`[CHECK_TELEGRAM] Telegram ID ${msg.from.id} linked to ${user.username} (ID: ${user.id}).`);
    } else {
        await bot.sendMessage(chatId, 'Ваш Telegram не привязан.');
        console.log(`[CHECK_TELEGRAM] Telegram ID ${msg.from.id} not linked.`);
    }
});

// --- Обработчик команды /unlink_telegram ---
bot.onText(/\/unlink_telegram/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id, false);
    if (!user) {
        await bot.sendMessage(chatId, 'Ваш Telegram не привязан.');
        return;
    }

    await bot.sendMessage(chatId, `Отвязать Telegram от ${user.username}?`, {
        reply_markup: { keyboard: [['Да, отвязать'], ['Отмена']], one_time_keyboard: true }
    });
    bot.once('message', async (confirmMsg) => {
        if (confirmMsg.text === 'Да, отвязать') {
            let connection;
            try {
                connection = await dbPool.getConnection();
                await connection.query('UPDATE users SET telegram_id = NULL WHERE telegram_id = ?', [msg.from.id]);
                await bot.sendMessage(chatId, 'Telegram отвязан.');
                console.log(`[UNLINK_TELEGRAM] Telegram ID ${msg.from.id} unlinked from ${user.username} (ID: ${user.id}).`);
            } catch (error) {
                console.error('Ошибка отвязки:', error);
                await bot.sendMessage(chatId, 'Ошибка при отвязке.');
            } finally {
                if (connection) connection.release();
            }
        } else {
            await bot.sendMessage(chatId, 'Отвязка отменена.');
        }
    });
});


// --- **Обработчик команды /add_publication** ---
bot.onText(/\/add_publication/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) return;

    console.log(`[ADD] User ${user.username} (ID: ${user.id}) started adding a publication.`);

    async function askForInput(question, options = {}) {
        return new Promise((resolve) => {
            bot.sendMessage(chatId, question, options);
            bot.once('message', (msg) => resolve(msg));
        });
    }

    const titleMsg = await askForInput('Введите заголовок публикации:');
    const title = titleMsg.text;
    if (!title) {
        await bot.sendMessage(chatId, 'Заголовок не может быть пустым.');
        return;
    }

    const contentMsg = await askForInput('Введите содержание публикации:');
    const content = contentMsg.text;
    if (!content) {
        await bot.sendMessage(chatId, 'Содержание не может быть пустым.');
        return;
    }

    let mediaUrl = await askForMedia(chatId, bot); // Используем глобальную функцию
    if (mediaUrl === undefined) return;

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO publications (title, content, image_url, author_id) VALUES (?, ?, ?, ?)',
            [title, content, mediaUrl, user.id]
        );
        await bot.sendMessage(chatId, `Публикация добавлена! ID: ${result.insertId}`);
        console.log(`[ADD] Publication added: ID ${result.insertId} by ${user.username} (ID: ${user.id})`);
    } catch (error) {
        console.error('Ошибка добавления публикации:', error);
        await bot.sendMessage(chatId, 'Ошибка при добавлении публикации.');
    } finally {
        if (connection) connection.release();
    }
});


 // --- **Обработчик команды /update_publication** ---
 bot.onText(/\/update_publication/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) return;

    await bot.sendMessage(chatId, 'Укажите ID, дату (ГГГГ-ММ-ДД) или заголовок публикации:');
    bot.once('message', async (msg) => {
        const identifier = msg.text;
        let connection;
        try {
            connection = await dbPool.getConnection();
            let query, params;
            if (/^\d+$/.test(identifier)) {
                query = 'SELECT * FROM publications WHERE id = ?';
                params = [parseInt(identifier)];
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(identifier)) {
                query = 'SELECT * FROM publications WHERE DATE(created_at) = ?';
                params = [identifier];
            } else {
                query = 'SELECT * FROM publications WHERE title LIKE ?';
                params = [`%${identifier}%`];
            }

            const [publications] = await connection.query(query, params);
            if (publications.length === 0) {
                await bot.sendMessage(chatId, 'Публикация не найдена.');
                return;
            }
            if (publications.length > 1) {
                await bot.sendMessage(chatId, 'Найдено несколько публикаций. Уточните ID.');
                return;
            }

            const publication = publications[0];
            const buttons = [
                { text: 'Заголовок', callback_data: `update_field:${publication.id}:title` },
                { text: 'Содержание', callback_data: `update_field:${publication.id}:content` },
                { text: 'URL изображения', callback_data: `update_field:${publication.id}:image_url` },
                { text: 'Отмена', callback_data: 'cancel_update' }
            ];
            await sendInlineMenu(chatId, `Текущие данные:\nЗаголовок: ${publication.title}\nСодержание: ${publication.content}\nURL: ${publication.image_url}\n\nЧто изменить?`, buttons);
        } catch (error) {
            console.error('Ошибка выбора публикации:', error);
            await bot.sendMessage(chatId, 'Ошибка при выборе публикации.');
        } finally {
            if (connection) connection.release();
        }
    });
});


 // --- **Обработчик команды /delete_publication** ---
bot.onText(/\/delete_publication/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id);
    if (!user) return;

    await bot.sendMessage(chatId, 'Укажите ID, дату (ГГГГ-ММ-ДД) или заголовок публикации:');
    bot.once('message', async (msg) => {
        const identifier = msg.text;
        let connection;
        try {
            connection = await dbPool.getConnection();
            let query, params;
            if (/^\d+$/.test(identifier)) {
                query = 'SELECT * FROM publications WHERE id = ?';
                params = [parseInt(identifier)];
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(identifier)) {
                query = 'SELECT * FROM publications WHERE DATE(created_at) = ?';
                params = [identifier];
            } else {
                query = 'SELECT * FROM publications WHERE title LIKE ?';
                params = [`%${identifier}%`];
            }

            const [publications] = await connection.query(query, params);
            if (publications.length === 0) {
                await bot.sendMessage(chatId, 'Публикация не найдена.');
                return;
            }
            if (publications.length > 1) {
                await bot.sendMessage(chatId, 'Найдено несколько публикаций. Уточните ID.');
                return;
            }

            const publication = publications[0];
            const buttons = [
                { text: 'Да', callback_data: `delete_confirm:${publication.id}` },
                { text: 'Нет', callback_data: 'cancel_delete' }
            ];
            await sendInlineMenu(chatId, `Удалить "${publication.title}"?`, buttons);
        } catch (error) {
            console.error('Ошибка выбора публикации:', error);
            await bot.sendMessage(chatId, 'Ошибка при выборе публикации.');
        } finally {
            if (connection) connection.release();
        }
    });
});


// --- **Обработчик команды /start** ---
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAuthorizedUser(chatId, msg.from.id, false);

    const buttons = [
        { text: '📝 Публикации', callback_data: 'publications' },
        { text: '🔍 Статус сервера', callback_data: 'server_status' },
        { text: '🔒 Привязка Telegram', callback_data: 'link_telegram' },
        { text: '🔑 Генерация секретного кода', callback_data: 'generate_secret_code' }
    ];

    if (user) {
        buttons.push(
            { text: '🎉 Акция на сайте', callback_data: 'site_sale' },
            { text: '🗑 Статус очистки файлов', callback_data: 'cleanup_status' },
            { text: '⏰ Установить период очистки', callback_data: 'set_cleanup_days' }
        );
    }

    await sendInlineMenu(chatId, 'Привет! Это бот веб-сайта. Выберите категорию:', buttons);
});

// --- **Обработчик callback-запросов** ---
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const user = await getAuthorizedUser(chatId, telegramId, false);

    const requiresAuth = [
        'add_publication', 'update_publication', 'delete_publication', 
        'server_status', 'generate_secret_code', 'site_sale', 
        'cleanup_status', 'set_cleanup_days', 'set_sale', 'cancel_sale'
    ];

    if (requiresAuth.includes(data) && !user) {
        await bot.sendMessage(chatId, 'Эта функция доступна только после привязки Telegram.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
    }

    switch (data) {
        case 'publications':
            await sendInlineMenu(chatId, 'Выберите действие с публикациями:', [
                { text: 'Добавить публикацию', callback_data: 'add_publication' },
                { text: 'Обновить публикацию', callback_data: 'update_publication' },
                { text: 'Удалить публикацию', callback_data: 'delete_publication' }
            ]);
            break;

        case 'server_status':
            try {
                if (!dbPool) {
                    await bot.sendMessage(chatId, '⚠️ Соединение с сервером базы данных не установлено.');
                } else {
                    await dbPool.query('SELECT 1');
                    await bot.sendMessage(chatId, '✅ Сервер базы данных - Онлайн.');
                }
            } catch (error) {
                console.error('Database status check failed:', error);
                let errorMessage = '❌ Сервер базы данных - Оффлайн.\nПричина: ';
                switch (error.code) {
                    case 'ECONNREFUSED': errorMessage += 'Соединение отклонено.'; break;
                    case 'ENOTFOUND': errorMessage += 'Хост не найден.'; break;
                    case 'ER_ACCESS_DENIED_ERROR': errorMessage += 'Доступ запрещен.'; break;
                    default: errorMessage += error.message;
                }
                await bot.sendMessage(chatId, errorMessage);
            }
            break;

        case 'link_telegram':
            if (user) {
                await sendInlineMenu(chatId, 'Ваш Telegram привязан. Отвязать?', [
                    { text: 'Отвязать Telegram', callback_data: 'unlink_telegram' }
                ]);
            } else {
                await bot.sendMessage(chatId, 'Привяжите Telegram через /check_telegram.');
            }
            break;

        case 'generate_secret_code':
            const newSecretCode = generateSecretCode();
            let connectionGenerate;
            try {
                connectionGenerate = await dbPool.getConnection();
                await connectionGenerate.query('UPDATE users SET secret_code = ? WHERE id = ?', [newSecretCode, user.id]);
                await bot.sendMessage(chatId, `Ваш новый секретный код: **${newSecretCode}**. Сохраните его!`);
                console.log(`[GENERATE_SECRET_CODE] New code "${newSecretCode}" for user ${user.username} (ID: ${user.id}).`);
            } catch (error) {
                console.error('Ошибка генерации кода:', error);
                await bot.sendMessage(chatId, 'Ошибка при генерации кода.');
            } finally {
                if (connectionGenerate) connectionGenerate.release();
            }
            break;

        case 'site_sale':
            await sendInlineMenu(chatId, 'Выберите действие с акцией:', [
                { text: 'Установить акцию', callback_data: 'set_sale' },
                { text: 'Отменить акцию', callback_data: 'cancel_sale' }
            ]);
            break;

        case 'cleanup_status':
            try {
                const info = await fileManager.getCleanupInfo();
                if (info) {
                    await bot.sendMessage(chatId, `📊 Статус очистки:\n🔄 Период: ${info.cleanupDays} дней\n⏳ До очистки: ${info.daysRemaining} дней`);
                } else {
                    await bot.sendMessage(chatId, '❌ Не удалось получить информацию.');
                }
            } catch (error) {
                console.error('Ошибка статуса очистки:', error);
                await bot.sendMessage(chatId, '❌ Ошибка при получении статуса.');
            }
            break;

        case 'set_cleanup_days':
            await bot.sendMessage(chatId, 'Введите количество дней для периода очистки (1-30):');
            bot.once('message', async (msg) => {
                const days = parseInt(msg.text);
                if (days < 1 || days > 30) {
                    await bot.sendMessage(chatId, '⚠️ Количество дней должно быть от 1 до 30.');
                    return;
                }
                try {
                    const success = await fileManager.updateCleanupDays(days);
                    await bot.sendMessage(chatId, success ? `✅ Период очистки: ${days} дней.` : '❌ Не удалось обновить период.');
                } catch (error) {
                    console.error('Ошибка установки дней очистки:', error);
                    await bot.sendMessage(chatId, '❌ Ошибка при обновлении периода.');
                }
            });
            break;

            case 'add_publication':
                console.log(`[ADD] User ${user.username} (ID: ${user.id}) started adding a publication.`);
            
                async function askForInput(question, options = {}) {
                    return new Promise((resolve) => {
                        bot.sendMessage(chatId, question, options);
                        bot.once('message', (msg) => resolve(msg));
                    });
                }
            
                const titleMsg = await askForInput('Введите заголовок публикации:');
                const title = titleMsg.text;
                if (!title) {
                    await bot.sendMessage(chatId, 'Заголовок не может быть пустым.');
                    break;
                }
            
                const contentMsg = await askForInput('Введите содержание публикации:');
                const content = contentMsg.text;
                if (!content) {
                    await bot.sendMessage(chatId, 'Содержание не может быть пустым.');
                    break;
                }
            
                let mediaUrl = await askForMedia(chatId, bot); // Используем глобальную функцию
                if (mediaUrl === undefined) break;
            
                let connectionAdd;
                try {
                    connectionAdd = await dbPool.getConnection();
                    const [result] = await connectionAdd.query(
                        'INSERT INTO publications (title, content, image_url, author_id) VALUES (?, ?, ?, ?)',
                        [title, content, mediaUrl, user.id]
                    );
                    await bot.sendMessage(chatId, `Публикация добавлена! ID: ${result.insertId}`);
                    console.log(`[ADD] Publication added: ID ${result.insertId} by ${user.username} (ID: ${user.id})`);
                } catch (error) {
                    console.error('Ошибка добавления публикации:', error);
                    await bot.sendMessage(chatId, 'Ошибка при добавлении публикации.');
                } finally {
                    if (connectionAdd) connectionAdd.release();
                }
                break;

                case 'update_publication':
                    await bot.sendMessage(chatId, 'Укажите ID, дату (ГГГГ-ММ-ДД) или заголовок публикации:');
                    bot.once('message', async (msg) => {
                        const identifier = msg.text;
                        let connectionUpdate;
                        try {
                            connectionUpdate = await dbPool.getConnection();
                            let query, params;
                            if (/^\d+$/.test(identifier)) {
                                query = 'SELECT * FROM publications WHERE id = ?';
                                params = [parseInt(identifier)];
                            } else if (/^\d{4}-\d{2}-\d{2}$/.test(identifier)) {
                                query = 'SELECT * FROM publications WHERE DATE(created_at) = ?';
                                params = [identifier];
                            } else {
                                query = 'SELECT * FROM publications WHERE title LIKE ?';
                                params = [`%${identifier}%`];
                            }
                
                            const [publications] = await connectionUpdate.query(query, params);
                            if (publications.length === 0) {
                                await bot.sendMessage(chatId, 'Публикация не найдена.');
                                return;
                            }
                            if (publications.length > 1) {
                                await bot.sendMessage(chatId, 'Найдено несколько публикаций. Уточните ID.');
                                return;
                            }
                
                            const publication = publications[0];
                            const buttons = [
                                { text: 'Заголовок', callback_data: `update_field:${publication.id}:title` },
                                { text: 'Содержание', callback_data: `update_field:${publication.id}:content` },
                                { text: 'Медиа', callback_data: `update_field:${publication.id}:image_url` },
                                { text: 'Отмена', callback_data: 'cancel_update' }
                            ];
                            await sendInlineMenu(chatId, `Текущие данные:\nЗаголовок: ${publication.title}\nСодержание: ${publication.content}\nURL: ${publication.image_url}\n\nЧто изменить?`, buttons);
                        } catch (error) {
                            console.error('Ошибка выбора публикации:', error);
                            await bot.sendMessage(chatId, 'Ошибка при выборе публикации.');
                        } finally {
                            if (connectionUpdate) connectionUpdate.release();
                        }
                    });
                    break;

        case 'delete_publication':
            await bot.sendMessage(chatId, 'Укажите ID, дату (ГГГГ-ММ-ДД) или заголовок публикации:');
            bot.once('message', async (msg) => {
                const identifier = msg.text;
                let connectionDelete;
                try {
                    connectionDelete = await dbPool.getConnection();
                    let query, params;
                    if (/^\d+$/.test(identifier)) {
                        query = 'SELECT * FROM publications WHERE id = ?';
                        params = [parseInt(identifier)];
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(identifier)) {
                        query = 'SELECT * FROM publications WHERE DATE(created_at) = ?';
                        params = [identifier];
                    } else {
                        query = 'SELECT * FROM publications WHERE title LIKE ?';
                        params = [`%${identifier}%`];
                    }

                    const [publications] = await connectionDelete.query(query, params);
                    if (publications.length === 0) {
                        await bot.sendMessage(chatId, 'Публикация не найдена.');
                        return;
                    }
                    if (publications.length > 1) {
                        await bot.sendMessage(chatId, 'Найдено несколько публикаций. Уточните ID.');
                        return;
                    }

                    const publication = publications[0];
                    const buttons = [
                        { text: 'Да', callback_data: `delete_confirm:${publication.id}` },
                        { text: 'Нет', callback_data: 'cancel_delete' }
                    ];
                    await sendInlineMenu(chatId, `Удалить "${publication.title}"?`, buttons);
                } catch (error) {
                    console.error('Ошибка выбора публикации:', error);
                    await bot.sendMessage(chatId, 'Ошибка при выборе публикации.');
                } finally {
                    if (connectionDelete) connectionDelete.release();
                }
            });
            break;

        case 'unlink_telegram':
            await bot.sendMessage(chatId, `Отвязать Telegram от ${user.username}?`, {
                reply_markup: { keyboard: [['Да, отвязать'], ['Отмена']], one_time_keyboard: true }
            });
            bot.once('message', async (confirmMsg) => {
                if (confirmMsg.text === 'Да, отвязать') {
                    let connectionUnlink;
                    try {
                        connectionUnlink = await dbPool.getConnection();
                        await connectionUnlink.query('UPDATE users SET telegram_id = NULL WHERE telegram_id = ?', [telegramId]);
                        await bot.sendMessage(chatId, 'Telegram отвязан.');
                        console.log(`[UNLINK_TELEGRAM] Telegram ID ${telegramId} unlinked from ${user.username} (ID: ${user.id}).`);
                    } catch (error) {
                        console.error('Ошибка отвязки:', error);
                        await bot.sendMessage(chatId, 'Ошибка при отвязке.');
                    } finally {
                        if (connectionUnlink) connectionUnlink.release();
                    }
                } else {
                    await bot.sendMessage(chatId, 'Отвязка отменена.');
                }
            });
            break;

        case 'set_sale':
            let connectionSetSale;
            try {
                connectionSetSale = await dbPool.getConnection();
                const [activeSales] = await connectionSetSale.query(
                    'SELECT * FROM sales WHERE user_id = ? AND end_date > NOW()',
                    [user.id]
                );
                if (activeSales.length > 0) {
                    const sale = activeSales[0];
                    await bot.sendMessage(chatId, `У вас уже есть акция (ID: ${sale.id})!\nНачало: ${new Date(sale.start_date).toLocaleString()}\nОкончание: ${new Date(sale.end_date).toLocaleString()}\nОтмените её через "Отменить акцию".`);
                    break;
                }
            } catch (error) {
                console.error('Ошибка проверки акций:', error);
                await bot.sendMessage(chatId, 'Ошибка при проверке акций.');
                if (connectionSetSale) connectionSetSale.release();
                break;
            } finally {
                if (connectionSetSale) connectionSetSale.release();
            }

            await bot.sendMessage(chatId, 'Введите дату и время начала акции (ГГГГ-ММ-ДД ЧЧ:ММ):');
            bot.once('message', async (startMsg) => {
                const startDate = new Date(startMsg.text);
                if (isNaN(startDate.getTime())) {
                    await bot.sendMessage(chatId, 'Неверный формат даты начала.');
                    return;
                }

                await bot.sendMessage(chatId, 'Введите дату и время окончания акции (ГГГГ-ММ-ДД ЧЧ:ММ):');
                bot.once('message', async (endMsg) => {
                    const endDate = new Date(endMsg.text);
                    if (isNaN(endDate.getTime())) {
                        await bot.sendMessage(chatId, 'Неверный формат даты окончания.');
                        return;
                    }
                    if (endDate <= startDate) {
                        await bot.sendMessage(chatId, 'Дата окончания должна быть позже начала.');
                        return;
                    }

                    let connectionSale;
                    try {
                        connectionSale = await dbPool.getConnection();
                        const [result] = await connectionSale.query(
                            'INSERT INTO sales (start_date, end_date, user_id, telegram_id) VALUES (?, ?, ?, ?)',
                            [startDate, endDate, user.id, telegramId]
                        );
                        const saleId = result.insertId;
                        await bot.sendMessage(chatId, `Акция установлена! ID: ${saleId}\nНачало: ${startDate.toLocaleString()}\nОкончание: ${endDate.toLocaleString()}`);
                        console.log(`[SET_SALE] User ${user.username} (ID: ${user.id}) set sale: ${startDate} - ${endDate}`);

                        const timeToEnd = endDate - new Date();
                        if (timeToEnd > 0) {
                            setTimeout(async () => {
                                let conn;
                                try {
                                    conn = await dbPool.getConnection();
                                    const [sale] = await conn.query('SELECT * FROM sales WHERE id = ?', [saleId]);
                                    if (sale.length > 0 && new Date(sale[0].end_date) <= new Date()) {
                                        await bot.sendMessage(sale[0].telegram_id, `🔔 Акция (ID: ${sale[0].id}) завершилась!`);
                                        await conn.query('DELETE FROM sales WHERE id = ?', [sale[0].id]);
                                        console.log(`[SALE_EXPIRED] Sale ID: ${sale[0].id} expired and deleted.`);
                                    }
                                } catch (error) {
                                    console.error(`[SALE_EXPIRED] Error processing sale ID: ${saleId}`, error);
                                } finally {
                                    if (conn) conn.release();
                                }
                            }, timeToEnd);
                        }
                    } catch (error) {
                        console.error('Ошибка сохранения акции:', error);
                        await bot.sendMessage(chatId, 'Ошибка при установке акции.');
                    } finally {
                        if (connectionSale) connectionSale.release();
                    }
                });
            });
            break;

        case 'cancel_sale':
            let connectionCancelSale;
            try {
                connectionCancelSale = await dbPool.getConnection();
                const [activeSales] = await connectionCancelSale.query(
                    'SELECT * FROM sales WHERE user_id = ? AND end_date > NOW()',
                    [user.id]
                );
                if (activeSales.length === 0) {
                    await bot.sendMessage(chatId, 'У вас нет активных акций.');
                    break;
                }

                const sale = activeSales[0];
                await bot.sendMessage(chatId, `Отменить акцию (ID: ${sale.id})?\nНачало: ${new Date(sale.start_date).toLocaleString()}\nОкончание: ${new Date(sale.end_date).toLocaleString()}`, {
                    reply_markup: { keyboard: [['Да'], ['Нет']], one_time_keyboard: true }
                });

                bot.once('message', async (confirmMsg) => {
                    if (confirmMsg.text.toLowerCase() === 'да') {
                        await connectionCancelSale.query('DELETE FROM sales WHERE id = ?', [sale.id]);
                        await bot.sendMessage(chatId, `Акция (ID: ${sale.id}) отменена.`);
                        console.log(`[CANCEL_SALE] User ${user.username} (ID: ${user.id}) cancelled sale ID: ${sale.id}`);
                    } else {
                        await bot.sendMessage(chatId, 'Отмена акции отклонена.');
                    }
                });
            } catch (error) {
                console.error('Ошибка проверки акций:', error);
                await bot.sendMessage(chatId, 'Ошибка при проверке акций.');
            } finally {
                if (connectionCancelSale) connectionCancelSale.release();
            }
            break;

        case 'cancel_update':
        case 'cancel_delete':
            await bot.sendMessage(chatId, 'Операция отменена.');
            break;

            default:
                if (data.startsWith('update_field:')) {
                    const [_, id, field] = data.split(':');
                    await bot.sendMessage(chatId, field === 'image_url' 
                        ? 'Введите новый URL изображения или отправьте файл:' 
                        : `Введите новое значение для "${field}":`);
                    bot.once('message', async (msg) => {
                        let newValue = msg.text;
                        let connectionUpdateField;
            
                        // Если обновляется image_url и отправлен файл
                        if (field === 'image_url' && (msg.photo || msg.video || msg.document)) {
                            let fileId, fileSize;
                            if (msg.photo) {
                                fileId = msg.photo[msg.photo.length - 1].file_id;
                                fileSize = msg.photo[msg.photo.length - 1].file_size;
                            } else if (msg.video) {
                                fileId = msg.video.file_id;
                                fileSize = msg.video.file_size;
                            } else if (msg.document && msg.document.mime_type.startsWith('image/gif')) {
                                fileId = msg.document.file_id;
                                fileSize = msg.document.file_size;
                            }
            
                            if (fileSize > 100 * 1024 * 1024) {
                                await bot.sendMessage(chatId, 'Файл превышает 100 МБ.');
                                return;
                            }
            
                            try {
                                const fileLink = await bot.getFileLink(fileId);
                                const fileName = Date.now() + path.extname(fileLink);
                                const mediaUrl = `http://localhost:5000/uploads/${fileName}`;
                                const response = await fetch(fileLink);
                                if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
                                const buffer = await response.arrayBuffer();
                                await fs.writeFile(path.join(__dirname, 'uploads', fileName), Buffer.from(buffer));
                                newValue = mediaUrl;
                                console.log(`[UPDATE] Media saved: ${newValue}`);
                            } catch (error) {
                                console.error('Ошибка загрузки медиа:', error);
                                await bot.sendMessage(chatId, 'Ошибка загрузки медиа.');
                                return;
                            }
                        }
            
                        try {
                            connectionUpdateField = await dbPool.getConnection();
                            await connectionUpdateField.query(`UPDATE publications SET ${field} = ? WHERE id = ?`, [newValue, id]);
                            await bot.sendMessage(chatId, 'Публикация обновлена!');
                            console.log(`[UPDATE] Publication ID ${id} updated field ${field} by ${user.username}.`);
                        } catch (error) {
                            console.error('Ошибка обновления:', error);
                            await bot.sendMessage(chatId, 'Ошибка при обновлении.');
                        } finally {
                            if (connectionUpdateField) connectionUpdateField.release();
                        }
                    });
                } else if (data.startsWith('delete_confirm:')) {
                    const id = data.split(':')[1];
                    let connectionDeleteConfirm;
                    try {
                        connectionDeleteConfirm = await dbPool.getConnection();
                        await connectionDeleteConfirm.query('DELETE FROM publications WHERE id = ?', [id]);
                        await bot.sendMessage(chatId, 'Публикация удалена.');
                        console.log(`[DELETE] Publication ID ${id} deleted by ${user.username}.`);
                    } catch (error) {
                        console.error('Ошибка удаления:', error);
                        await bot.sendMessage(chatId, 'Ошибка при удалении.');
                    } finally {
                        if (connectionDeleteConfirm) connectionDeleteConfirm.release();
                    }
                } else {
                    await bot.sendMessage(chatId, 'Неизвестная команда.');
                }
                break;
    }

    bot.answerCallbackQuery(callbackQuery.id);
});


// --- **Логирование при запуске сервера** ---
async function logCookieStatusOnStart() {
    console.log("КУКИ: Статус кэширования при запуске сервера");
    try {
        const connection = await dbPool.getConnection();
        const [publications] = await connection.query('SELECT image_url FROM publications WHERE image_url IS NOT NULL');
        connection.release();

        for (const { image_url } of publications) {
            if (!image_url.startsWith(`http://localhost:5000/uploads/`)) {
                console.log(`КУКИ: Пропущено - не локальный файл: ${image_url}`);
                continue;
            }
            const fileName = path.basename(image_url);
            const filePath = path.join(__dirname, 'uploads', fileName);
            try {
                await fs.access(filePath, fs.constants.F_OK);
                let fileData = await fs.readFile(filePath);
                const isImage = /\.(jpe?g|png|gif)$/i.test(fileName);
                if (isImage) {
                    const initialSize = fileData.length;
                    if (initialSize > 3000) {
                        fileData = await compressImage(filePath);
                        if (!fileData || fileData.length > 3000) {
                            console.log(`КУКИ: Не удалось сжать до 3KB: ${image_url} (размер: ${fileData ? fileData.length : initialSize} байт)`);
                            continue;
                        }
                        console.log(`КУКИ: Сжато ${image_url} с ${initialSize} до ${fileData.length} байт`);
                    }
                    const base64Data = fileData.toString('base64');
                    console.log(base64Data.length > 4096 
                        ? `КУКИ: Пропущено - base64 > 4KB: ${image_url} (${base64Data.length} байт)` 
                        : `КУКИ: Готово к сохранению: ${image_url} (${base64Data.length} байт)`);
                } else {
                    console.log(`КУКИ: Пропущено - не изображение: ${image_url}`);
                }
            } catch (error) {
                console.log(`КУКИ: Файл недоступен: ${image_url}`);
            }
        }
    } catch (error) {
        console.error('КУКИ: Ошибка проверки:', error);
    }
}

// --- **Запуск сервера** ---
async function startServer() {
    try {
        await initializeDbPool();
        if (!fileManager) {
            fileManager = new PublicationFileManager(dbPool, __dirname);
            await fileManager.initialize();
        }
        await fileManager.cleanupFiles();
        fileManager.scheduleCleanup();
        await logCookieStatusOnStart();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
}

startServer();
