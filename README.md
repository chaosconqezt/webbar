# WebBar (Web foobar2000)

# ВНИМАНЕ! 146% НЕЙРОСЛОП! УБЕРИТЕ ТРУЪ ПРОГРАММИСТОВ ОТ ЭКРАНА!

🌍 **[English](#english) | [Русский](#русский)**

---

<a id="english"></a>
## 🇬🇧 English

A web-based music player inspired by foobar2000, specialized in streaming local music directly via browser. It features a full folder tree navigation, metadata reading, ID3 tag support, album art extraction, and a retro minimalist desktop interface.

### Features
* **Folder Tree Navigation:** Browse your local `music/` folder exactly how it's structured on disk. Support for drag-and-drop to upload files and folders inside the browser.
* **Audio Playback:** Supports standard audio formats such as MP3, FLAC, WAV, OGG, and M4A. Includes basic Gapless/Stream configurations (via range requests).
* **Metadata Extraction:** Reads ID3 tags, FLAC tags, etc., directly from files using `music-metadata`. Shows Bitrate, Sample Rate, Codec, Title, Artist, Album, Date, and Track lengths.
* **Album Art Support:** Looks for local `cover.jpg`, `folder.jpg`, etc., in the folder, or extracts embedded cover art smoothly from the audio files.
* **Retro UI:** Foobar2000-inspired layout, built in React and Tailwind CSS.
* **Visualizer:** Quick Canvas-based spectrum visualizer synchronized with Web Audio API.

### Installation & Usage

1. Before starting, ensure that you have Node.js and NPM (Node Package Manager) installed. You can download and install it from the [Node.js Official Website](https://nodejs.org/). The installer includes both Node.js and npm.
2. Create a `music` folder in the root of the project directory (same level as `package.json` and `server.ts`).
3. Add your albums, folders, and tracks to the `music` directory.
   - Example path: `music/FLACs/Pink Floyd/The Dark Side of the Moon/01 - Speak to Me.flac`
   - You can also drop a `cover.jpg` or `folder.jpg` inside the album directory to ensure album artwork is loaded.
4. Install dependencies by opening your terminal or command prompt in the project directory and running:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to the address shown in the terminal (usually `http://localhost:3000`) to access the player.

### Commands

- `npm run dev`: Starts the local Express + Vite server with auto-refresh on port 3000.
- `npm run build`: Compiles the React SPA and backend for production.
- `npm run start`: Runs the production server and serves built files.

---

<a id="русский"></a>
## 🇷🇺 Русский

Музыкальный веб-плеер, вдохновленный foobar2000, специализированный на потоковом воспроизведении локальной музыки прямо через браузер. Включает в себя полноценную навигацию по дереву папок, чтение метаданных и ID3-тегов, извлечение обложек альбомов, а также приятный ретро-минималистичный десктопный интерфейс.

### Возможности
* **Дерево папок:** Просматривайте локальную папку `music/` в том виде, в котором она хранится на диске. Поддерживается перетаскивание (drag-and-drop) файлов и целых каталогов прямо в окно браузера для загрузки.
* **Воспроизведение аудио:** Поддерживаются стандартные аудиоформаты: MP3, FLAC, WAV, OGG и M4A. Реализовано потоковое воспроизведение с поддержкой Range-запросов (перемотка работает моментально и нативно).
* **Чтение метаданных:** Читает ID3 и FLAC теги напрямую из файлов с помощью библиотеки `music-metadata`. Показывает битрейт, частоту дискретизации, кодек, название, артиста, альбом, год и длину трека.
* **Обложки альбомов:** Плеер автоматически ищет файлы `cover.jpg`, `folder.jpg` и другие в папке альбома. Если локального файла изображения нет, обложка бесшовно извлекается прямо из аудиофайла (встроенные теги картинок).
* **Ретро UI:** Удобное расположение панелей в стиле классического foobar2000. Разработано на React + Tailwind CSS.
* **Визуализатор:** Быстрый спектральный визуализатор на базе Canvas, синхронизированный через Web Audio API.

### Установка и использование

1. Для работы приложения убедитесь, что на вашем компьютере установлен **Node.js** и менеджер пакетов **npm**. Вы можете скачать установочный файл с [Официального сайта Node.js](https://nodejs.org/). Установщик автоматически добавит в систему и `node` и `npm`.
2. Создайте папку `music` в корневой директории проекта (там же, где находятся файлы `package.json` и `server.ts`).
3. Скопируйте свои альбомы, папки и треки в директорию `music`.
   - Пример пути: `music/FLACs/Pink Floyd/The Dark Side of the Moon/01 - Speak to Me.flac`
   - Вы также можете положить в папку с альбомом файл `cover.jpg` или `folder.jpg`, чтобы обложка отображалась гарантированно и загружалась быстрее.
4. Установите необходимые для запуска пакеты и зависимости библиотеки, сперва открыв терминал (или командную строку) в папке с вашим проектом, а затем выполнив команду:
   ```bash
   npm install
   ```
5. Запустите сервер для разработки:
   ```bash
   npm run dev
   ```
6. Откройте браузер и перейдите по адресу, указанному в терминале (обычно это `http://localhost:3000`), чтобы начать слушать музыку.

### Команды

- `npm run dev`: Запускает локальный сервер Express + Vite.
- `npm run build`: Собирает проект и серверную часть для финального использования (production).
- `npm run start`: Запускает готовую, оптимизированную производственную сборку.
