# Mobile Access Setup Guide

This guide will help you access the Video Recorder app from your phone on the same network.

## Step 1: Find Your Computer's Local IP Address

### Windows:
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet)
4. It will look like: `192.168.1.100` or `192.168.0.50`

### Mac/Linux:
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your network interface (usually `en0` or `wlan0`)
4. Find the `inet` address (e.g., `192.168.1.100`)

## Step 2: Update Frontend API URL

1. Create a file named `.env.local` in the frontend root directory (`VideoRecorder/`)
2. Add this line (replace with your IP address):

```
NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```

Example:
```
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
```

## Step 3: Start Backend Server

```bash
cd ..\videoRecorderBackend
npm run dev
```

The backend will show:
- Local URL: `http://localhost:5000`
- Network URL: `http://YOUR_IP:5000` (use this for mobile)

## Step 4: Start Frontend Server

### Option A: For Mobile Access (Recommended)
```bash
npm run dev:network
```

This starts the server on all network interfaces, accessible from your phone.

### Option B: Standard (localhost only)
```bash
npm run dev
```

## Step 5: Access from Your Phone

1. Make sure your phone is connected to the **same Wi-Fi network** as your computer
2. Open a browser on your phone
3. Navigate to: `http://YOUR_LOCAL_IP:3000`

Example: `http://192.168.1.100:3000`

## Troubleshooting

### Can't connect from phone?
1. **Check firewall**: Make sure Windows Firewall allows Node.js and port 3000/5000
2. **Check IP address**: Make sure you're using the correct local IP (not 127.0.0.1)
3. **Check network**: Ensure phone and computer are on the same Wi-Fi network
4. **Check ports**: Make sure ports 3000 and 5000 are not blocked

### Backend not accessible?
- The backend now listens on `0.0.0.0` which allows network access
- Check the console output for the network URL
- Try accessing `http://YOUR_IP:5000/api/health` from your phone's browser

### Frontend shows connection error?
- Verify `.env.local` has the correct IP address
- Restart the Next.js dev server after creating/updating `.env.local`
- Check browser console for specific error messages

## Quick Test

1. From your phone's browser, try: `http://YOUR_IP:5000/api/health`
2. You should see: `{"status":"success","message":"Video Recorder Backend is running!",...}`
3. If this works, the backend is accessible. Then try the frontend URL.

