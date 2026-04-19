const fs = require('fs/promises');
const path = require('path');
const schedule = require('node-schedule');

class PublicationFileManager {
    constructor(dbPool, baseDir) {
        this.dbPool = dbPool;
        this.baseDir = baseDir;
        this.publicationsDir = path.join(baseDir, 'publications');
        this.mediaDir = path.join(baseDir, 'uploads');
    }

    async initialize() {
        try {
            await fs.mkdir(this.publicationsDir, { recursive: true });
            await fs.mkdir(this.mediaDir, { recursive: true });
            await fs.access(this.publicationsDir, fs.constants.W_OK);
            await fs.access(this.mediaDir, fs.constants.W_OK);
            console.log('📁 Директории успешно инициализированы');

            // Инициализация настроек очистки
            await this.initializeCleanupSettings();
        } catch (error) {
            console.error('❌ Ошибка при инициализации:', error);
            throw error;
        }
    }


    async initializeCleanupSettings() {
        let connection;
        try {
            connection = await this.dbPool.getConnection();
            
            // Проверяем существование записи
            const [settings] = await connection.query('SELECT * FROM cleanup_settings LIMIT 1');
            
            if (settings.length === 0) {
                // Создаем начальную запись
                const now = new Date();
                const nextCleanup = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
                await connection.query(
                    'INSERT INTO cleanup_settings (cleanup_days, last_cleanup_date, next_cleanup_date) VALUES (?, ?, ?)',
                    [7, now, nextCleanup]
                );
            }
        } catch (error) {
            console.error('Ошибка при инициализации настроек очистки:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async updateCleanupDays(days) {
        let connection;
        try {
            connection = await this.dbPool.getConnection();
            const now = new Date();
            const nextCleanup = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
            
            await connection.query(
                'UPDATE cleanup_settings SET cleanup_days = ?, next_cleanup_date = ?',
                [days, nextCleanup]
            );

            // Перепланируем задачу очистки
            this.rescheduleCleanup();
            
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении дней очистки:', error);
            return false;
        } finally {
            if (connection) connection.release();
        }
    }

    async getCleanupInfo() {
        let connection;
        try {
            connection = await this.dbPool.getConnection();
            const [settings] = await connection.query('SELECT * FROM cleanup_settings LIMIT 1');
            
            if (settings.length > 0) {
                const setting = settings[0];
                const now = new Date();
                const nextCleanup = new Date(setting.next_cleanup_date);
                const daysRemaining = Math.ceil((nextCleanup - now) / (1000 * 60 * 60 * 24));
                
                return {
                    cleanupDays: setting.cleanup_days,
                    daysRemaining: Math.max(0, daysRemaining)
                };
            }
            return null;
        } catch (error) {
            console.error('Ошибка при получении информации об очистке:', error);
            return null;
        } finally {
            if (connection) connection.release();
        }
    }

    async cleanupFiles() {
        console.log('\n🔄 Запуск процесса очистки файлов...');
        console.log('⏳ Проверка базы данных на наличие актуальных публикаций...');

        if (!this.dbPool) {
            console.error("❌ Ошибка: dbPool не инициализирован!"); // Оставляем это сообщение об ошибке
            return;
        }

        let connection;
        try {
            connection = await this.dbPool.getConnection();
            const [publications] = await connection.query('SELECT id FROM publications');
            const validIds = new Set(publications.map(p => p.id.toString()));

            console.log(`📊 Найдено ${validIds.size} действующих публикаций в базе данных`); // Оставляем

            // Статистика очистки
            const stats = {
                htmlFound: 0,
                htmlRemoved: 0,
                mediaFound: 0,
                mediaRemoved: 0
            };

            // Очистка HTML файлов
            await this.cleanupHtmlFiles(validIds, stats);

            // Очистка медиа файлов
            await this.cleanupMediaFiles(validIds, stats);

            connection = await this.dbPool.getConnection();
            
            // Обновляем даты очистки
            const now = new Date();
            const [settings] = await connection.query('SELECT cleanup_days FROM cleanup_settings LIMIT 1');
            const nextCleanup = new Date(now.getTime() + (settings[0].cleanup_days * 24 * 60 * 60 * 1000));
            
            await connection.query(
                'UPDATE cleanup_settings SET last_cleanup_date = ?, next_cleanup_date = ?',
                [now, nextCleanup]
            );

            // Вывод итоговой статистики
            console.log('\n📊 Итоги очистки:');  // Оставляем
            console.log(`HTML файлы: проверено ${stats.htmlFound}, удалено ${stats.htmlRemoved}`); // Оставляем
            console.log(`Медиа файлы: проверено ${stats.mediaFound}, удалено ${stats.mediaRemoved}`); // Оставляем
            console.log('✅ Процесс очистки завершен\n'); // Оставляем

        } catch (error) {
            console.error('❌ Ошибка во время очистки:', error); // Оставляем, но можно добавить error.stack
        } finally {
            if (connection) connection.release();
        }
    }

    async rescheduleCleanup() {
        if (this.currentJob) {
            this.currentJob.cancel();
        }

        const [settings] = await this.dbPool.query('SELECT cleanup_days FROM cleanup_settings LIMIT 1');
        const days = settings[0].cleanup_days;

        this.currentJob = schedule.scheduleJob(`0 0 */${days} * *`, () => {
            console.log('\n🔄 Запуск запланированной очистки файлов...');
            this.cleanupFiles();
        });

        console.log(`✅ Расписание очистки обновлено (каждые ${days} дней)`);
    }

    async cleanupHtmlFiles(validIds, stats) {
        console.log('\n🔍 Проверка HTML файлов...'); // Оставляем
        try {
            const files = await fs.readdir(this.publicationsDir);
            stats.htmlFound = files.length;

            let removedCount = 0;
            for (const file of files) {
                // console.log("Checking file:", file); // Убираем
                if (file.endsWith('.html')) {
                    const publicationId = path.parse(file).name;
                    // console.log("publicationId:", publicationId); // Убираем
                    if (!validIds.has(publicationId)) {
                        const filePath = path.join(this.publicationsDir, file);
                        console.log("Deleting:", filePath); //  Можно оставить (показывает удаляемые файлы) или закомментировать
                        await fs.unlink(filePath);
                        removedCount++;
                    }
                }
            }
            stats.htmlRemoved = removedCount;
            console.log(`✅ Проверка HTML файлов завершена. Удалено: ${removedCount}`); // Оставляем
        } catch (error) {
            console.error('❌ Ошибка при очистке HTML файлов:', error); // Оставляем, но можно добавить error.stack
        }
    }

    async cleanupMediaFiles(validIds, stats) {
        console.log('\n🔍 Проверка медиа файлов...'); // Оставляем
        try {
            const files = await fs.readdir(this.mediaDir);
            stats.mediaFound = files.length;

            let connection;
            try {
                connection = await this.dbPool.getConnection();
                const [mediaRecords] = await connection.query('SELECT image_url FROM publications WHERE image_url IS NOT NULL');
                const validMediaFiles = new Set(mediaRecords.map(record => {
                    const basename = path.basename(record.image_url);
                    // console.log("validMediaFiles basename", basename); // Убираем
                    return basename;
                }));

                let removedCount = 0;
                for (const file of files) {
                    if (!validMediaFiles.has(file)) {
                        const filePath = path.join(this.mediaDir, file);
                        console.log(`🗑️ Удален неиспользуемый медиа файл: ${file}`); //  Можно оставить или закомментировать.
                        await fs.unlink(filePath);
                        removedCount++;
                    }
                }
                stats.mediaRemoved = removedCount;
                console.log(`✅ Проверка медиа файлов завершена. Удалено: ${removedCount}`); // Оставляем

            } finally {
                if (connection) connection.release();
            }
        } catch (error) {
            console.error('❌ Ошибка при очистке медиа файлов:', error); // Оставляем, но можно добавить error.stack
        }
    }

    scheduleCleanup() {
        console.log('⏰ Настройка расписания очистки файлов...'); // Оставляем
        schedule.scheduleJob('0 0 */7 * *', () => {
            console.log('\n🔄 Запуск запланированной очистки файлов...'); // Оставляем
            this.cleanupFiles();
        });
        console.log('✅ Расписание очистки настроено (каждые 7 дней)'); // Оставляем
    }

    async savePublicationFiles(publication) {
        const { id, title, content, image_url } = publication;
        console.log(`📝 Сохранение файлов для публикации ID: ${id}...`);

        // Сохранение HTML файла
        const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="http://localhost:5000/PublicationDetail.css">
</head>
<body>
    <div class="publication-detail">
        <button onclick="window.history.back()" class="back-button">Назад</button>
        <h1>${title}</h1>
        ${image_url ? `<img src="${image_url}" alt="${title}">` : ''}
        <p>${content}</p>
    </div>
</body>
</html>`;

        const htmlPath = path.join(this.publicationsDir, `${id}.html`);
        await fs.writeFile(htmlPath, htmlContent, 'utf-8');
        console.log(`✅ HTML файл сохранен: ${path.basename(htmlPath)}`);

        if (image_url) {
            console.log(`📸 Изображение связано с публикацией: ${path.basename(image_url)}`);
        }

        return {
            htmlPath,
            mediaPath: image_url ? path.join(this.mediaDir, path.basename(image_url)) : null
        };
    }
}

module.exports = PublicationFileManager;