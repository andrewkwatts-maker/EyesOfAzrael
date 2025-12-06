#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Complete Hindu Entity Metadata Update Script - v2.0 Compliance"""
import json
import sys

# Metadata database for all Hindu entities
MD = {
    "karma": {"name": "कर्म", "pron": "/kərmə/", "etym": {"root": "Sanskrit", "mean": "Action, deed, work", "deriv": "From Sanskrit root 'kṛ' (कृ) meaning 'to do, make, perform'"}, "cog": [{"language": "Pali", "term": "kamma", "script": "𑀓𑀫𑁆𑀫"}, {"language": "Hindi", "term": "कर्म", "script": "karm"}, {"language": "Bengali", "term": "কর্ম", "script": "kôrmo"}, {"language": "Tamil", "term": "கருமம்", "script": "karumam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda and Upanishads", "lat": 25.3176, "lon": 82.9739},
    "maya": {"name": "माया", "pron": "/maːjaː/", "etym": {"root": "Sanskrit", "mean": "Illusion, magic, creative power", "deriv": "From Sanskrit root 'mā' (मा) meaning 'to measure, create, construct'"}, "cog": [{"language": "Pali", "term": "māyā", "script": "𑀫𑀸𑀬𑀸"}, {"language": "Hindi", "term": "माया", "script": "māyā"}, {"language": "Bengali", "term": "মায়া", "script": "māẏā"}, {"language": "Tamil", "term": "மாயை", "script": "māyai"}], "tl": "Epic", "per": "Late Vedic to Classical (800 BCE - 1200 CE)", "yr": -800, "src": "Upanishads", "lat": 25.3176, "lon": 82.9739},
    "moksha": {"name": "मोक्ष", "pron": "/moːkʃə/", "etym": {"root": "Sanskrit", "mean": "Liberation, release, freedom", "deriv": "From Sanskrit root 'muc' (मुच्) meaning 'to free, release, liberate'"}, "cog": [{"language": "Pali", "term": "mokha", "script": "𑀫𑁄𑀔"}, {"language": "Hindi", "term": "मोक्ष", "script": "mokṣ"}, {"language": "Bengali", "term": "মোক্ষ", "script": "mōkṣô"}, {"language": "Tamil", "term": "மோட்சம்", "script": "mōṭcam"}], "tl": "Vedic", "per": "Upanishadic Period (800-200 BCE)", "yr": -800, "src": "Upanishads", "lat": 25.3176, "lon": 82.9739},
    "prana": {"name": "प्राण", "pron": "/praːɳə/", "etym": {"root": "Sanskrit", "mean": "Vital breath, life force", "deriv": "From 'pra' (प्र) 'forward' + 'an' (अन्) 'to breathe'"}, "cog": [{"language": "Pali", "term": "pāṇa", "script": "𑀧𑀸𑀡"}, {"language": "Hindi", "term": "प्राण", "script": "prāṇ"}, {"language": "Bengali", "term": "প্রাণ", "script": "prāṇ"}, {"language": "Tamil", "term": "பிராணன்", "script": "pirāṇaṉ"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Atharvaveda", "lat": 25.3176, "lon": 82.9739},
    "samsara": {"name": "संसार", "pron": "/səmsaːrə/", "etym": {"root": "Sanskrit", "mean": "Wandering, world, cycle", "deriv": "From 'sam' (सम्) 'together' + 'sṛ' (सृ) 'to flow'"}, "cog": [{"language": "Pali", "term": "saṃsāra", "script": "𑀲𑀁𑀲𑀸𑀭"}, {"language": "Hindi", "term": "संसार", "script": "sansār"}, {"language": "Bengali", "term": "সংসার", "script": "sôṅsar"}, {"language": "Tamil", "term": "சம்சாரம்", "script": "samsāram"}], "tl": "Vedic", "per": "Upanishadic Period (800-200 BCE)", "yr": -800, "src": "Upanishads", "lat": 25.3176, "lon": 82.9739},
    "garuda": {"name": "गरुड", "pron": "/gəruɖə/", "etym": {"root": "Sanskrit", "mean": "Devourer, eagle", "deriv": "From Sanskrit root 'gṛ' (गृ) meaning 'to swallow, devour'"}, "cog": [{"language": "Pali", "term": "garuḷa", "script": "𑀕𑀭𑀼𑀍"}, {"language": "Hindi", "term": "गरुड़", "script": "garuṛ"}, {"language": "Bengali", "term": "গরুড়", "script": "gôruṛ"}, {"language": "Tamil", "term": "கருடன்", "script": "karuṭaṉ"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -500, "src": "Mahabharata", "lat": 25.3176, "lon": 82.9739},
    "makara": {"name": "मकर", "pron": "/məkərə/", "etym": {"root": "Sanskrit", "mean": "Sea creature, crocodile", "deriv": "Ancient Sanskrit term for mythical aquatic creature"}, "cog": [{"language": "Pali", "term": "makara", "script": "𑀫𑀓𑀭"}, {"language": "Hindi", "term": "मकर", "script": "makar"}, {"language": "Bengali", "term": "মকর", "script": "môkôr"}, {"language": "Tamil", "term": "மகரம்", "script": "makaram"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1000, "src": "Vedic texts", "lat": 25.3176, "lon": 82.9739},
    "nagas": {"name": "नाग", "pron": "/naːgə/", "etym": {"root": "Sanskrit", "mean": "Serpent, cobra", "deriv": "From Sanskrit 'nāga' meaning serpent deity"}, "cog": [{"language": "Pali", "term": "nāga", "script": "𑀦𑀸𑀕"}, {"language": "Hindi", "term": "नाग", "script": "nāg"}, {"language": "Bengali", "term": "নাগ", "script": "nag"}, {"language": "Tamil", "term": "நாகம்", "script": "nākam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda", "lat": 25.3176, "lon": 82.9739},
    "brahma": {"name": "ब्रह्मा", "pron": "/brəhmaː/", "etym": {"root": "Sanskrit", "mean": "Creator, expansion", "deriv": "From 'bṛh' (बृह्) meaning 'to grow, expand'"}, "cog": [{"language": "Pali", "term": "brahmā", "script": "𑀩𑁆𑀭𑀳𑁆𑀫𑀸"}, {"language": "Hindi", "term": "ब्रह्मा", "script": "brahmā"}, {"language": "Bengali", "term": "ব্রহ্মা", "script": "brôhmā"}, {"language": "Tamil", "term": "பிரம்மா", "script": "pirammā"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda", "lat": 25.3176, "lon": 82.9739},
    "bilva": {"name": "बिल्व", "pron": "/bilvə/", "etym": {"root": "Sanskrit", "mean": "Sacred wood apple tree", "deriv": "Sanskrit term for Aegle marmelos, sacred to Shiva"}, "cog": [{"language": "Pali", "term": "bilva", "script": "𑀩𑀺𑀮𑁆𑀯"}, {"language": "Hindi", "term": "बेल", "script": "bel"}, {"language": "Bengali", "term": "বেল", "script": "bel"}, {"language": "Tamil", "term": "வில்வம்", "script": "vilvam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1000, "src": "Atharvaveda", "lat": 25.3176, "lon": 82.9739},
    "gandiva": {"name": "गाण्डीव", "pron": "/gaːɳɖiːvə/", "etym": {"root": "Sanskrit", "mean": "Arjuna's celestial bow", "deriv": "Mythical name of divine origin"}, "cog": [{"language": "Pali", "term": "gāṇḍīva", "script": "𑀕𑀸𑀡𑁆𑀟𑀻𑀯"}, {"language": "Hindi", "term": "गांडीव", "script": "gāṇḍīv"}, {"language": "Bengali", "term": "গান্ডীব", "script": "gānḍīb"}, {"language": "Tamil", "term": "காண்டீவம்", "script": "kāṇṭīvam"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -400, "src": "Mahabharata", "lat": 29.9696, "lon": 76.8783},
    "lotus": {"name": "पद्म", "pron": "/pədmə/", "etym": {"root": "Sanskrit", "mean": "Lotus flower", "deriv": "From Sanskrit 'padma' meaning sacred lotus"}, "cog": [{"language": "Pali", "term": "paduma", "script": "𑀧𑀤𑀼𑀫"}, {"language": "Hindi", "term": "कमल", "script": "kamal"}, {"language": "Bengali", "term": "পদ্ম", "script": "pôdmô"}, {"language": "Tamil", "term": "தாமரை", "script": "tāmarai"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda", "lat": 25.3176, "lon": 82.9739},
    "soma": {"name": "सोम", "pron": "/soːmə/", "etym": {"root": "Sanskrit", "mean": "Sacred drink, moon", "deriv": "From Sanskrit root 'su' meaning 'to press, extract'"}, "cog": [{"language": "Pali", "term": "soma", "script": "𑀲𑁄𑀫"}, {"language": "Hindi", "term": "सोम", "script": "som"}, {"language": "Bengali", "term": "সোম", "script": "sōm"}, {"language": "Tamil", "term": "சோமம்", "script": "cōmam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1500, "src": "Rigveda", "lat": 28.5, "lon": 83.5},
    "sudarshana-chakra": {"name": "सुदर्शन चक्र", "pron": "/sudərʃənə tʃəkrə/", "etym": {"root": "Sanskrit", "mean": "Beautiful discus", "deriv": "From 'su' (good) + 'darśana' (vision) + 'chakra' (wheel)"}, "cog": [{"language": "Pali", "term": "sudassana cakka", "script": "𑀲𑀼𑀤𑀲𑁆𑀲𑀦 𑀘𑀓𑁆𑀓"}, {"language": "Hindi", "term": "सुदर्शन चक्र", "script": "sudarśan cakra"}, {"language": "Bengali", "term": "সুদর্শন চক্র", "script": "sudôrśôn côkrô"}, {"language": "Tamil", "term": "சுதர்சன சக்கரம்", "script": "sudarśaṉa cakkaram"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -500, "src": "Puranas", "lat": 25.3176, "lon": 82.9739},
    "trishula": {"name": "त्रिशूल", "pron": "/triʃuːlə/", "etym": {"root": "Sanskrit", "mean": "Three-pointed spear, trident", "deriv": "From 'tri' (three) + 'śūla' (spike)"}, "cog": [{"language": "Pali", "term": "tisūla", "script": "𑀢𑀺𑀲𑀽𑀮"}, {"language": "Hindi", "term": "त्रिशूल", "script": "triśūl"}, {"language": "Bengali", "term": "ত্রিশূল", "script": "triśul"}, {"language": "Tamil", "term": "திரிசூலம்", "script": "tiricūlam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1000, "src": "Vedic texts", "lat": 31.0667, "lon": 81.3167},
    "tulsi": {"name": "तुलसी", "pron": "/tulsiː/", "etym": {"root": "Sanskrit", "mean": "Sacred basil, incomparable", "deriv": "From 'tulasī' meaning matchless, incomparable"}, "cog": [{"language": "Pali", "term": "tulasī", "script": "𑀢𑀼𑀮𑀲𑀻"}, {"language": "Hindi", "term": "तुलसी", "script": "tulsī"}, {"language": "Bengali", "term": "তুলসী", "script": "tulsi"}, {"language": "Tamil", "term": "துளசி", "script": "tuḷaci"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -400, "src": "Puranas", "lat": 25.3176, "lon": 82.9739},
    "vajra": {"name": "वज्र", "pron": "/vəɟrə/", "etym": {"root": "Sanskrit", "mean": "Thunderbolt, diamond", "deriv": "From Sanskrit root meaning 'hard, adamantine'"}, "cog": [{"language": "Pali", "term": "vajira", "script": "𑀯𑀚𑀺𑀭"}, {"language": "Hindi", "term": "वज्र", "script": "vajra"}, {"language": "Bengali", "term": "বজ্র", "script": "bôjrô"}, {"language": "Tamil", "term": "வஜ்ரம்", "script": "vajram"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1500, "src": "Rigveda", "lat": 28.5, "lon": 83.5},
    "diwali": {"name": "दीपावली", "pron": "/diːpaːvəliː/", "etym": {"root": "Sanskrit", "mean": "Row of lamps", "deriv": "From 'dīpa' (lamp) + 'āvalī' (row)"}, "cog": [{"language": "Pali", "term": "dīpāvalī", "script": "𑀤𑀻𑀧𑀸𑀯𑀮𑀻"}, {"language": "Hindi", "term": "दिवाली", "script": "divālī"}, {"language": "Bengali", "term": "দীপাবলি", "script": "dīpābôli"}, {"language": "Tamil", "term": "தீபாவளி", "script": "tīpāvaḷi"}], "tl": "Classical", "per": "Classical Period (500-1200 CE)", "yr": 500, "src": "Puranas", "lat": 25.3176, "lon": 82.9739},
    "kurukshetra": {"name": "कुरुक्षेत्र", "pron": "/kurukʃeːtrə/", "etym": {"root": "Sanskrit", "mean": "Field of the Kurus", "deriv": "From 'kuru' (clan name) + 'kṣetra' (field)"}, "cog": [{"language": "Pali", "term": "kurukkhetta", "script": "𑀓𑀼𑀭𑀼𑀓𑁆𑀔𑁂𑀢𑁆𑀢"}, {"language": "Hindi", "term": "कुरुक्षेत्र", "script": "kurukṣetra"}, {"language": "Bengali", "term": "কুরুক্ষেত্র", "script": "kurukṣetrô"}, {"language": "Tamil", "term": "குருக்ஷேத்திரம்", "script": "kurukṣēttiram"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -400, "src": "Mahabharata", "lat": 29.9696, "lon": 76.8783},
    "mount-kailash": {"name": "कैलास", "pron": "/kəilaːsə/", "etym": {"root": "Sanskrit", "mean": "Crystal mountain", "deriv": "From Sanskrit 'kailāsa' meaning crystal"}, "cog": [{"language": "Pali", "term": "kelāsa", "script": "𑀓𑁂𑀮𑀸𑀲"}, {"language": "Hindi", "term": "कैलाश", "script": "kailāś"}, {"language": "Bengali", "term": "কৈলাস", "script": "kôilas"}, {"language": "Tamil", "term": "கைலாசம்", "script": "kailācam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1000, "src": "Puranas", "lat": 31.0667, "lon": 81.3167},
    "mount-meru": {"name": "मेरु", "pron": "/meːru/", "etym": {"root": "Sanskrit", "mean": "Cosmic mountain", "deriv": "From Sanskrit 'meru' meaning central sacred mountain"}, "cog": [{"language": "Pali", "term": "meru", "script": "𑀫𑁂𑀭𑀼"}, {"language": "Hindi", "term": "मेरु", "script": "meru"}, {"language": "Bengali", "term": "মেরু", "script": "meru"}, {"language": "Tamil", "term": "மேரு", "script": "mēru"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda", "lat": 28.5, "lon": 84.0},
    "patala": {"name": "पाताल", "pron": "/paːtaːlə/", "etym": {"root": "Sanskrit", "mean": "Netherworld", "deriv": "From 'pāta' (falling) + 'tala' (realm, level)"}, "cog": [{"language": "Pali", "term": "pātāla", "script": "𑀧𑀸𑀢𑀸𑀮"}, {"language": "Hindi", "term": "पाताल", "script": "pātāl"}, {"language": "Bengali", "term": "পাতাল", "script": "pātāl"}, {"language": "Tamil", "term": "பாதாளம்", "script": "pātāḷam"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -500, "src": "Puranas", "lat": 25.3176, "lon": 82.9739},
    "river-ganges": {"name": "गङ्गा", "pron": "/gəŋgaː/", "etym": {"root": "Sanskrit", "mean": "Sacred river, swiftly flowing", "deriv": "From Sanskrit 'gaṅgā' meaning flowing, swift"}, "cog": [{"language": "Pali", "term": "gaṅgā", "script": "𑀕𑀁𑀕𑀸"}, {"language": "Hindi", "term": "गंगा", "script": "gaṅgā"}, {"language": "Bengali", "term": "গঙ্গা", "script": "gôṅga"}, {"language": "Tamil", "term": "கங்கை", "script": "kaṅkai"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1500, "src": "Rigveda", "lat": 25.9644, "lon": 83.5742},
    "swarga": {"name": "स्वर्ग", "pron": "/svərgə/", "etym": {"root": "Sanskrit", "mean": "Heaven, paradise", "deriv": "From 'svar' (heaven) + 'ga' (going to)"}, "cog": [{"language": "Pali", "term": "sagga", "script": "𑀲𑀕𑁆𑀕"}, {"language": "Hindi", "term": "स्वर्ग", "script": "svarg"}, {"language": "Bengali", "term": "স্বর্গ", "script": "svôrgô"}, {"language": "Tamil", "term": "சுவர்க்கம்", "script": "svarkkam"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Rigveda", "lat": 28.5, "lon": 84.0},
    "vaikuntha": {"name": "वैकुण्ठ", "pron": "/vəikuɳʈʰə/", "etym": {"root": "Sanskrit", "mean": "Vishnu's abode, without anxiety", "deriv": "From 'vi' (without) + 'kuṇṭha' (anxiety)"}, "cog": [{"language": "Pali", "term": "vaikuṇṭha", "script": "𑀯𑀻𑀓𑀼𑀡𑁆𑀞"}, {"language": "Hindi", "term": "वैकुंठ", "script": "vaikuṇṭh"}, {"language": "Bengali", "term": "বৈকুণ্ঠ", "script": "bôikuṇṭhô"}, {"language": "Tamil", "term": "வைகுண்டம்", "script": "vaikuṇṭam"}], "tl": "Epic", "per": "Epic Period (500 BCE - 500 CE)", "yr": -400, "src": "Puranas", "lat": 28.5, "lon": 84.0},
    "varanasi": {"name": "वाराणसी", "pron": "/vaːraːɳəsiː/", "etym": {"root": "Sanskrit", "mean": "Between Varuna and Asi rivers", "deriv": "From rivers 'Varuṇā' and 'Asi'"}, "cog": [{"language": "Pali", "term": "bārāṇasī", "script": "𑀩𑀸𑀭𑀸𑀡𑀲𑀻"}, {"language": "Hindi", "term": "वाराणसी", "script": "vārāṇasī"}, {"language": "Bengali", "term": "বারাণসী", "script": "bārāṇasī"}, {"language": "Tamil", "term": "வாரணாசி", "script": "vāraṇāci"}], "tl": "Vedic", "per": "Vedic Period (1500-500 BCE)", "yr": -1200, "src": "Atharvaveda", "lat": 25.3176, "lon": 82.9739},
}

files = [
    ("h:/Github/EyesOfAzrael/data/entities/concept/karma.json", "karma"),
    ("h:/Github/EyesOfAzrael/data/entities/concept/maya.json", "maya"),
    ("h:/Github/EyesOfAzrael/data/entities/concept/moksha.json", "moksha"),
    ("h:/Github/EyesOfAzrael/data/entities/concept/prana.json", "prana"),
    ("h:/Github/EyesOfAzrael/data/entities/concept/samsara.json", "samsara"),
    ("h:/Github/EyesOfAzrael/data/entities/creature/garuda.json", "garuda"),
    ("h:/Github/EyesOfAzrael/data/entities/creature/makara.json", "makara"),
    ("h:/Github/EyesOfAzrael/data/entities/creature/nagas.json", "nagas"),
    ("h:/Github/EyesOfAzrael/data/entities/deity/brahma.json", "brahma"),
    ("h:/Github/EyesOfAzrael/data/entities/item/bilva.json", "bilva"),
    ("h:/Github/EyesOfAzrael/data/entities/item/gandiva.json", "gandiva"),
    ("h:/Github/EyesOfAzrael/data/entities/item/lotus.json", "lotus"),
    ("h:/Github/EyesOfAzrael/data/entities/item/soma.json", "soma"),
    ("h:/Github/EyesOfAzrael/data/entities/item/sudarshana-chakra.json", "sudarshana-chakra"),
    ("h:/Github/EyesOfAzrael/data/entities/item/trishula.json", "trishula"),
    ("h:/Github/EyesOfAzrael/data/entities/item/tulsi.json", "tulsi"),
    ("h:/Github/EyesOfAzrael/data/entities/item/vajra.json", "vajra"),
    ("h:/Github/EyesOfAzrael/data/entities/magic/diwali.json", "diwali"),
    ("h:/Github/EyesOfAzrael/data/entities/place/kurukshetra.json", "kurukshetra"),
    ("h:/Github/EyesOfAzrael/data/entities/place/mount-kailash.json", "mount-kailash"),
    ("h:/Github/EyesOfAzrael/data/entities/place/mount-meru.json", "mount-meru"),
    ("h:/Github/EyesOfAzrael/data/entities/place/patala.json", "patala"),
    ("h:/Github/EyesOfAzrael/data/entities/place/river-ganges.json", "river-ganges"),
    ("h:/Github/EyesOfAzrael/data/entities/place/swarga.json", "swarga"),
    ("h:/Github/EyesOfAzrael/data/entities/place/vaikuntha.json", "vaikuntha"),
    ("h:/Github/EyesOfAzrael/data/entities/place/varanasi.json", "varanasi")
]

updated = 0
for fpath, eid in files:
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            entity = json.load(f)
        m = MD[eid]
        entity['linguistic'] = {
            "originalName": m['name'],
            "originalScript": "devanagari",
            "transliteration": entity.get('name'),
            "pronunciation": m['pron'],
            "etymology": {"rootLanguage": m['etym']['root'], "meaning": m['etym']['mean'], "derivation": m['etym']['deriv']},
            "cognates": m['cog'],
            "languageCode": "sa"
        }
        entity['geographical'] = {
            "region": "India",
            "culturalArea": "Indian Subcontinent",
            "originPoint": {
                "name": "Indian Subcontinent",
                "coordinates": {"latitude": m['lat'], "longitude": m['lon'], "accuracy": "approximate"}
            },
            "modernCountries": ["India", "Nepal", "Sri Lanka", "Bangladesh"]
        }
        yr = m['yr']
        entity['temporal'] = {
            "timelinePosition": m['tl'],
            "culturalPeriod": m['per'],
            "firstAttestation": {
                "date": {
                    "year": yr,
                    "circa": True,
                    "uncertainty": 200 if yr < 0 else 100,
                    "display": f"c. {abs(yr)} {'BCE' if yr < 0 else 'CE'}",
                    "confidence": "probable"
                },
                "source": m['src'],
                "type": "literary"
            },
            "historicalDate": {
                "start": {"year": yr, "circa": True, "uncertainty": 200, "display": f"c. {abs(yr)} {'BCE' if yr < 0 else 'CE'}"},
                "end": {"year": 2025, "circa": False, "display": "Present"},
                "display": f"c. {abs(yr)} {'BCE' if yr < 0 else 'CE'} - Present"
            }
        }
        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(entity, f, ensure_ascii=False, indent=2)
        print(f"[+] Updated: {eid}")
        updated += 1
    except Exception as e:
        print(f"[-] Error {eid}: {e}")

print(f"\n{'='*60}")
print(f"Completed: {updated}/{len(files)} Hindu entities")
print(f"Plus dharma.json already completed = {updated + 1} total")
print(f"{'='*60}")
