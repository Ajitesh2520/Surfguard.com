# 🛡️ SurfGuard

An AI-powered Chrome Extension that helps users build healthier browsing habits by intelligently classifying websites, tracking browsing time, and enforcing personalized screen-time limits.

SurfGuard combines a Chrome Extension with an Express backend to provide real-time website categorization and productivity insights while maintaining a lightweight browsing experience.

---

## ✨ Features

* 🤖 AI-powered website categorization
* ⏱️ Real-time website time tracking
* 🚫 Automatic website blocking after time limits are exceeded
* ⚡ Fast category lookups using caching
* 📊 Productivity dashboard
* 🔄 Background monitoring with Chrome Extension APIs
* 🧩 Manifest V3 compatible architecture
* 🌐 Backend API for intelligent URL classification
* 💻 Modern React-based popup interface

---


## 🚀 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Chrome Extension APIs
* Manifest V3

### Backend

* Node.js
* Express
* TypeScript
* CORS
* dotenv

### AI

* OpenAI API (URL categorization)

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/SurfGuard.git

cd SurfGuard
```

---

### Backend

```bash
cd backend

npm install

npm run dev
```

---

### Extension Client

```bash
cd extension_client

npm install

npm run build
```

---

## Loading the Extension

1. Open Chrome.

2. Visit

```
chrome://extensions
```

3. Enable **Developer Mode**.

4. Click **Load unpacked**.

5. Select the generated extension folder.

The extension will now be available inside Chrome.

---

## Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

OPENAI_API_KEY=your_openai_api_key

# Add additional configuration values as needed
```

---

## Current Workflow

1. User visits a website.
2. Background service detects the active tab.
3. Website URL is sent for categorization.
4. Backend classifies the URL using AI.
5. Result is cached.
6. Browsing time is recorded.
7. User-defined limits are checked.
8. If the limit is exceeded, the extension blocks further access.

---

## Future Improvements

* User authentication
* Cloud synchronization
* Multi-device support
* Weekly productivity reports
* Category customization
* Analytics dashboard
* Browser history insights
* Exportable productivity reports
* Notification reminders
* Offline categorization cache

---

## Development Status

This project is currently under active development.

Upcoming milestones include:

* Improved AI classification accuracy
* Better caching strategy
* Production deployment
* Chrome Web Store publication
* Performance optimization
* UI/UX enhancements

---

## Contributing

Contributions, feature requests, and bug reports are welcome.

If you have suggestions for improving SurfGuard, feel free to open an issue or submit a pull request.

---

## License

This project is intended for educational and portfolio purposes unless otherwise specified.

---

## Author

**Ajitesh Mishra**

Software Engineer | Full Stack Developer | AI Enthusiast

If you found this project useful, consider giving it a ⭐ on GitHub.
