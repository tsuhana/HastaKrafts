#  HastaKrafts — Nepali Handicraft Multi-Vendor Marketplace


##  About The Project

HastaKrafts is a final year project developed for **CS6P05NI** at **Islington College**, affiliated with London Metropolitan University.

Nepal has a rich heritage of handmade crafts spanning **42 distinct categories** defined by the Federation of Handicraft Associations of Nepal (FHAN), providing employment to over **1.1 million people** and contributing **Rs. 20 billion** to the national economy annually. Despite this significance, most artisans rely on middlemen who take commissions of **20–50%**, leaving them with unfair profit margins and minimal market visibility.

**HastaKrafts solves this** by providing a dedicated digital marketplace where artisans can register their own shop, upload products, participate in live auctions, communicate directly with buyers, and manage their orders — all without the interference of middlemen.

---

##  Features

###  Customer
- Register and login with email/password or **Google OAuth**
- Browse products with **search, category, and price filters**
- View detailed product pages with artisan information and reviews
- **Add to wishlist** and manage saved products
- Place bids on **live auctions** with real-time updates
- Checkout with **Khalti payment** or Cash on Delivery
- Track order delivery status
- Earn and redeem **loyalty points**
- Receive **AI-powered product recommendations** (SVD collaborative filtering)
- **Multi-lingual product descriptions** (15+ languages via Google Translate)
- Receive **web push notifications** for order updates, auction results, and messages
- Chat directly with artisans via **real-time messaging**

###  Artisan (Seller)
- Register shop with citizenship verification
- Upload products with images, descriptions, and pricing
- Create and manage **live auctions** with countdown timers
- Manage orders and update delivery status
- Chat with interested buyers in real time
- Publish **blog posts and craft stories**
- View sales analytics and revenue trends on the **Artisan Dashboard**

###  Admin
- Verify and approve artisan registrations
- Approve or reject products and auctions
- Manage all users, sellers, products, and orders
- View platform-wide **analytics and revenue reports**
- Manage **festival banners** for promotional content
- Moderate reviews and handle contact messages

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, vite-plugin-pwa |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Database | PostgreSQL, Sequelize ORM |
| AI / ML | Python, Flask, scikit-learn (SVD) |
| Payment | Khalti Payment API |
| Notifications | Webpushr, Socket.IO |
| Auth | JWT, Google OAuth 2.0, bcrypt |
| Translation | Google Translate API |
| PWA | vite-plugin-pwa, Service Workers |

---

##  Project Structure

```
HastaKrafts/
├── frontend/                  # React.js + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context (Auth, Cart, etc.)
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Helper functions
│   ├── public/
│   └── vite.config.js
│
├── backend/                   # Node.js + Express.js backend
│   ├── config/                # Database and passport config
│   ├── controllers/           # Route controllers
│   ├── models/                # Sequelize models
│   ├── routes/                # Express routes
│   ├── middleware/            # Auth and upload middleware
│   ├── utils/                 # Utility functions
│   └── index.js
│
├── recommendation-service/    # Python Flask AI microservice
│   ├── app.py                 # Flask application
│   ├── model.py               # SVD recommendation model
│   └── requirements.txt
│
└── README.md
```

---

##  Getting Started

For full setup instructions including environment variables, database setup, and running all services, please refer to the **[SETUP.md](SETUP.md)** file.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/HastaKrafts.git
cd HastaKrafts

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Set up environment variables
# See SETUP.md for full .env configuration

# Run backend
cd backend && npm run dev

# Run frontend (new terminal)
cd frontend && npm run dev
```

---

##  Screenshots

| Page | Preview |
|---|---|
| Home Page | Discover Authentic Nepali Handicrafts |
| Product Listing | Browse with filters and categories |
| Live Auction | Real-time bidding with Socket.IO |
| Artisan Dashboard | Sales analytics and order management |
| Admin Dashboard | Platform overview and management |
| Chat | Direct real-time messaging |

---

##  AI Recommendation System

HastaKrafts uses a **collaborative filtering** approach based on **Singular Value Decomposition (SVD)** implemented using Python's `scikit-learn` library. The recommendation engine is served as a separate **Flask microservice** and communicates with the Node.js backend via REST API.

- Algorithm: SVD Collaborative Filtering
- Framework: Python Flask
- Library: scikit-learn
- Endpoint: `POST /recommend`

---

##  Payment Integration

HastaKrafts integrates **Khalti**, Nepal's most widely used digital payment gateway. The integration uses Khalti's REST API in sandbox/test mode for development.

Supported payment methods:
- Khalti Digital Wallet
- Cash on Delivery (COD)

---

##  Multi-lingual Support

Product descriptions support **15+ languages** through **Google Translate API** integration. Translations are cached in the database (`product_translations` table) to minimise API calls and improve performance.

---

##  Notifications

HastaKrafts implements a dual notification system:
- **Web Push Notifications** via Webpushr for browser-level alerts
- **In-app Notifications** via Socket.IO for real-time in-app alerts

Notification triggers include order updates, auction results, new messages, and artisan approval status changes.

---

##  Database

- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Tables**: 20 tables including users, sellers, products, orders, auctions, bids, messages, notifications, product_translations, and more
- **Migrations**: Managed via Sequelize migrations

---

##  Testing

- Unit testing on all backend API endpoints
- Integration testing for payment, Socket.IO, and third-party API flows
- UI testing across Chrome, Firefox, and Microsoft Edge
- Performance optimisation applied to database queries and API responses

---

##  Developer

**Suhana Thapa**  
Student ID: 23056364  
Module: CS6P05NI — Final Year Project  
Institution: Islington College, Kathmandu  
Affiliation: London Metropolitan University  
Academic Year: 2024/2025  

---

##  License

This project was developed as an academic final year project. All rights reserved © 2025 Suhana Thapa.

---

##  Acknowledgements

- Federation of Handicraft Associations of Nepal (FHAN) for industry data
- Khalti for payment gateway documentation and sandbox access
- Webpushr for web push notification service
- Islington College and supervising faculty for guidance throughout the project

 
