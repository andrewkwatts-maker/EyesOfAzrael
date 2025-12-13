# Devanagari Script Reference for Hindu Mythology

## Quick Copy-Paste Devanagari Names

### The Trimurti (Trinity)
```
त्रिमूर्ति - Trimurti (The Trinity)
ब्रह्मा - Brahma (Creator)
विष्णु - Vishnu (Preserver)
शिव - Shiva (Destroyer)
```

### Major Deities - Devanagari Names

#### Male Deities
```
गणेश - Ganesha (Remover of Obstacles)
कृष्ण - Krishna (Divine Avatar)
राम - Rama (Perfect King)
हनुमान - Hanuman (Monkey God)
इन्द्र - Indra (King of Gods)
कार्तिकेय - Kartikeya (War God)
यम - Yama (Death)
वरुण - Varuna (Ocean)
अग्नि - Agni (Fire)
द्यौस् - Dyaus (Sky Father)
```

#### Female Deities
```
सरस्वती - Saraswati (Wisdom/Arts)
लक्ष्मी - Lakshmi (Prosperity)
पार्वती - Parvati (Divine Mother)
दुर्गा - Durga (Warrior Goddess)
काली - Kali (Destroyer of Evil)
रति - Rati (Love/Desire)
यमी - Yami (Twin of Yama)
पृथ्वी - Prithvi (Earth)
```

### Seven Chakras - Complete List

```
सप्त चक्र - Sapta Chakra (Seven Chakras)

1. मूलाधार - Muladhara (Root Chakra)
2. स्वाधिष्ठान - Svadhisthana (Sacral Chakra)
3. मणिपुर - Manipura (Solar Plexus Chakra)
4. अनाहत - Anahata (Heart Chakra)
5. विशुद्ध - Vishuddha (Throat Chakra)
6. आज्ञा - Ajna (Third Eye Chakra)
7. सहस्रार - Sahasrara (Crown Chakra)
```

### Important Sanskrit Terms

```
ॐ - Om (Sacred Sound)
योग - Yoga (Union)
कर्म - Karma (Action/Fate)
धर्म - Dharma (Righteousness/Duty)
मोक्ष - Moksha (Liberation)
माया - Maya (Illusion)
प्राण - Prana (Life Force)
मंत्र - Mantra (Sacred Utterance)
तंत्र - Tantra (Esoteric Practice)
कुण्डलिनी - Kundalini (Serpent Power)
शक्ति - Shakti (Divine Feminine Energy)
भक्ति - Bhakti (Devotion)
ध्यान - Dhyana (Meditation)
समाधि - Samadhi (Enlightenment)
सत्य - Satya (Truth)
अहिंसा - Ahimsa (Non-violence)
```

### Vishnu's 10 Avatars (Dashavatara)

```
दशावतार - Dashavatara (Ten Avatars)

1. मत्स्य - Matsya (Fish)
2. कूर्म - Kurma (Turtle)
3. वराह - Varaha (Boar)
4. नरसिंह - Narasimha (Man-Lion)
5. वामन - Vamana (Dwarf)
6. परशुराम - Parashurama (Rama with Axe)
7. राम - Rama (Prince of Ayodhya)
8. कृष्ण - Krishna (Divine Cowherd)
9. बुद्ध - Buddha (Enlightened One)
10. कल्कि - Kalki (Future Avatar)
```

### Sacred Texts

```
वेद - Veda (Sacred Knowledge)
उपनिषद् - Upanishad (Philosophical Texts)
भगवद्गीता - Bhagavad Gita (Song of God)
रामायण - Ramayana (Epic of Rama)
महाभारत - Mahabharata (Great Epic)
पुराण - Purana (Ancient Stories)
```

### Sacred Places

```
वाराणसी - Varanasi (Holy City)
कैलाश - Kailash (Sacred Mountain)
गंगा - Ganga (Sacred River)
```

### Sacred Objects

```
त्रिशूल - Trishula (Trident of Shiva)
सुदर्शन चक्र - Sudarshana Chakra (Vishnu's Discus)
वज्र - Vajra (Thunderbolt)
```

---

## CSS Usage

### Basic Devanagari Text
```html
<span class="devanagari">शिव</span>
```

### Sanskrit Deity Name (Larger, Styled)
```html
<div class="sanskrit-name devanagari">ब्रह्मा</div>
```

### Chakra Badge with Devanagari
```html
<div class="deity-chakra-badge">
    Shiva • <span class="devanagari">शिव</span>
</div>
```

---

## Font Stack

```css
.devanagari {
    font-family: 'Noto Sans Devanagari', 'Tiro Devanagari Sanskrit',
                 'Mangal', 'Nirmala UI', sans-serif;
}
```

**Fallback Chain:**
1. **Noto Sans Devanagari** - Google Fonts (primary)
2. **Tiro Devanagari Sanskrit** - Google Fonts (serif alternative)
3. **Mangal** - Windows default Devanagari
4. **Nirmala UI** - Windows 8+ Devanagari
5. **sans-serif** - System fallback

---

## Unicode Ranges

Devanagari Unicode Block: **U+0900 to U+097F**

### Common Characters:
- Vowels: अ आ इ ई उ ऊ ए ऐ ओ औ
- Consonants: क ख ग घ च छ ज झ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह
- Special: ॐ (Om - U+0950)
- Punctuation: । (Danda - U+0964), ॥ (Double Danda - U+0965)

---

## Typing Devanagari

### Online Tools:
- **Google Input Tools**: https://www.google.com/inputtools/try/
- **Lexilogos**: https://www.lexilogos.com/keyboard/devanagari.htm
- **Branah**: https://www.branah.com/devanagari

### Keyboard Layouts:
- **Windows**: Add Hindi/Sanskrit keyboard in Language Settings
- **Mac**: System Preferences > Keyboard > Input Sources > Add Hindi
- **Linux**: IBus or fcitx with Devanagari support

### Transliteration:
Many tools support IAST (International Alphabet of Sanskrit Transliteration):
- Type: `shiva` → Auto-converts to: शिव
- Type: `brahma` → Auto-converts to: ब्रह्मा

---

## Common Mistakes to Avoid

### 1. **Font Fallback**
❌ DON'T: Rely only on Google Fonts
✓ DO: Include system font fallbacks

### 2. **Text Direction**
❌ DON'T: Mix RTL languages with Devanagari
✓ DO: Keep Devanagari LTR (left-to-right)

### 3. **Line Height**
❌ DON'T: Use standard 1.5 line-height
✓ DO: Use minimum 1.8 for Devanagari (tall characters)

### 4. **Conjuncts**
❌ DON'T: Break conjunct characters across lines
✓ DO: Use `word-break: keep-all` for Sanskrit

---

## Pronunciation Guide

### Vowels:
- अ (a) - like "u" in "but"
- आ (ā) - like "a" in "father"
- इ (i) - like "i" in "bit"
- ई (ī) - like "ee" in "see"
- उ (u) - like "oo" in "put"
- ऊ (ū) - like "oo" in "pool"

### Consonants:
- क (ka) - like "k" in "skip"
- ख (kha) - like "kh" in "blockhead"
- ग (ga) - like "g" in "go"
- घ (gha) - like "gh" in "doghouse"
- च (ca) - like "ch" in "church"
- ज (ja) - like "j" in "judge"
- त (ta) - like "t" in "butter" (dental)
- द (da) - like "d" in "ladder" (dental)
- न (na) - like "n" in "no"
- प (pa) - like "p" in "spin"
- ब (ba) - like "b" in "bat"
- म (ma) - like "m" in "mother"
- य (ya) - like "y" in "yes"
- र (ra) - like "r" in "red" (rolled)
- ल (la) - like "l" in "love"
- व (va) - like "w" in "wine" or "v" in "vine"
- श (śa) - like "sh" in "shun"
- ष (ṣa) - retroflex "sh"
- स (sa) - like "s" in "sun"
- ह (ha) - like "h" in "house"

### Special:
- ॐ (Om/Aum) - Pronounced "Ohm" with nasal resonance

---

## Quality Assurance

### Testing Checklist:
- [ ] Devanagari renders correctly in Chrome
- [ ] Devanagari renders correctly in Firefox
- [ ] Devanagari renders correctly in Safari
- [ ] Mobile rendering works (iOS/Android)
- [ ] Font loads without FOUT (Flash of Unstyled Text)
- [ ] Fallback fonts work if Google Fonts fails
- [ ] Line breaks don't split conjuncts
- [ ] Text is readable at all zoom levels

---

## Resources

### Fonts:
- **Google Fonts**: https://fonts.google.com/?subset=devanagari
- **Noto Fonts**: https://www.google.com/get/noto/
- **Indian Type Foundry**: https://www.indiantypefoundry.com/

### Unicode:
- **Unicode Chart**: https://unicode.org/charts/PDF/U0900.pdf
- **Devanagari Block**: https://en.wikipedia.org/wiki/Devanagari_(Unicode_block)

### Learning:
- **Omniglot**: https://www.omniglot.com/writing/devanagari.htm
- **Wikipedia**: https://en.wikipedia.org/wiki/Devanagari

---

## Support

For questions about Devanagari implementation in EyesOfAzrael:
1. Check this reference document
2. Verify Unicode correctness
3. Test across browsers
4. Consult Sanskrit scholars for accuracy

**Last Updated:** December 13, 2025
