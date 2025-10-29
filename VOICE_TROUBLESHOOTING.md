# Voice Chat Troubleshooting Guide

## Common Issues in Production

### 1. ❌ Microphone Not Working

#### **HTTPS Requirement (Most Common)**
- **Issue**: Voice features require HTTPS, not HTTP
- **Solution**: 
  - Ensure your site is deployed with HTTPS (Vercel/Netlify provide this automatically)
  - Check your URL starts with `https://`, not `http://`
  - If testing locally, `localhost` works without HTTPS

#### **Browser Permissions**
- **Issue**: Browser blocked microphone access
- **Solution**:
  - Click the lock/padlock icon in the address bar
  - Check microphone permissions → Allow
  - Clear site data and try again

#### **Browser Compatibility**
- **Supported**: Chrome, Edge, Safari (iOS 16.4+)
- **Not Supported**: Firefox (limited), older browsers
- **Solution**: Use a supported browser

### 2. ❌ Speech Recognition Not Starting

#### **Check Console Errors**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - `HTTPS required` → Use HTTPS
   - `Permission denied` → Allow microphone in browser settings
   - `NotSupportedError` → Use a supported browser

#### **Network Issues**
- Speech Recognition API requires internet connection
- If seeing "network error" → Check your internet connection

### 3. ❌ Audio Playback Not Working

#### **Browser Autoplay Policy**
- **Issue**: Browsers block autoplay of audio
- **Solution**: 
  - Click anywhere on the page first to enable audio
  - This is a browser security feature, not a bug

#### **Audio Format Issues**
- **Issue**: Browser doesn't support the audio format
- **Solution**: Use Chrome/Edge which support MP3 playback

### 4. ✅ Testing Steps

1. **Check HTTPS**:
   ```
   Open DevTools → Console
   Type: window.location.protocol
   Should show: "https:"
   ```

2. **Check Microphone Access**:
   ```
   Open DevTools → Console
   Type: navigator.mediaDevices.getUserMedia({ audio: true })
   Should prompt for permission
   ```

3. **Check Speech Recognition Support**:
   ```
   Open DevTools → Console
   Type: window.SpeechRecognition || window.webkitSpeechRecognition
   Should not be: undefined
   ```

### 5. 🔧 Quick Fixes

#### For Production Deployment:
1. ✅ Ensure HTTPS is enabled
2. ✅ Check environment variables are set:
   - `GROQ_API_KEY` (for STT/TTS)
   - `OPENAI_API_KEY` (optional, for STT fallback)
3. ✅ Test microphone permission prompt appears
4. ✅ Check browser console for errors

#### For Developers:
1. Check `app/voice-chat/page.tsx` error handling
2. Check `app/components/VoiceInterface.tsx` error handling
3. Verify API routes `/api/stt` and `/api/tts` are accessible
4. Test with Chrome DevTools → Application → Service Workers disabled (if needed)

### 6. 📱 Mobile-Specific Issues

#### iOS (Safari):
- Requires iOS 16.4+ for Speech Recognition
- May need to enable "Allow Microphone" in Settings → Safari → Microphone

#### Android (Chrome):
- Should work out of the box
- Check Chrome permissions: Settings → Site Settings → Microphone

### 7. 🚨 Deployment Checklist

- [ ] Site is on HTTPS
- [ ] Environment variables are set (GROQ_API_KEY required)
- [ ] Browser supports Speech Recognition API
- [ ] User has granted microphone permissions
- [ ] No console errors
- [ ] API routes are accessible (test `/api/stt` endpoint)

### 8. Debug Information to Provide

If voice still doesn't work, check and provide:
1. Browser name and version
2. Console error messages (F12 → Console)
3. Network tab errors (F12 → Network → look for failed requests)
4. Whether HTTPS is being used
5. Whether microphone permission prompt appeared

