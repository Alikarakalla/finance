# 💰 Finance Manager - Personal Finance Tracker

A high-performance React Native Expo app for tracking income, expenses, and subscriptions with native iOS 26 Liquid Glass UI effects.

## ✨ Features

### 🎨 Core UI & Navigation
- **Native iOS 26 Liquid Glass Effect**: True glassmorphism using `expo-blur` and native tab bars
- **SF Symbols Integration**: System-native icons for authentic iOS feel
- **Liquid Glass Components**: Custom buttons and cards that dynamically react to backgrounds
- **5-Tab Navigation**: Home, Transactions, Scan, Subscriptions, and Profile

### 📸 Receipt Scanning (OCR)
- **Camera Integration**: Use `expo-camera` to capture receipts
- **OCR Processing**: Supports Mindee and Taggun APIs for automatic data extraction
- **Auto-Fill Forms**: Automatically extracts total amount, merchant name, and date
- **Manual Entry**: Fallback option for manual transaction entry
- **Mock Mode**: Test without API keys using simulated data

### 📅 Subscription Tracking
- **App Store Integration**: Sync active subscriptions (ready for `expo-iap` or RevenueCat)
- **Manual Subscriptions**: Add custom recurring expenses
- **Monthly Totals**: Calculate total subscription costs
- **Billing Reminders**: Track next billing dates

### 💾 Data Management
- **MMKV Storage**: Lightning-fast local storage with encryption support
- **Real-time Analytics**: Monthly balance calculations and category breakdowns
- **Data Export**: Export all transactions and subscriptions
- **Data Clearing**: Clean slate option for testing

### 📊 Visualizations
- **Monthly Overview Chart**: 6-month income trend using `react-native-gifted-charts`
- **Expense Breakdown**: Pie chart showing spending by category
- **Recent Transactions**: Quick view of latest financial activity

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator with iOS 26+ (for Liquid Glass effects)
- Xcode 26+ (for iOS builds)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd Finance-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your API keys:
   - Mindee API key: Get from https://platform.mindee.com/
   - Taggun API key: Get from https://www.taggun.io/

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on iOS Simulator**
   - Press `i` in the Expo CLI
   - Or scan QR code with your iPhone (iOS 26+ recommended)

## 📱 Project Structure

```
Finance-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Native tabs configuration
│   │   ├── index.tsx             # Home screen with charts
│   │   ├── transactions.tsx      # Transaction list with filters
│   │   ├── scan.tsx              # Camera & OCR scanning
│   │   ├── subscriptions.tsx     # Subscription management
│   │   └── profile.tsx           # User profile & settings
│   └── _layout.tsx               # Root layout
├── components/
│   └── LiquidGlassComponents.tsx # Reusable UI components
├── services/
│   └── ocrService.ts             # OCR integration (Mindee/Taggun)
├── utils/
│   └── storage.ts                # MMKV storage utilities
└── app.json                      # Expo configuration
```

## 🎨 Key Technologies

- **Expo SDK 54+**: Latest Expo framework
- **TypeScript**: Type-safe development
- **Expo Router**: File-based navigation
- **expo-blur**: iOS Liquid Glass effects
- **expo-camera**: Receipt scanning
- **react-native-mmkv**: Fast local storage
- **react-native-gifted-charts**: Data visualization
- **expo-haptics**: Tactile feedback

## 🔧 Configuration

### OCR Provider Setup

**Option 1: Mindee (Recommended)**
```env
EXPO_PUBLIC_OCR_PROVIDER=mindee
EXPO_PUBLIC_OCR_API_KEY=your-mindee-api-key
```

**Option 2: Taggun**
```env
EXPO_PUBLIC_OCR_PROVIDER=taggun
EXPO_PUBLIC_OCR_API_KEY=your-taggun-api-key
```

**Option 3: Mock (Testing)**
Leave the API key empty or set to `your-api-key-here` to use mock data.

### App Store Subscription Sync

To implement real App Store subscription syncing:

1. Install RevenueCat:
   ```bash
   npx expo install react-native-purchases
   ```

2. Or use expo-iap:
   ```bash
   npx expo install expo-iap
   ```

3. Update `app/(tabs)/subscriptions.tsx` with your implementation
4. Configure your RevenueCat/IAP credentials in `.env`

## 🎯 Usage Guide

### Adding Transactions

1. **Via Receipt Scan**:
   - Go to Scan tab
   - Tap "Take Photo" or "Choose from Gallery"
   - Review extracted data
   - Save transaction

2. **Manual Entry**:
   - Go to Scan tab
   - Tap "Enter Manually"
   - Fill in amount, merchant, category
   - Save transaction

### Managing Subscriptions

1. **Sync with App Store**:
   - Go to Subscriptions tab
   - Tap "Sync with App Store"
   - Review detected subscriptions

2. **Add Manual Subscription**:
   - Tap "Add Subscription"
   - Enter name, amount, billing cycle
   - Choose category
   - Save

### Viewing Analytics

- **Home Tab**: View monthly balance, income trends, and expense breakdown
- **Transactions Tab**: Filter by income/expense, view transaction history
- **Profile Tab**: Export data, manage settings

## 🎨 Liquid Glass Effect

The app uses native iOS materials for the authentic iOS 26 Liquid Glass effect:

- **Tab Bar**: `expo-blur` with `systemMaterial` tint
- **Headers**: `headerBlurEffect: 'systemUltraThinMaterial'`
- **Cards**: `BlurView` with dynamic intensity
- **Buttons**: Glass morphism with border highlights

**Note**: The full Liquid Glass effect requires iOS 26+ and Xcode 26+ for compilation.

## 🧪 Testing

### Mock Data Mode

The app includes mock data generators for testing without API keys:

- **OCR**: Returns sample receipt data
- **App Store Sync**: Simulates Apple Music and iCloud+ subscriptions

### Reset Data

To clear all data during testing:
1. Go to Profile tab
2. Tap "Clear All Data"
3. Confirm deletion

## 📦 Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

### Development Build

```bash
# Create development build
eas build --profile development --platform ios

# Install on device
eas build:run --profile development
```

## 🔐 Security Notes

- **MMKV Encryption**: Update the encryption key in `utils/storage.ts`
- **API Keys**: Never commit `.env` file with real credentials
- **Biometric Auth**: Implement using `expo-local-authentication` in production

## 🐛 Troubleshooting

### White Screen on iOS
- Ensure Metro bundler is running: `npx expo start -c`
- Clear cache: `npx expo start --clear`

### OCR Not Working
- Check API key in `.env`
- Verify OCR provider is correct
- Check console for error messages
- Use mock mode for testing

### Charts Not Rendering
- Ensure `react-native-svg` is installed
- Restart Metro bundler
- Check that data exists (add sample transactions)

### Camera Permission Denied
- Reset simulator: Device → Erase All Content and Settings
- On physical device: Settings → Privacy → Camera

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

- **Expo Team**: For the amazing SDK and tools
- **Mindee/Taggun**: OCR services
- **RevenueCat**: In-app purchase infrastructure
- **iOS 26**: For the beautiful Liquid Glass design language

---

**Built with ❤️ using Expo SDK 54**
