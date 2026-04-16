# Smart Stadium Navigator 🏟️

[![Angular Version](https://img.shields.io/badge/Angular-21.2.7-dd0031?style=for-the-badge&logo=angular)](https://angular.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Smart Stadium Navigator** is a cutting-edge real-time crowd management and navigation system designed for modern sporting venues. It provides users with live density maps, wait times for amenities, and smart navigation, while empowering administrators with a powerful control panel to manage stadium operations.

---

## 🚀 Live Demo

| Interface | URL |
| :--- | :--- |
| **Public User Portal** | [https://smart-stadium-ec5ba.web.app/](https://smart-stadium-ec5ba.web.app/) |
| **Admin Control Panel** | [https://smart-stadium-ec5ba.web.app/admin/login](https://smart-stadium-ec5ba.web.app/admin/login) |

---

## ✨ Key Features

-   **🛰️ Real-time Synchronization:** Instant updates across all devices via Firebase Firestore.
-   **🗺️ Dual Map Views:** Seamlessly switch between a custom Schematic view and a high-resolution Satellite Earth view.
-   **📊 Crowd Density Mapping:** Dynamic visualization of crowd levels across different stadium zones.
-   **🚶 Smart Navigation:** Intelligent routing to seats, restrooms, and food stalls based on real-time data.
-   **📢 Admin Broadcast System:** Send instant notifications and alerts to all stadium visitors.
-   **🛠️ Full Venue Management:** Add, edit, and manage stadium zones, spots, and amenities on the fly.

---

## 🛠️ Tech Stack

-   **Frontend:** [Angular 21.2.7](https://angular.dev/)
-   **Backend:** [Firebase](https://firebase.google.com/) (Firestore, Hosting)
-   **Styling:** Vanilla CSS & Tailwind CSS 4.0
-   **State Management:** RxJS BehaviorSubjects with Firebase sync
-   **Maps:** Custom SVG Renderer & Leaflet.js
-   **Testing:** Vitest & Playwright

---

## ⚙️ Getting Started

### Prerequisites

-   **Node.js:** v20.x or higher
-   **npm:** v10.x or higher
-   **Angular CLI:** 21.2.7

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/smart-stadium.git
    cd smart-stadium
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running Locally

1.  **Start the development server:**
    ```bash
    ng serve
    ```

2.  **Navigate to:** `http://localhost:4200/`

---

## 🔐 Demo Credentials

To test the **Admin Control Panel**, please use the live URL. 

> [!IMPORTANT]
> **Admin Access:** If you are interested in a deep-dive demo or need Admin login credentials for testing, please connect with me directly.

**Contact:** [pankajkiteln@gmail.com](mailto:pankajkiteln@gmail.com)

---

## 📂 Documentation

Detailed documentation for specific modules can be found in the `document/` directory:
-   [System Architecture](./document/SYSTEM_ARCHITECTURE.md)
-   [Admin Panel Guide](./document/ADMIN_PANEL.md)
-   [Real-time Sync Logic](./document/REALTIME_SYNC.md)
-   [Smart Navigation](./document/SMART_NAVIGATION.md)

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Developed with ❤️ for the future of Smart Venues.
