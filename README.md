# Zoho Barcode Generator

A React-based web application for generating and printing barcodes with Zoho integration.

## 🚀 Live Demo

**[View Live App](https://umanz-dev.github.io/lamxi-trading-zoho-barcode-generator)**

## ✨ Features

- Generate barcodes for inventory items
- Print barcodes in bulk
- Zoho Books integration
- Modern Material-UI interface
- Responsive design

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Zoho Books account with API access

### 1. Clone the Repository
```bash
git clone https://github.com/umanz-dev/lamxi-trading-zoho-barcode-generator.git
cd lamxi-trading-zoho-barcode-generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_CLIENT_ID=your_zoho_client_id
REACT_APP_ORGANIZATION_ID=your_zoho_organization_id
```

### 4. Start Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📦 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages

## 🚀 Deployment

### Deploy to GitHub Pages
```bash
npm run deploy
```

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `build` folder to your hosting service

## 🔧 Configuration

### Zoho Books Setup
1. Go to Zoho Books → Settings → Developer Space
2. Create a new app and get your Client ID
3. Note your Organization ID from the URL
4. Add these to your `.env` file

### Environment Variables
- `REACT_APP_CLIENT_ID` - Your Zoho Books Client ID
- `REACT_APP_ORGANIZATION_ID` - Your Zoho Books Organization ID

## 📱 Usage

1. **Login** - Authenticate with your Zoho account
2. **Import Items** - Fetch items from Zoho Books
3. **Generate Barcodes** - Create barcodes for selected items
4. **Print** - Print barcodes individually or in bulk

## 🛡️ Security

- Environment variables are stored locally in `.env`
- `.env` file is gitignored for security
- Never commit sensitive credentials

