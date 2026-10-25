# ♟️ Royal Chess / शतरंज Arena (Gaming Website)

एक आधुनिक और सुंदर शतरंज (Chess) गेमिंग वेबसाइट, जिसे बिल्कुल Chess.com और Lichess की तरह पेशेवर फीचर्स के साथ बनाया गया है।

---

## 🚀 गेम कैसे शुरू करें (How to Run)

### तरीका 1: Python Launcher (सबसे आसान)
टर्मिनल / कमांड प्रॉम्प्ट में यह कमांड चलाएं:
```bash
cd "C:\Users\PRAMOD\.gemini\antigravity\scratch\chess-game-web"
python server.py
```
यह स्वचालित रूप से आपके ब्राउज़र में `http://localhost:8000` खोल देगा!

### तरीका 2: सीधे ब्राउज़र में खोलें (Direct Browser Open)
आप सीधे `index.html` फ़ाइल पर डबल-क्लिक करके भी किसी भी ब्राउज़र (Chrome, Edge, Firefox) में गेम खेल सकते हैं।

---

## 🌟 मुख्य विशेषताएँ (Features)

1. **🎮 दो गेम मोड्स (Game Modes)**:
   - **🤖 Vs Computer (AI)**: कंप्यूटर बॉट के साथ खेलें (3 कठिनाई स्तर: Easy ~800 ELO, Medium ~1400 ELO, Hard ~2000 ELO).
   - **👥 Pass & Play (2 Players)**: एक ही स्क्रीन/डिवाइस पर दो खिलाड़ी आपस में खेल सकते हैं।

2. **⚖️ लाइव इवैल्यूएशन बार (Live Evaluation Bar)**:
   - बाएँ तरफ़ एक डायनामिक बार जो बताता है कि किसका पलड़ा भारी है (White या Black)।

3. **⏱️ शतरंज क्लॉक (Chess Clocks & Timers)**:
   - ⚡ Bullet (2 मिनट)
   - ⏱️ Blitz (5 मिनट)
   - 🕒 Rapid (10 मिनट)
   - ♾️ Unlimited (असीमित समय)

4. **🔊 यथार्थवादी ध्वनि प्रभाव (Realistic Synthesized Audio)**:
   - Web Audio API से पाइस मूव, कैप्चर, चेक, कैसलिंग और गेम ओवर की असली लकड़ी जैसी आवाज़ें (बिना किसी बाहरी फ़ाइल के 100% ऑफ़लाइन काम करती हैं)।

5. **💡 इंटरेक्टिव टूल्स (Interactive Tools)**:
   - **💡 Best Move Hint**: मुश्किल स्थिति में बेस्ट चाल जानने के लिए हिंट बटन दबाएँ।
   - **↶ Undo Move**: गलत चाल को वापस लें।
   - **🔄 Flip Board**: बोर्ड को 180° घुमाएं (Black/White perspective)।
   - **👑 Pawn Promotion Dialog**: जब प्यादा आख़िरी रैंक पर पहुँचे तो रानी (Queen), हाथी (Rook), ऊँट (Bishop), या घोड़ा (Knight) चुनने का पॉपअप।
   - **📜 Move History Notation & Review**: सभी चालों की PGN नोटेशन, और किसी भी पुरानी चाल पर क्लिक करके बोर्ड की पुरानी स्थिति देखने की सुविधा।
   - **🎨 4 बोर्ड थीम्स (Themes)**: Emerald Green, Classic Walnut Wood, Ocean Slate Blue, और Midnight Violet.
   - **📱 मोबाइल और टच सपोर्ट (Touch & Drag-and-Drop)**: मोबाइल स्क्रीन पर भी आसानी से ड्रैग-एंड-ड्रॉप या टैप-टू-मूव।

---

## 📂 फ़ाइल संरचना (Project Structure)
- `index.html` : मुख्य गेमिंग वेबसाइट इंटरफ़ेस
- `style.css` : आधुनिक डार्क-मोड रिस्पॉन्सिव स्टाइलिंग
- `game.js` : गेम लॉजिक, बोर्ड रेंडरिंग, क्लॉक, ड्रैग-एंड-ड्रॉप और इवेंट्स
- `engine.js` : AI मिनिमैक्स इंजन, इवैल्यूएशन फ़ंक्शन और ओपनिंग डिक्शनरी
- `audio.js` : वेब ऑडियो सिंथेसाइज़र (साउंड इफ़ेक्ट्स)
- `chess.min.js` : आधिकारिक FIDE शतरंज रूल्स इंजन
- `pieces/` : सभी 12 गोटियों के उच्च-गुणवत्ता वाले वेक्टर SVG आइकन्स
- `server.py` : वन-क्लिक लोकल सर्वर लॉन्चर
