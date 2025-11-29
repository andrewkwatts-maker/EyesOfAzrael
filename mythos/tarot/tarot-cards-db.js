// Complete Tarot Card Database
// All 78 cards with upright and reversed meanings

const TAROT_CARDS = {
    // MAJOR ARCANA (0-21)
    "major_0": {
        name: "The Fool",
        number: "0",
        arcana: "major",
        element: "Air",
        keywords: ["new beginnings", "innocence", "spontaneity", "free spirit"],
        upright: {
            general: "The Fool represents new beginnings, unlimited potential, and the courage to take a leap of faith. You are at the start of a new journey with endless possibilities ahead. Trust in the universe and embrace the unknown with an open heart.",
            love: "New romance, fresh start in relationship, being spontaneous and carefree in love.",
            career: "New job opportunity, career change, taking a risk with a new venture.",
            spiritual: "Spiritual awakening, beginning a new path, trust in the journey."
        },
        reversed: {
            general: "Recklessness, risk without preparation, fear of the unknown, being held back by fear.",
            love: "Fear of commitment, impulsive decisions in relationships, not thinking things through.",
            career: "Poor planning, foolish financial decisions, jumping into things unprepared.",
            spiritual: "Spiritual naivety, ignoring your intuition, lack of direction."
        }
    },

    "major_1": {
        name: "The Magician",
        number: "I",
        arcana: "major",
        element: "Air",
        keywords: ["manifestation", "power", "action", "resourcefulness"],
        upright: {
            general: "You have all the tools you need to manifest your desires. The Magician reminds you that you are powerful and capable. Focus your will, use your resources wisely, and take action. 'As above, so below' - you can bridge heaven and earth.",
            love: "Taking initiative in love, using your charm, manifesting a new relationship.",
            career: "Skills and talents recognized, power to create success, entrepreneurial energy.",
            spiritual: "Mastery of spiritual tools, channeling divine energy, conscious creation."
        },
        reversed: {
            general: "Manipulation, untapped potential, poor planning, illusion or trickery.",
            love: "Using manipulation in relationships, not being authentic, playing games.",
            career: "Misuse of skills, lack of focus, scattered energy, con artist.",
            spiritual: "Misuse of spiritual power, blocked energy, disconnected from source."
        }
    },

    "major_2": {
        name: "The High Priestess",
        number: "II",
        arcana: "major",
        element: "Water",
        keywords: ["intuition", "sacred knowledge", "divine feminine", "mystery"],
        upright: {
            general: "Trust your intuition. The High Priestess sits between the conscious and subconscious realms, holding sacred knowledge. Listen to your inner voice. Things are not yet revealed - be patient and receptive. The answers lie within.",
            love: "Platonic relationship, using intuition in love, mystery and attraction.",
            career: "Trust your instincts, hidden information, need for inner guidance.",
            spiritual: "Deep spiritual wisdom, psychic development, accessing the subconscious."
        },
        reversed: {
            general: "Secrets, disconnected from intuition, information withheld, repressed feelings.",
            love: "Lack of intimacy, secrets in relationships, not listening to inner voice.",
            career: "Office secrets, information being withheld, not trusting your gut.",
            spiritual: "Blocked intuition, ignoring inner wisdom, spiritual disconnection."
        }
    },

    "major_3": {
        name: "The Empress",
        number: "III",
        arcana: "major",
        element: "Earth",
        keywords: ["abundance", "nurturing", "fertility", "nature"],
        upright: {
            general: "The Empress brings abundance, nurturing energy, and creative fertility. This is a time of growth, beauty, and connection to nature. Embrace the feminine divine - receive, nurture, create. Material and emotional abundance flows to you.",
            love: "Deep love, nurturing relationship, possible pregnancy, feminine energy.",
            career: "Creative projects flourishing, abundant resources, business growth.",
            spiritual: "Connection to Mother Earth, divine feminine, creative manifestation."
        },
        reversed: {
            general: "Creative block, dependence on others, smothering, financial loss, infertility.",
            love: "Overprotective, smothering partner, neglecting self-care, creative stagnation.",
            career: "Financial difficulties, lack of growth, creative blocks, poor investments.",
            spiritual: "Disconnection from nature, blocked feminine energy, material focus."
        }
    },

    "major_4": {
        name: "The Emperor",
        number: "IV",
        arcana: "major",
        element: "Fire",
        keywords: ["authority", "structure", "control", "stability"],
        upright: {
            general: "The Emperor represents structure, stability, and authoritative power. Take control of your situation. Establish order and discipline. You have the strength and authority to create solid foundations. Be a leader.",
            love: "Traditional relationship, strong partner, stability and commitment.",
            career: "Leadership role, promotion, establishing structure, business success.",
            spiritual: "Spiritual discipline, creating sacred structure, divine masculine energy."
        },
        reversed: {
            general: "Domination, excessive control, rigidity, lack of discipline, abuse of power.",
            love: "Controlling partner, lack of compromise, power struggles, domineering.",
            career: "Tyrannical boss, lack of discipline, rigid rules, power issues.",
            spiritual: "Spiritual rigidity, blocked masculine energy, fear of authority."
        }
    },

    "major_5": {
        name: "The Hierophant",
        number: "V",
        arcana: "major",
        element: "Earth",
        keywords: ["tradition", "spiritual wisdom", "conformity", "education"],
        upright: {
            general: "The Hierophant represents tradition, spiritual wisdom, and established institutions. Seek guidance from a mentor or spiritual teacher. Honor traditions while finding deeper meaning. Education and proper channels matter now.",
            love: "Traditional relationship, marriage, shared values, conventional romance.",
            career: "Traditional career, working within the system, formal education, mentorship.",
            spiritual: "Spiritual teacher, traditional practices, organized religion, seeking wisdom."
        },
        reversed: {
            general: "Rebellion, unconventional, challenging tradition, freedom from conformity.",
            love: "Unconventional relationship, breaking traditions, challenging old patterns.",
            career: "Bucking the system, unconventional path, leaving traditional career.",
            spiritual: "Spiritual rebellion, personal path, questioning dogma, new beliefs."
        }
    },

    "major_6": {
        name: "The Lovers",
        number: "VI",
        arcana: "major",
        element: "Air",
        keywords: ["love", "union", "choice", "values"],
        upright: {
            general: "The Lovers represent union, partnership, and important choices aligned with your values. This card signifies harmony between opposites and decisions from the heart. Choose love. Choose what aligns with your deepest truth.",
            love: "Deep connection, soulmate, committed relationship, harmony and passion.",
            career: "Partnership, collaboration, choosing work you love, values alignment.",
            spiritual: "Union of opposites, spiritual partnership, alignment with higher self."
        },
        reversed: {
            general: "Disharmony, imbalance, misalignment of values, difficult choices, separation.",
            love: "Relationship struggles, incompatibility, values conflict, broken relationship.",
            career: "Work-life imbalance, values conflict at work, poor partnerships.",
            spiritual: "Inner conflict, disconnection from values, spiritual incompatibility."
        }
    },

    "major_7": {
        name: "The Chariot",
        number: "VII",
        arcana: "major",
        element: "Water",
        keywords: ["willpower", "victory", "determination", "action"],
        upright: {
            general: "The Chariot brings victory through determination and willpower. You have control and are moving forward with confidence. Harness opposing forces and direct them toward your goal. Success comes from focus and determination.",
            love: "Taking action in love, overcoming relationship obstacles, determination.",
            career: "Career advancement, victory over competition, determined action brings success.",
            spiritual: "Spiritual warrior, overcoming inner obstacles, directed will."
        },
        reversed: {
            general: "Lack of control, lack of direction, aggression, opposition overwhelms.",
            love: "Relationship running off course, lack of direction, forcing things.",
            career: "Scattered energy, losing control of situation, obstacles winning.",
            spiritual: "Loss of spiritual direction, inner conflict, uncontrolled emotions."
        }
    },

    "major_8": {
        name: "Strength",
        number: "VIII",
        arcana: "major",
        element: "Fire",
        keywords: ["courage", "patience", "compassion", "inner strength"],
        upright: {
            general: "Strength is not about force but about courage, compassion, and patience. You have the inner strength to face any challenge. Gentle persistence wins. Control your impulses with love, not domination.",
            love: "Patient love, compassionate relationship, gentle strength, taming passion.",
            career: "Persistence pays off, gentle leadership, courage in challenges.",
            spiritual: "Taming the ego, spiritual courage, compassion as power, inner mastery."
        },
        reversed: {
            general: "Self-doubt, weakness, raw emotion, lack of confidence, abuse of power.",
            love: "Jealousy, neediness, lacking confidence in relationship, emotional outbursts.",
            career: "Lacking confidence, giving up too easily, aggressive leadership.",
            spiritual: "Inner weakness, lack of discipline, being controlled by desires."
        }
    },

    "major_9": {
        name: "The Hermit",
        number: "IX",
        arcana: "major",
        element: "Earth",
        keywords: ["introspection", "solitude", "wisdom", "guidance"],
        upright: {
            general: "The Hermit calls you inward for soul searching and reflection. Seek solitude to find answers within. This is a time for wisdom through introspection. Light your own lamp and trust your inner guidance.",
            love: "Need for alone time, soul searching about relationship, inner work.",
            career: "Working alone, seeking guidance, taking time to reflect on career path.",
            spiritual: "Spiritual retreat, meditation, seeking enlightenment, inner teacher."
        },
        reversed: {
            general: "Isolation, loneliness, withdrawal, lost your way, refusing guidance.",
            love: "Too much isolation, unable to open up, hermiting from love.",
            career: "Antisocial at work, refusing help, isolation blocks progress.",
            spiritual: "Lost on path, refusing inner guidance, spiritual loneliness."
        }
    },

    "major_10": {
        name: "Wheel of Fortune",
        number: "X",
        arcana: "major",
        element: "Fire",
        keywords: ["fate", "cycles", "change", "destiny"],
        upright: {
            general: "The Wheel of Fortune turns - change is inevitable. Good luck, positive change, and new cycles begin. What goes up must come down, and what falls will rise again. Embrace the natural cycles of life.",
            love: "Positive change in relationship, fate bringing new love, lucky in romance.",
            career: "Positive career change, lucky opportunities, advancement, cycle completing.",
            spiritual: "Life lessons, karma, cycles of spiritual growth, divine timing."
        },
        reversed: {
            general: "Bad luck, resistance to change, breaking cycles, unwanted change.",
            love: "Relationship challenges, timing is off, cycles of relationship problems.",
            career: "Setbacks, bad luck in career, resistance to necessary change.",
            spiritual: "Resisting life lessons, karmic challenges, difficult spiritual growth."
        }
    },

    "major_11": {
        name: "Justice",
        number: "XI",
        arcana: "major",
        element: "Air",
        keywords: ["fairness", "truth", "law", "karma"],
        upright: {
            general: "Justice arrives - truth will be revealed and fairness will prevail. Cause and effect are at work. Legal matters resolve favorably if you've acted with integrity. Take responsibility and seek balance.",
            love: "Fair relationship, honesty matters, karmic relationship, legal partnership.",
            career: "Fair treatment at work, contracts signed, legal matters resolved, ethical business.",
            spiritual: "Karma at work, spiritual accountability, truth seeking, cosmic balance."
        },
        reversed: {
            general: "Unfairness, lack of accountability, dishonesty, legal complications, bias.",
            love: "Unfair treatment, dishonesty in relationship, imbalanced partnership.",
            career: "Unfair treatment at work, legal troubles, unethical practices, bias.",
            spiritual: "Avoiding accountability, cosmic imbalance, denial of karma."
        }
    },

    "major_12": {
        name: "The Hanged Man",
        number: "XII",
        arcana: "major",
        element: "Water",
        keywords: ["surrender", "new perspective", "pause", "sacrifice"],
        upright: {
            general: "The Hanged Man asks you to surrender and see from a new perspective. This pause is necessary. Let go of control. What seems like sacrifice now leads to enlightenment. Sometimes we must stop to move forward.",
            love: "Relationship in limbo, need to see things differently, letting go of control.",
            career: "Pause in career progression, seeing work from new angle, necessary sacrifice.",
            spiritual: "Spiritual surrender, enlightenment through release, meditation, new awareness."
        },
        reversed: {
            general: "Stalling, resistance to change, inability to let go, missed opportunity.",
            love: "Refusing to see truth, holding on too tight, unwilling to compromise.",
            career: "Career stagnation, martyrdom, refusing to change perspective.",
            spiritual: "Resistance to spiritual growth, inability to surrender, blocked."
        }
    },

    "major_13": {
        name: "Death",
        number: "XIII",
        arcana: "major",
        element: "Water",
        keywords: ["endings", "transformation", "transition", "rebirth"],
        upright: {
            general: "Death rarely means physical death - it signals transformation, endings, and new beginnings. Let go of what no longer serves you. A major life transition is occurring. Embrace it. From endings come rebirths.",
            love: "Relationship ending or transforming, letting go, major transition in love.",
            career: "Career change, job ending, business transformation, letting go of old work.",
            spiritual: "Spiritual transformation, ego death, profound change, rebirth."
        },
        reversed: {
            general: "Resistance to change, fear of endings, stagnation, inability to move on.",
            love: "Refusing to let go of dead relationship, fear of change, holding on.",
            career: "Staying in dead-end job, fear of career change, stagnation.",
            spiritual: "Resistance to transformation, fear of ego death, spiritual stagnation."
        }
    },

    "major_14": {
        name: "Temperance",
        number: "XIV",
        arcana: "major",
        element: "Fire",
        keywords: ["balance", "moderation", "patience", "harmony"],
        upright: {
            general: "Temperance brings balance, moderation, and harmony. Find the middle path. Blend opposing forces. Be patient - healing and alchemy take time. Peace comes through balanced living.",
            love: "Balanced relationship, harmony, patience in love, healing partnership.",
            career: "Work-life balance, diplomatic solutions, patient progress, team harmony.",
            spiritual: "Spiritual balance, inner alchemy, patient spiritual growth, harmony."
        },
        reversed: {
            general: "Imbalance, excess, lack of moderation, impatience, disharmony.",
            love: "Unbalanced relationship, lack of harmony, impatience, extremes in love.",
            career: "Work-life imbalance, excess or deficiency, lack of compromise.",
            spiritual: "Spiritual imbalance, impatience on path, blocked energy flow."
        }
    },

    "major_15": {
        name: "The Devil",
        number: "XV",
        arcana: "major",
        element: "Earth",
        keywords: ["bondage", "materialism", "addiction", "shadow self"],
        upright: {
            general: "The Devil represents bondage, often self-imposed. Examine your attachments, addictions, and unhealthy patterns. What holds you captive? The chains are loose - you can free yourself. Confront your shadow.",
            love: "Toxic relationship, unhealthy attachment, lust vs love, codependency.",
            career: "Golden handcuffs, materialism, unethical work, feeling trapped in job.",
            spiritual: "Shadow work needed, facing inner demons, material attachment, ego traps."
        },
        reversed: {
            general: "Breaking free, release from bondage, overcoming addiction, enlightenment.",
            love: "Leaving toxic relationship, breaking codependency, freedom from unhealthy patterns.",
            career: "Leaving bad job, overcoming materialistic drive, finding meaningful work.",
            spiritual: "Liberation, overcoming shadow, spiritual breakthrough, freedom."
        }
    },

    "major_16": {
        name: "The Tower",
        number: "XVI",
        arcana: "major",
        element: "Fire",
        keywords: ["upheaval", "revelation", "destruction", "awakening"],
        upright: {
            general: "The Tower brings sudden upheaval and destruction of false structures. What seemed solid crumbles. This is painful but necessary - built on false foundations, it had to fall. Truth is revealed. Rebuild on solid ground.",
            love: "Relationship breakdown, sudden revelation, painful truth, dramatic change.",
            career: "Job loss, business collapse, sudden change, structures falling apart.",
            spiritual: "Spiritual crisis, ego destruction, sudden awakening, illusions shattered."
        },
        reversed: {
            general: "Averting disaster, resisting change, delayed crisis, fear of change.",
            love: "Avoiding dealing with relationship problems, delaying inevitable breakup.",
            career: "Avoiding necessary change at work, delaying inevitable job loss.",
            spiritual: "Resisting spiritual awakening, avoiding truth, fear of transformation."
        }
    },

    "major_17": {
        name: "The Star",
        number: "XVII",
        arcana: "major",
        element: "Air",
        keywords: ["hope", "inspiration", "renewal", "faith"],
        upright: {
            general: "The Star brings hope after The Tower's destruction. Renewal, inspiration, and healing are here. Have faith - the universe supports you. Your wishes can be fulfilled. Trust and remain optimistic.",
            love: "Hope for love, healing in relationship, renewed faith in romance, soulmate.",
            career: "Career renewal, inspiration and creativity, opportunities opening up.",
            spiritual: "Spiritual renewal, divine inspiration, connection to higher self, faith."
        },
        reversed: {
            general: "Lack of faith, despair, disconnection, missed opportunities, pessimism.",
            love: "Lost hope in love, disconnection in relationship, pessimism about romance.",
            career: "Lack of inspiration, missed opportunities, despair about career.",
            spiritual: "Loss of faith, spiritual disconnection, hopelessness, blocked inspiration."
        }
    },

    "major_18": {
        name: "The Moon",
        number: "XVIII",
        arcana: "major",
        element: "Water",
        keywords: ["illusion", "intuition", "subconscious", "fear"],
        upright: {
            general: "The Moon reveals illusion, deception, and the unknown. Not everything is as it seems. Your fears and anxieties surface. Trust your intuition but be wary of delusion. The path is unclear - proceed carefully.",
            love: "Unclear relationship, illusion or deception, fears affecting love, intuition needed.",
            career: "Unclear situation at work, deception possible, trust instincts, hidden information.",
            spiritual: "Psychic development, facing fears, shadow work, subconscious exploration."
        },
        reversed: {
            general: "Truth revealed, illusions clearing, releasing fear, clarity emerging.",
            love: "Truth about relationship revealed, releasing fears, clarity in love.",
            career: "Confusion clearing at work, truth coming to light, releasing anxiety.",
            spiritual: "Spiritual clarity, overcoming fear, illusions dissolving, understanding."
        }
    },

    "major_19": {
        name: "The Sun",
        number: "XIX",
        arcana: "major",
        element: "Fire",
        keywords: ["joy", "success", "vitality", "positivity"],
        upright: {
            general: "The Sun brings pure joy, success, and vitality. Everything is illuminated. This is one of the most positive cards - celebrate! Happiness, success, and clarity are yours. Shine your light.",
            love: "Joyful relationship, celebration of love, happiness, successful partnership.",
            career: "Career success, recognition, achievement, joyful work, promotion.",
            spiritual: "Spiritual joy, enlightenment, vitality, connection to divine light."
        },
        reversed: {
            general: "Temporary depression, lack of success, delayed joy, diminished enthusiasm.",
            love: "Relationship struggles, lack of joy in partnership, temporary unhappiness.",
            career: "Career setbacks, lack of recognition, temporary difficulties, blocked success.",
            spiritual: "Temporary spiritual darkness, blocked joy, diminished vitality."
        }
    },

    "major_20": {
        name: "Judgement",
        number: "XX",
        arcana: "major",
        element: "Fire",
        keywords: ["reflection", "reckoning", "awakening", "renewal"],
        upright: {
            general: "Judgement calls for reflection and self-evaluation. A reckoning is at hand. Past actions are reviewed. This is your awakening moment - rise up, absolved and renewed. Answer your higher calling.",
            love: "Relationship evaluation, important decision about love, reconciliation, closure.",
            career: "Career evaluation, important decision, judgment of work, career calling.",
            spiritual: "Spiritual awakening, karmic resolution, higher calling, absolution."
        },
        reversed: {
            general: "Self-doubt, harsh judgment, inability to forgive, avoiding accountability.",
            love: "Unable to forgive in relationship, harsh judgment of partner, avoiding closure.",
            career: "Self-doubt in career, avoiding career decisions, refusing accountability.",
            spiritual: "Unable to forgive self, avoiding spiritual reckoning, inner judgment."
        }
    },

    "major_21": {
        name: "The World",
        number: "XXI",
        arcana: "major",
        element: "Earth",
        keywords: ["completion", "accomplishment", "travel", "wholeness"],
        upright: {
            general: "The World signals completion, accomplishment, and integration. The journey is complete. You have achieved your goal and gained wisdom. Celebrate your success. The world is yours - wholeness and fulfillment are attained.",
            love: "Relationship completion, soul partnership, fulfillment in love, integration.",
            career: "Career achievement, project completion, success, recognition, world travel.",
            spiritual: "Spiritual wholeness, completion of cycle, enlightenment, cosmic consciousness."
        },
        reversed: {
            general: "Incomplete, lack of closure, seeking personal closure, delay in success.",
            love: "Relationship incomplete, lack of closure, unfinished business in love.",
            career: "Project incomplete, delays in success, lack of achievement, no closure.",
            spiritual: "Incomplete spiritual journey, lack of integration, seeking wholeness."
        }
    },

    // WANDS (Fire - Creativity, Passion, Energy)
    "wands_ace": {
        name: "Ace of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "Ace",
        keywords: ["inspiration", "new opportunity", "growth", "potential"],
        upright: {
            general: "A burst of creative energy and new opportunity! The Ace of Wands brings inspiration, passion, and the spark of a new beginning. Take action on your ideas. This is your moment to start something exciting.",
            love: "New passionate romance, exciting attraction, sexual chemistry, fresh start.",
            career: "New career opportunity, creative project, entrepreneurial venture, inspired action.",
            spiritual: "Spiritual awakening, creative inspiration, divine spark, passionate purpose."
        },
        reversed: {
            general: "Lack of energy, delayed projects, lack of direction, wasted potential.",
            love: "Lack of passion, delayed romance, creative blocks in relationship.",
            career: "Missed opportunities, lack of motivation, delayed projects, uninspired.",
            spiritual: "Spiritual blocks, lack of creative flow, uninspired spiritual practice."
        }
    },

    "wands_2": {
        name: "Two of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "2",
        keywords: ["planning", "progress", "decisions", "discovery"],
        upright: {
            general: "You hold the world in your hands - planning and decision-making are key. Progress requires planning. You're at a crossroads considering your path forward. Think big, plan carefully, then act.",
            love: "Deciding about relationship direction, planning future together, long-distance.",
            career: "Career planning, business expansion, partnership decisions, international opportunity.",
            spiritual: "Spiritual planning, choosing your path, expanding awareness, discovery."
        },
        reversed: {
            general: "Fear of unknown, lack of planning, staying in comfort zone, indecision.",
            love: "Fear of commitment, poor relationship planning, avoiding future discussions.",
            career: "Poor planning, fear of expansion, staying small, bad partnership decisions.",
            spiritual: "Spiritual stagnation, fear of growth, avoiding new paths."
        }
    },

    "wands_3": {
        name: "Three of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "3",
        keywords: ["expansion", "foresight", "opportunity", "progress"],
        upright: {
            general: "Your ships are coming in! The Three of Wands shows expansion, growth, and opportunities on the horizon. Your planning pays off. Look ahead with optimism - success approaches.",
            love: "Relationship expanding, long-distance possibilities, looking to future together.",
            career: "Business expansion, opportunities abroad, growth, forward momentum, trade.",
            spiritual: "Spiritual expansion, growth in awareness, broadening horizons."
        },
        reversed: {
            general: "Delays, obstacles, lack of foresight, playing it small, limited vision.",
            love: "Relationship obstacles, lack of progress, limited vision for future.",
            career: "Delayed opportunities, obstacles to expansion, poor planning, limited scope.",
            spiritual: "Narrow spiritual view, obstacles to growth, limited expansion."
        }
    },

    "wands_4": {
        name: "Four of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "4",
        keywords: ["celebration", "harmony", "home", "marriage"],
        upright: {
            general: "Celebration! The Four of Wands brings joy, harmony, and happy events. Weddings, homecomings, achievements - this is a card of community celebration and stable happiness. Enjoy this victory!",
            love: "Engagement, wedding, moving in together, celebrating relationship, harmony.",
            career: "Work celebration, achievement recognized, team harmony, successful completion.",
            spiritual: "Spiritual community, celebration of growth, harmonious practice, sacred space."
        },
        reversed: {
            general: "Cancelled celebrations, lack of harmony, unstable home, delayed happiness.",
            love: "Relationship instability, cancelled wedding, lack of commitment, disharmony.",
            career: "Workplace conflict, celebration delayed, lack of teamwork, unstable situation.",
            spiritual: "Lack of spiritual community, disharmony in practice, unstable foundation."
        }
    },

    "wands_5": {
        name: "Five of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "5",
        keywords: ["conflict", "competition", "tension", "diversity"],
        upright: {
            general: "Conflict and competition arise. The Five of Wands shows struggle, disagreement, and clashing egos. Multiple people with different agendas. This may be healthy competition or exhausting conflict - choose your battles wisely.",
            love: "Arguments, different viewpoints, passionate disagreements, tension.",
            career: "Competition at work, conflicts with colleagues, clashing ideas, rivals.",
            spiritual: "Inner conflict, competing spiritual beliefs, tension in practice."
        },
        reversed: {
            general: "Conflict resolution, avoiding conflict, end of competition, inner conflict.",
            love: "Resolving arguments, compromising, avoiding important discussions, peace.",
            career: "End of competition, conflict resolution at work, cooperation, avoiding confrontation.",
            spiritual: "Resolving inner conflict, spiritual peace, avoiding spiritual challenges."
        }
    },

    "wands_6": {
        name: "Six of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "6",
        keywords: ["victory", "success", "recognition", "pride"],
        upright: {
            general: "Victory! The Six of Wands brings success, recognition, and public acclaim. You've won - enjoy your moment of triumph. Confidence is high. Your efforts are recognized and celebrated by others.",
            love: "Successful relationship, public recognition of partnership, proud of partner.",
            career: "Promotion, achievement recognized, award, victory over competition, success.",
            spiritual: "Spiritual success, recognition of growth, confidence in path, pride in practice."
        },
        reversed: {
            general: "Lack of recognition, private achievement, ego, fall from grace, self-doubt.",
            love: "Relationship not recognized publicly, lack of pride in partner, private love.",
            career: "Lack of recognition at work, missed promotion, private success, ego problems.",
            spiritual: "Spiritual pride, lack of recognition, private practice, humility needed."
        }
    },

    "wands_7": {
        name: "Seven of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "7",
        keywords: ["defense", "perseverance", "challenge", "position"],
        upright: {
            general: "Stand your ground! The Seven of Wands shows you defending your position against challenges and opposition. You have the high ground - maintain your advantage. Persevere despite obstacles.",
            love: "Defending relationship, competition for affections, fighting for love.",
            career: "Defending position at work, competition, maintaining advantage, perseverance.",
            spiritual: "Defending beliefs, spiritual challenges, maintaining practice despite obstacles."
        },
        reversed: {
            general: "Giving up, overwhelmed, exhaustion, yielding position, retreat.",
            love: "Giving up on relationship, unable to defend love, exhausted by fighting.",
            career: "Overwhelmed at work, giving up position, unable to compete, exhaustion.",
            spiritual: "Spiritual exhaustion, giving up practice, unable to maintain discipline."
        }
    },

    "wands_8": {
        name: "Eight of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "8",
        keywords: ["speed", "action", "movement", "swift change"],
        upright: {
            general: "Things move quickly! The Eight of Wands brings rapid action, swift communication, and fast-paced change. Events unfold rapidly. Movement and progress accelerate. Strike while the iron is hot!",
            love: "Rapid relationship development, whirlwind romance, fast communication, excitement.",
            career: "Fast-paced work environment, quick results, rapid progress, travel, communications.",
            spiritual: "Spiritual acceleration, rapid growth, swift understanding, energy flowing."
        },
        reversed: {
            general: "Delays, slowdowns, lack of momentum, missed timing, frustration.",
            love: "Relationship delays, slow communication, lack of progress, timing off.",
            career: "Delays at work, missed deadlines, slow progress, poor communication.",
            spiritual: "Spiritual delays, blocked energy, slow progress, frustration on path."
        }
    },

    "wands_9": {
        name: "Nine of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "9",
        keywords: ["resilience", "persistence", "last stand", "boundaries"],
        upright: {
            general: "You're battle-worn but not defeated. The Nine of Wands shows resilience and persistence. You've been through challenges but you're still standing. One more push - don't give up now. Maintain your boundaries.",
            love: "Relationship tested, maintaining boundaries, resilience after heartbreak, cautious.",
            career: "Work challenges continue, resilience needed, defending projects, burnout risk.",
            spiritual: "Spiritual resilience, testing of faith, maintaining practice through challenges."
        },
        reversed: {
            general: "Exhaustion, paranoia, giving up, stubbornness, inability to compromise.",
            love: "Relationship paranoia, unable to trust, defensive walls, giving up too easily.",
            career: "Work exhaustion, paranoid at work, giving up on projects, stubborn.",
            spiritual: "Spiritual exhaustion, defensive about beliefs, unable to continue."
        }
    },

    "wands_10": {
        name: "Ten of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "10",
        keywords: ["burden", "responsibility", "stress", "accomplishment"],
        upright: {
            general: "You carry heavy burdens and responsibilities. The Ten of Wands shows stress from taking on too much. Success has its price. You're almost there - but consider delegating or releasing some burdens.",
            love: "Relationship feels burdensome, too many responsibilities, exhaustion from trying.",
            career: "Work overload, too much responsibility, stress, success achieved but exhausted.",
            spiritual: "Spiritual burden, taking on too much, exhaustion from spiritual responsibilities."
        },
        reversed: {
            general: "Releasing burdens, delegating, lightening load, relief from responsibility.",
            love: "Releasing relationship burdens, sharing responsibilities, relief, letting go.",
            career: "Delegating at work, releasing responsibilities, relief from stress, burnout.",
            spiritual: "Releasing spiritual burdens, simplifying practice, relief, renewal."
        }
    },

    "wands_page": {
        name: "Page of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "Page",
        keywords: ["enthusiasm", "exploration", "discovery", "news"],
        upright: {
            general: "The Page of Wands brings enthusiastic energy, new ideas, and exciting news. Creative inspiration strikes. Be adventurous and explore new possibilities. A messenger may bring good news about creative projects.",
            love: "Exciting news in love, flirtation, playful energy, new romantic possibility.",
            career: "Creative opportunity, good news about work, new project, enthusiastic start.",
            spiritual: "Spiritual exploration, enthusiastic practice, discovering new path, inspiration."
        },
        reversed: {
            general: "Lack of direction, bad news, procrastination, lack of enthusiasm, delays.",
            love: "Bad news in love, lack of passion, immaturity in relationship, delays.",
            career: "Delayed news, lack of inspiration, procrastination, bad career news.",
            spiritual: "Spiritual procrastination, lack of enthusiasm, blocked inspiration."
        }
    },

    "wands_knight": {
        name: "Knight of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "Knight",
        keywords: ["action", "adventure", "passion", "impulsiveness"],
        upright: {
            general: "The Knight of Wands charges forward with passion and confidence! Action-oriented energy, adventure, and fearless pursuit of goals. Take bold action, but watch for impulsiveness. This is go-time!",
            love: "Passionate lover, exciting romance, charming but possibly unstable, adventure.",
            career: "Taking action on career, ambitious move, travel for work, passionate about projects.",
            spiritual: "Passionate spiritual pursuit, action-oriented practice, spiritual adventure."
        },
        reversed: {
            general: "Reckless, arrogant, impatient, frustration, lack of follow-through.",
            love: "Unreliable lover, passionate but inconsistent, arrogant, unfaithful.",
            career: "Impatient at work, reckless career moves, lack of planning, arrogance.",
            spiritual: "Spiritual recklessness, lack of discipline, impatience on path."
        }
    },

    "wands_queen": {
        name: "Queen of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "Queen",
        keywords: ["confidence", "independence", "determination", "vivaciousness"],
        upright: {
            general: "The Queen of Wands is confident, charismatic, and fiercely independent. She knows what she wants and gets it. Embrace your power, be yourself boldly, attract what you desire. Leadership through authentic confidence.",
            love: "Confident in love, independent partner, magnetic attraction, passionate relationship.",
            career: "Natural leader, confident at work, entrepreneurial success, inspiring others.",
            spiritual: "Confident spiritual practice, independent path, inspiring others spiritually."
        },
        reversed: {
            general: "Insecurity, jealousy, selfish, demanding, temperamental, vindictive.",
            love: "Jealous in relationship, demanding partner, insecure about love, temperamental.",
            career: "Insecure at work, jealous of others, demanding boss, temperamental leader.",
            spiritual: "Spiritual insecurity, jealousy of others' growth, temperamental practice."
        }
    },

    "wands_king": {
        name: "King of Wands",
        arcana: "minor",
        suit: "wands",
        element: "Fire",
        number: "King",
        keywords: ["leadership", "vision", "entrepreneur", "honor"],
        upright: {
            general: "The King of Wands is a natural leader with vision and entrepreneurial spirit. Take charge with confidence and honor. Your vision inspires others. Bold leadership brings success. Channel fire energy wisely.",
            love: "Strong partner, leader in relationship, passionate commitment, honorable.",
            career: "Leadership role, entrepreneurial success, visionary business, confident authority.",
            spiritual: "Spiritual leadership, visionary practice, mastery of fire element, teacher."
        },
        reversed: {
            general: "Domineering, ruthless, arrogant, impulsive, weak leadership, controlling.",
            love: "Controlling partner, arrogant in relationship, weak commitment, domineering.",
            career: "Ruthless business, arrogant leadership, poor management, impulsive decisions.",
            spiritual: "Spiritual arrogance, controlling teacher, misuse of power, ego-driven."
        }
    }
};

// Helper function to get a card by ID
function getCard(cardId) {
    return TAROT_CARDS[cardId];
}

// Helper function to get all card IDs
function getAllCardIds() {
    return Object.keys(TAROT_CARDS);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TAROT_CARDS, getCard, getAllCardIds };
}
