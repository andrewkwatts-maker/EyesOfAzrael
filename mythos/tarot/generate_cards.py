#!/usr/bin/env python3
"""
Generate Tarot Major Arcana HTML files with primary sources and cross-links.
This script creates comprehensive tarot card pages following the codex search template.
"""

import os

# Card data structure
CARDS_DATA = [
    {
        "filename": "world.html",
        "number": "XXI",
        "title": "The World",
        "subtitle": "Cosmic Completion",
        "icon": "🌍",
        "letter": "Tau (ת)",
        "letter_meaning": "The Cross",
        "path": "Yesod to Malkuth (32nd Path)",
        "astro": "Saturn",
        "element": "Earth (crystallized)",
        "keywords": "Completion, integration, cosmic consciousness",
        "description": 'The dancer floats within a wreath of victory, surrounded by the four <a href="../creatures/kerubim.html" class="inline-search-link">Kerubic creatures</a>—<a href="../creatures/lion.html" class="inline-search-link">Lion</a>, <a href="../creatures/eagle.html" class="inline-search-link">Eagle</a>, <a href="../creatures/bull.html" class="inline-search-link">Bull</a>, and <a href="../creatures/angel.html" class="inline-search-link">Angel</a>. She has completed the <a href="fool.html" class="inline-search-link">Fool\'s Journey</a>, integrating all 21 preceding lessons. This is enlightenment, the union of all opposites, the cosmic dance.',
        "symbols": [
            ("Naked Dancer", "Truth unveiled, nothing hidden, complete authenticity"),
            ("Wreath/Mandorla", "Victory, wholeness, the cosmic egg, vesica piscis"),
            ("Two Wands", "Balance of opposites, creative power made manifest"),
            ("Four Kerubim", "Four elements mastered, four fixed signs of the zodiac"),
            ("Purple Drape", "Royalty, spiritual achievement, initiation complete"),
        ],
        "primary_sources": [
            {
                "citation": "Pictorial Key to the Tarot:Part II:The World",
                "text": 'The woman is in the act of dance within a laurel wreath. In the four corners are the four living creatures of Ezekiel and the Apocalypse. It represents the rapture of the soul in the conscious possession of its mission, the completion of the Great Work, and the realization of the Kingdom. This is the final triumph, the recognition of eternal life.',
                "source": "The Pictorial Key to the Tarot by Arthur Edward Waite (1911)"
            },
            {
                "citation": "Book of Thoth:Atu XXI:The Universe",
                "text": 'This card represents the completion of the Great Work in all its aspects. The dancer is Nuit, the infinite expanse of space. She is also the individual soul having attained unto the vision of the infinite. The serpent is the creative kundalini force that has risen to crown chakra. All is accomplished. The Universe is perfect.',
                "source": "The Book of Thoth by Aleister Crowley (1944)"
            },
            {
                "citation": "The Tarot:Part Two:Key 21",
                "text": 'Key 21, the World, represents Cosmic Consciousness—the final goal of human evolution. Saturn, the planet of limitation, here represents the crystallization of the entire cosmic process into perfect form. The dancer within the wreath is the perfected Self, having integrated all aspects of being into harmonious wholeness.',
                "source": "The Tarot: A Key to the Wisdom of the Ages by Paul Foster Case (1947)"
            },
        ],
        "upright": "Completion, achievement, cosmic consciousness, integration of all lessons, success, recognition, the fruition of all efforts, enlightenment. The World announces: \"You have arrived.\" The journey is complete, all elements are integrated, you dance in perfect balance within the cosmic mandala. This is the PhD after years of study, the masterpiece after decades of practice, the enlightenment after lifetimes of seeking.",
        "reversed": "Incomplete journey, lack of closure, seeking external validation, failure to integrate lessons, fragmentation. When reversed, the World indicates being stuck one step from completion, unable to take the final leap into integration. Or success achieved but hollow—the goal reached yet not satisfying because the journey was undertaken for wrong reasons.",
        "spiritual": 'The World represents the attainment of <a href="../../jewish/kabbalah/concepts/daath.html" class="inline-search-link">Knowledge</a> and the descent into <a href="../../jewish/kabbalah/sefirot/malkuth.html" class="inline-search-link">Malkuth</a> (Kingdom) fully conscious. Where the Fool began unconscious of his divine nature, the World-dancer knows herself as both human and divine. This is the mystic marriage completed, the alchemical Gold achieved, the Buddha-nature realized. The four Kerubim represent mastery of the four elements and four worlds. The dancer\'s nakedness shows truth without shame—nothing left to hide, nothing unrealized.',
        "mythology": [
            ("Shiva Nataraja (Hindu)", "The cosmic dancer whose dance sustains the universe"),
            ("Gaia/Terra (Greek/Roman)", "Earth herself, the world as living being"),
            ("Sophia (Gnostic)", "Divine wisdom descended and ascending"),
            ("Christ Pantocrator (Christian)", "All-ruler, completion of divine plan"),
            ("Ezekiel's Vision (Hebrew)", "The four living creatures and the throne"),
        ],
        "related_tarot": [
            ("fool.html", "The Fool (0)", "Beginning of journey"),
            ("magician.html", "The Magician (I)", "First manifestation"),
            ("judgement.html", "Judgement (XX)", "Call to awakening before completion"),
            ("../cosmology/malkuth.html", "Malkuth", "Kingdom sphere"),
        ],
        "related_other": [
            ("../../hindu/deities/shiva.html", "Shiva Nataraja", "Cosmic dancer"),
            ("../../greek/deities/gaia.html", "Gaia", "World/Earth goddess"),
            ("../../christian/concepts/incarnation.html", "Incarnation", "Spirit in matter"),
            ("../../jewish/kabbalah/sefirot/malkuth.html", "Malkuth", "The Kingdom realized"),
        ],
    },
    {
        "filename": "lovers.html",
        "number": "VI",
        "title": "The Lovers",
        "subtitle": "Sacred Union",
        "icon": "💑",
        "letter": "Zain (ז)",
        "letter_meaning": "The Sword",
        "path": "Binah to Tiferet (17th Path)",
        "astro": "Gemini",
        "element": "Air (intellectual choice)",
        "keywords": "Love, choice, union, duality, relationships",
        "description": 'A man and woman stand naked in Eden, blessed by the angel <a href="../cosmology/raphael.html" class="inline-search-link">Raphael</a> above. Behind the woman grows the Tree of Knowledge with the <a href="../creatures/serpent.html" class="inline-search-link">serpent</a>, behind the man the Tree of Life. This is the card of choices made from love, the union of opposites, and the moment Adam chose Eve over paradise—a choice that brought both suffering and consciousness.',
        "symbols": [
            ("Angel Raphael", "Divine blessing, healing presence, higher guidance"),
            ("Naked Couple", "Innocence, vulnerability, authentic relating"),
            ("Tree of Knowledge", "Conscious choice, the feminine principle"),
            ("Tree of Life", "Immortality, the masculine principle"),
            ("Serpent", "Wisdom through experience, kundalini, temptation"),
            ("Mountain", "Higher consciousness, aspiration, challenges"),
        ],
        "primary_sources": [
            {
                "citation": "Pictorial Key to the Tarot:Part II:The Lovers",
                "text": "The sun shines in the zenith, and beneath is a great winged figure with arms extended, pouring down influences. In the foreground are two human figures, male and female, unveiled before each other. This is a card of human love, which in the highest sense is the choice of truth in the heart, and the love of truth in the soul. It is the card of trails overcome gloriously.",
                "source": "The Pictorial Key to the Tarot by Arthur Edward Waite (1911)"
            },
            {
                "citation": "Book of Thoth:Atu VI:The Lovers",
                "text": "This card represents Gemini, the Twins, and shows the formula of opposites united by love under divine sanction. The central mystery is that of the Sacred Marriage (Hieros Gamos), wherein the King and Queen, Sun and Moon, Gold and Silver are conjoined. This is the alchemical operation of conjunction.",
                "source": "The Book of Thoth by Aleister Crowley (1944)"
            },
            {
                "citation": "The Tarot:Part Two:Key 6",
                "text": "The Lovers represents the function of discrimination—the power to distinguish, to choose. Gemini is the sign of duality, and here duality is resolved through right choice guided by higher consciousness (the angel). This is the intellect (Air) choosing love, the conscious decision to unite with the other.",
                "source": "The Tarot: A Key to the Wisdom of the Ages by Paul Foster Case (1947)"
            },
        ],
        "upright": "Love, union, relationships, choices, values alignment, harmony, attraction, partnership, sacred marriage. The Lovers announces a significant choice, usually in matters of the heart but also in values and loyalties. This is the choice to commit, to merge with another, to create partnership. It can also represent the integration of inner masculine and feminine.",
        "reversed": "Disharmony, misalignment, poor choices, separation, values conflict, lust without love. When reversed, the Lovers indicates choosing based on superficial attraction rather than deep compatibility, or being unable to choose, frozen between options. Sometimes indicates the breakdown of a relationship or choosing security over love.",
        "spiritual": 'The Lovers represents the path from <a href="../../jewish/kabbalah/sefirot/binah.html" class="inline-search-link">Binah</a> (Understanding, the Mother) to <a href="../../jewish/kabbalah/sefirot/tiferet.html" class="inline-search-link">Tiferet</a> (Beauty, the Heart). This is the descent of divine understanding into harmonious manifestation through conscious choice. The angel Raphael (healing) blesses the union. The Lovers teaches that consciousness arose through relationship—Adam alone in paradise was unconscious; only through choosing Eve and tasting the fruit of knowledge did humanity awaken.',
        "mythology": [
            ("Adam and Eve (Judeo-Christian)", "First couple, choice of consciousness over innocence"),
            ("Shiva and Shakti (Hindu)", "Divine masculine and feminine in eternal union"),
            ("Hieros Gamos (Greek)", "Sacred marriage of god and goddess"),
            ("Eros and Psyche (Greek)", "Love between divine and mortal"),
            ("Isis and Osiris (Egyptian)", "Divine couple, eternal devotion"),
        ],
        "related_tarot": [
            ("empress.html", "The Empress (III)", "Divine feminine"),
            ("emperor.html", "The Emperor (IV)", "Divine masculine"),
            ("temperance.html", "Temperance (XIV)", "Integration and harmony"),
            ("../magic/sacred-marriage.html", "Sacred Marriage", "Hieros Gamos"),
        ],
        "related_other": [
            ("../../hindu/concepts/shiva-shakti.html", "Shiva-Shakti", "Divine union"),
            ("../../greek/heroes/eros-psyche.html", "Eros and Psyche", "Love's trials"),
            ("../../egyptian/deities/isis.html", "Isis and Osiris", "Sacred partnership"),
        ],
    },
]

# HTML template
def generate_card_html(card_data):
    symbols_html = "\\n".join([
        f'                <li><strong>{symbol}:</strong> {meaning}</li>'
        for symbol, meaning in card_data['symbols']
    ])

    sources_html = "\\n\\n".join([
        f'''                    <div class="search-result-item">
                        <div class="citation" onclick="toggleVerse(this)">
                            {source['citation']}
                        </div>
                        <div class="verse-text">
                            {source['text']}
                        </div>
                        <div class="book-reference">
                            Source: {source['source']}
                        </div>
                    </div>'''
        for source in card_data['primary_sources']
    ])

    mythology_html = "\\n".join([
        f'                <li><strong>{fig}:</strong> {desc}</li>'
        for fig, desc in card_data['mythology']
    ])

    related_tarot_html = "\\n".join([
        f'                        <li><a href="{link}">{title}</a> - {desc}</li>'
        for link, title, desc in card_data['related_tarot']
    ])

    related_other_html = "\\n".join([
        f'                        <li><a href="{link}">{title}</a> - {desc}</li>'
        for link, title, desc in card_data['related_other']
    ])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{card_data['title']} ({card_data['number']}) - {card_data['subtitle']} - Tarot Major Arcana</title>
    <link rel="stylesheet" href="../../../../styles.css">
    <style>
        :root {{
            --mythos-primary: #9370DB;
            --mythos-secondary: #8A2BE2;
        }}

        .deity-header {{
            background: linear-gradient(135deg, var(--mythos-primary), var(--mythos-secondary));
            color: white;
            padding: 3rem 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
        }}

        .deity-icon {{ font-size: 4rem; margin-bottom: 1rem; }}

        .attribute-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }}

        .attribute-card {{
            background: rgba(147, 112, 219, 0.1);
            border: 1px solid rgba(147, 112, 219, 0.3);
            padding: 1rem;
            border-radius: 10px;
        }}

        .attribute-label {{
            color: var(--mythos-primary);
            font-weight: bold;
            font-size: 0.85rem;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }}

        .attribute-value {{ font-size: 1.1rem; }}

        .codex-search-section {{
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f9f9f9;
        }}

        .codex-search-header {{
            padding: 12px 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.3s ease;
        }}

        .codex-search-header:hover {{
            background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
        }}

        .codex-search-header h3 {{
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }}

        .expand-icon {{
            font-size: 20px;
            transition: transform 0.3s ease;
        }}

        .expanded .expand-icon {{
            transform: rotate(180deg);
        }}

        .codex-search-content {{
            display: none;
            padding: 15px;
            background: white;
            border-radius: 0 0 8px 8px;
        }}

        .codex-search-content.show {{
            display: block;
        }}

        .search-result-item {{
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #667eea;
            background: #f5f7ff;
        }}

        .citation {{
            font-weight: 600;
            color: #667eea;
            cursor: pointer;
            margin-bottom: 8px;
        }}

        .citation:hover {{
            color: #764ba2;
            text-decoration: underline;
        }}

        .verse-text {{
            display: none;
            margin-top: 8px;
            padding: 10px;
            background: white;
            border-left: 2px solid #764ba2;
            font-style: italic;
            color: #333;
        }}

        .verse-text.show {{
            display: block;
        }}

        .book-reference {{
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }}

        .inline-search-link {{
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px dashed #667eea;
            cursor: pointer;
            transition: all 0.2s ease;
        }}

        .inline-search-link:hover {{
            color: #764ba2;
            border-bottom-color: #764ba2;
        }}
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1>{card_data['icon']} {card_data['title']}</h1>
            <nav class="breadcrumb">
                <a href="../../../../mythos-index.html">Home</a> →
                <a href="../../index.html">Tarot/Hermetic</a> →
                <a href="index.html">Major Arcana</a> →
                <span>{card_data['title']}</span>
            </nav>
        </div>
    </header>

    <main>
        <section class="deity-header">
            <div class="deity-icon">{card_data['icon']}</div>
            <h2>{card_data['title']} - Card {card_data['number']}</h2>
            <p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">{card_data['subtitle']}</p>
            <p style="font-size: 1.1rem; margin-top: 1rem;">{card_data['description']}</p>
        </section>

        <section>
            <h2 style="color: var(--mythos-primary);">Attributes & Correspondences</h2>
            <div class="attribute-grid">
                <div class="attribute-card">
                    <div class="attribute-label">Number</div>
                    <div class="attribute-value">{card_data['number']}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Hebrew Letter</div>
                    <div class="attribute-value">{card_data['letter']} - {card_data['letter_meaning']}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Tree of Life Path</div>
                    <div class="attribute-value">{card_data['path']}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Astrological</div>
                    <div class="attribute-value">{card_data['astro']}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Element</div>
                    <div class="attribute-value">{card_data['element']}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Keywords</div>
                    <div class="attribute-value">{card_data['keywords']}</div>
                </div>
            </div>
        </section>

        <section style="margin-top: 2rem;">
            <h2 style="color: var(--mythos-primary);">Symbolism & Imagery</h2>

            <h3 style="color: var(--mythos-secondary); margin-top: 1.5rem;">Traditional Symbols:</h3>
            <ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
{symbols_html}
            </ul>

            <div class="codex-search-section">
                <div class="codex-search-header" onclick="toggleCodexSearch(this)">
                    <h3>📚 Primary Sources: {card_data['title']}</h3>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="codex-search-content">
{sources_html}
                </div>
            </div>
        </section>

        <section style="margin-top: 2rem;">
            <h2 style="color: var(--mythos-primary);">Meanings & Interpretations</h2>

            <h3 style="color: var(--mythos-secondary);">Upright Meaning</h3>
            <p>{card_data['upright']}</p>

            <h3 style="color: var(--mythos-secondary); margin-top: 1rem;">Reversed Meaning</h3>
            <p>{card_data['reversed']}</p>

            <h3 style="color: var(--mythos-secondary); margin-top: 1.5rem;">Spiritual Meaning</h3>
            <p>{card_data['spiritual']}</p>
        </section>

        <section style="margin-top: 2rem;">
            <h2 style="color: var(--mythos-primary);">Mythology & Archetypes</h2>

            <h3 style="color: var(--mythos-secondary);">Related Mythological Figures:</h3>
            <ul style="margin: 0.5rem 0 0 2rem; line-height: 1.8;">
{mythology_html}
            </ul>
        </section>

        <section class="related-concepts" style="margin-top: 3rem;">
            <h2>🔗 Related Concepts</h2>
            <div class="grid">
                <div class="related-card">
                    <h3>Within Tarot/Hermetic Tradition</h3>
                    <ul>
{related_tarot_html}
                    </ul>
                </div>

                <div class="related-card">
                    <h3>Similar Figures in Other Traditions</h3>
                    <ul>
{related_other_html}
                    </ul>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <p>
            <strong>{card_data['title']}</strong> - Tarot Major Arcana<br>
            <a href="../../../../mythos-index.html">World Mythos Home</a> |
            <a href="../../index.html">Tarot/Hermetic Tradition</a> |
            <a href="index.html">Browse All Major Arcana</a>
        </p>
    </footer>

    <script>
        function toggleCodexSearch(header) {{
            const section = header.parentElement;
            const content = section.querySelector('.codex-search-content');
            section.classList.toggle('expanded');
            content.classList.toggle('show');
        }}

        function toggleVerse(citation) {{
            const verseText = citation.nextElementSibling;
            verseText.classList.toggle('show');
        }}
    </script>
</body>
</html>'''

def main():
    """Generate all card HTML files"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    deities_dir = os.path.join(base_dir, 'deities')

    # Ensure directory exists
    os.makedirs(deities_dir, exist_ok=True)

    for card in CARDS_DATA:
        filepath = os.path.join(deities_dir, card['filename'])
        html_content = generate_card_html(card)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"Created: {filepath}")

    print(f"\\nGenerated {len(CARDS_DATA)} card files successfully!")

if __name__ == '__main__':
    main()
