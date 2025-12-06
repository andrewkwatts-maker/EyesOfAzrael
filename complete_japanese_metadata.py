#!/usr/bin/env python3
"""
Complete Japanese Mythology Entity Metadata v2.0
Adds: linguistic.cognates, linguistic.etymology, linguistic.originalScript,
      temporal.timelinePosition, and proper geographical.originPoint
"""

import json
import os

# Metadata templates for Japanese entities
JAPANESE_METADATA = {
    # CONCEPTS
    "harae": {
        "linguistic": {
            "originalName": "祓 (Harae)",
            "transliteration": "Harae",
            "originalScript": "漢字: 祓 (harae), 祓い (harai)",
            "etymology": "From Old Japanese 'hara-u' (to purify, to cleanse). The character 祓 combines 示 (altar/deity) + 犮 (to strike/remove), literally meaning 'to remove impurity from the divine presence.' Classical Japanese continued this usage in Shinto liturgy.",
            "cognates": {
                "classicalJapanese": "祓ふ (harafu) - to purify",
                "chinese": "祓除 (fúchú) - to exorcise, remove evil",
                "korean": "불 (bul) - fire purification (conceptual cognate)"
            }
        },
        "geographical": {
            "region": "Japan",
            "culturalArea": "East Asia",
            "originPoint": {
                "name": "Japanese archipelago (universal practice)",
                "coordinates": {
                    "latitude": 33.738,
                    "longitude": 131.735,
                    "accuracy": "regional"
                },
                "description": "Harae purification practices originated across ancient Japan. The prototype purification was Izanagi's misogi at Tachibana-no-Odo in Himuka (modern Kyushu region)."
            }
        },
        "temporal": {
            "firstAttestation": {
                "date": {
                    "year": 712,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "712 CE",
                    "confidence": "certain"
                },
                "type": "literary",
                "source": "Kojiki (712 CE)",
                "description": "First written attestation in the Kojiki, describing Izanagi's purification after escaping Yomi."
            },
            "timelinePosition": {
                "period": "Yayoi to Present",
                "era": "c. 300 BCE - Present",
                "description": "Harae purification practices likely emerged during the Yayoi period (300 BCE-300 CE) with animistic Shinto beliefs, codified during Kofun (300-538 CE) and Asuka periods (538-710 CE), continuing to present day."
            },
            "historicalDate": {
                "start": {
                    "year": -300,
                    "circa": True,
                    "uncertainty": 100,
                    "display": "c. 300 BCE"
                },
                "end": {
                    "year": 2025,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "Present"
                },
                "display": "c. 300 BCE - Present"
            }
        }
    },

    "kami": {
        "linguistic": {
            "originalName": "神 (Kami)",
            "transliteration": "Kami",
            "originalScript": "漢字: 神 (kami), かみ (hiragana)",
            "etymology": "From Old Japanese 'kami' (divine, sacred, above). The character 神 combines 示 (altar/divine manifestation) + 申 (spirit/lightning), representing divine spirits. Native Japanese word predating Chinese character adoption, written phonetically in Man'yōgana before kanji standardization.",
            "cognates": {
                "classicalJapanese": "かみ (kami) - deity, spirit",
                "chinese": "神 (shén) - spirit, god (character borrowed, not cognate)",
                "korean": "귀신 (gwisin) - spirit (conceptual parallel)"
            }
        },
        "geographical": {
            "region": "Japan",
            "culturalArea": "East Asia",
            "originPoint": {
                "name": "Takamagahara (mythical) / Japanese archipelago (practice)",
                "coordinates": {
                    "latitude": 35.6895,
                    "longitude": 139.6917,
                    "accuracy": "regional"
                },
                "description": "Kami beliefs originated across the Japanese archipelago during the Yayoi period, with major cult centers at Ise, Izumo, and sacred mountains nationwide."
            }
        },
        "temporal": {
            "firstAttestation": {
                "date": {
                    "year": 712,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "712 CE",
                    "confidence": "certain"
                },
                "type": "literary",
                "source": "Kojiki (712 CE)",
                "description": "First comprehensive written account of kami in the Kojiki. The word appears extensively in earlier Man'yōshū poetry."
            },
            "timelinePosition": {
                "period": "Yayoi to Present",
                "era": "c. 300 BCE - Present",
                "description": "Kami worship emerged in Yayoi period (300 BCE-300 CE), formalized during Kofun period (300-538 CE), systematized in Asuka/Nara periods (538-794 CE), continues to present."
            },
            "historicalDate": {
                "start": {
                    "year": -300,
                    "circa": True,
                    "uncertainty": 100,
                    "display": "c. 300 BCE"
                },
                "end": {
                    "year": 2025,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "Present"
                },
                "display": "c. 300 BCE - Present"
            }
        }
    },

    "kegare": {
        "linguistic": {
            "originalName": "穢れ / 汚れ (Kegare)",
            "transliteration": "Kegare",
            "originalScript": "漢字: 穢れ (kegare, ritual impurity), 汚れ (kegare, physical impurity)",
            "etymology": "From Old Japanese 'ke-gare' (気枯れ): 'ke' (vital energy/spirit) + 'gare/kare' (to wither, exhaust). Literally 'withering of life force.' Also written 穢 (defilement) or 汚 (dirt), reflecting both spiritual and physical pollution concepts.",
            "cognates": {
                "classicalJapanese": "けがる (kegaru) - to be defiled",
                "chinese": "穢 (huì) - filth, impurity",
                "korean": "더러움 (deoreoum) - impurity (conceptual parallel)"
            }
        },
        "geographical": {
            "region": "Japan",
            "culturalArea": "East Asia",
            "originPoint": {
                "name": "Yomi (mythical origin) / Japanese archipelago (practice)",
                "coordinates": {
                    "latitude": 35.3,
                    "longitude": 133.05,
                    "accuracy": "regional"
                },
                "description": "Kegare concept originated from the Yomi myth (Izanagi's pollution from the underworld). Yomotsu Hirasaka, the mythical boundary, is traditionally located near Matsue, Shimane Prefecture."
            }
        },
        "temporal": {
            "firstAttestation": {
                "date": {
                    "year": 712,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "712 CE",
                    "confidence": "certain"
                },
                "type": "literary",
                "source": "Kojiki (712 CE)",
                "description": "First written attestation describing Izanagi's pollution from Yomi and subsequent purification."
            },
            "timelinePosition": {
                "period": "Yayoi to Present",
                "era": "c. 300 BCE - Present",
                "description": "Kegare concepts emerged with early Shinto in Yayoi period, formalized during Kofun period, codified in Asuka/Nara periods with ritual law (ritsuryō), continue in modified form today."
            },
            "historicalDate": {
                "start": {
                    "year": -300,
                    "circa": True,
                    "uncertainty": 100,
                    "display": "c. 300 BCE"
                },
                "end": {
                    "year": 2025,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "Present"
                },
                "display": "c. 300 BCE - Present"
            }
        }
    },

    "ki-qi": {
        "linguistic": {
            "originalName": "気 (Ki)",
            "transliteration": "Ki",
            "originalScript": "漢字: 気 (ki), 氣 (traditional form)",
            "etymology": "Chinese loanword from 'qì' (氣). Original Chinese character shows rice (米) + vapor (气), representing vital vapors. Adopted into Japanese via classical Chinese texts. The concept merged with native Japanese animistic beliefs about vital force (tama, musubi).",
            "cognates": {
                "classicalJapanese": "いき (iki) - breath, life",
                "chinese": "氣/气 (qì) - vital energy, breath",
                "korean": "기 (gi) - vital energy (from Chinese)"
            }
        },
        "geographical": {
            "region": "Japan (via China)",
            "culturalArea": "East Asia",
            "originPoint": {
                "name": "Imported from China, integrated into Japanese thought",
                "coordinates": {
                    "latitude": 34.6937,
                    "longitude": 135.5023,
                    "accuracy": "regional"
                },
                "description": "Ki concept entered Japan from China during Asuka period (538-710 CE) through Buddhist and Daoist texts, centered in Nara/Kyoto cultural zone. Merged with native concepts of tama (soul) and musubi (creative power)."
            }
        },
        "temporal": {
            "firstAttestation": {
                "date": {
                    "year": 600,
                    "circa": True,
                    "uncertainty": 50,
                    "display": "c. 600 CE",
                    "confidence": "probable"
                },
                "type": "literary",
                "source": "Early Buddhist and medical texts",
                "description": "Ki appears in early Japanese Buddhist texts and medical writings from Asuka period, borrowed from Chinese sources."
            },
            "timelinePosition": {
                "period": "Asuka to Present",
                "era": "c. 600 CE - Present",
                "description": "Ki concept imported during Asuka period (538-710 CE) through Chinese Buddhist and Daoist texts, integrated into Japanese martial arts, medicine, and philosophy during Heian period and beyond."
            },
            "historicalDate": {
                "start": {
                    "year": 600,
                    "circa": True,
                    "uncertainty": 50,
                    "display": "c. 600 CE"
                },
                "end": {
                    "year": 2025,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "Present"
                },
                "display": "c. 600 CE - Present"
            }
        }
    },

    "musubi": {
        "linguistic": {
            "originalName": "産霊 / 結び (Musubi)",
            "transliteration": "Musubi",
            "originalScript": "漢字: 産霊 (musu-bi, creative spirit), 結び (musu-bi, tying/binding)",
            "etymology": "From Old Japanese 'musu' (生す, to generate, produce) + 'bi/hi' (霊, spiritual power). The combination means 'generative spiritual power.' Written as 産霊 (birth-spirit) in divine names or 結び (tying) emphasizing connection. Native Japanese concept predating kanji.",
            "cognates": {
                "classicalJapanese": "むすぶ (musubu) - to tie, to bear fruit",
                "chinese": "結 (jié) - to tie (character only, not cognate)",
                "korean": "묶다 (mukda) - to tie (conceptual parallel)"
            }
        },
        "geographical": {
            "region": "Japan",
            "culturalArea": "East Asia",
            "originPoint": {
                "name": "Takamagahara (mythical) / Izumo region (cult center)",
                "coordinates": {
                    "latitude": 35.4,
                    "longitude": 132.75,
                    "accuracy": "regional"
                },
                "description": "Musubi theology particularly strong in Izumo tradition, home of Okuninushi (deity of en-musubi, binding fates). Izumo Taisha is primary shrine for musubi worship."
            }
        },
        "temporal": {
            "firstAttestation": {
                "date": {
                    "year": 712,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "712 CE",
                    "confidence": "certain"
                },
                "type": "literary",
                "source": "Kojiki (712 CE)",
                "description": "First written attestation in Kojiki, where Takamimusubi and Kamimusubi appear as primordial creation deities."
            },
            "timelinePosition": {
                "period": "Yayoi to Present",
                "era": "c. 300 BCE - Present",
                "description": "Musubi concepts rooted in Yayoi agricultural religion (rice cultivation, fertility), formalized in Kofun period mythology, recorded in Asuka/Nara periods, continue in marriage and relationship rituals today."
            },
            "historicalDate": {
                "start": {
                    "year": -300,
                    "circa": True,
                    "uncertainty": 100,
                    "display": "c. 300 BCE"
                },
                "end": {
                    "year": 2025,
                    "circa": False,
                    "uncertainty": 0,
                    "display": "Present"
                },
                "display": "c. 300 BCE - Present"
            }
        }
    }
}

def update_entity(entity_path, metadata):
    """Update a single entity file with complete metadata"""
    with open(entity_path, 'r', encoding='utf-8') as f:
        entity = json.load(f)

    # Update linguistic
    entity['linguistic'] = metadata['linguistic']

    # Update geographical
    entity['geographical'] = metadata['geographical']

    # Update temporal
    entity['temporal'] = metadata['temporal']

    # Write back
    with open(entity_path, 'w', encoding='utf-8') as f:
        json.dump(entity, f, ensure_ascii=False, indent=2)

    print(f"✓ Updated {os.path.basename(entity_path)}")

def main():
    base_path = "h:/Github/EyesOfAzrael/data/entities/concept"

    for entity_id, metadata in JAPANESE_METADATA.items():
        entity_path = os.path.join(base_path, f"{entity_id}.json")
        if os.path.exists(entity_path):
            update_entity(entity_path, metadata)
        else:
            print(f"✗ Not found: {entity_path}")

    print("\n✓ Concept entities metadata update complete!")

if __name__ == "__main__":
    main()
