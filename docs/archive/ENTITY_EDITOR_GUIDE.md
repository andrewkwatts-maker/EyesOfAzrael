# Entity Editor Guide
**Eyes of Azrael - Universal Entity Creation & Editing System**

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Editor Modes](#editor-modes)
4. [Entity Types](#entity-types)
5. [Field Reference](#field-reference)
6. [Creating Entities](#creating-entities)
7. [Editing Entities](#editing-entities)
8. [Form Validation](#form-validation)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## Introduction

The Eyes of Azrael Entity Editor is a comprehensive tool for creating and editing mythology-related content. Whether you're documenting a Greek deity, a Norse hero, a Japanese creature, or proposing a comparative mythology theory, the editor provides a unified interface with type-specific fields.

### Key Features

- **Universal Interface**: Single editor for all 9 entity types
- **Type-Specific Fields**: Adaptive form that shows relevant fields based on entity type
- **Auto-Save**: Automatic draft saving every 30 seconds (when signed in)
- **Markdown Support**: Rich text formatting in description fields
- **Cross-References**: Link entities together (deities, heroes, items, etc.)
- **Validation**: Real-time field validation with helpful error messages
- **Preview Mode**: See how your entity will appear before publishing
- **Draft System**: Save work-in-progress without publishing
- **Review Workflow**: Submit entities for admin review before publication

---

## Getting Started

### Prerequisites

1. **User Account**: Sign in with Google to create or edit entities
2. **Browser Requirements**: Modern browser with JavaScript enabled
3. **Firebase Connection**: Ensure you have internet connectivity

### Accessing the Editor

**Create New Entity:**
- Navigate to `/edit.html` (shows type selector)
- Or use the guided wizard at `/create-wizard.html`

**Edit Existing Entity:**
- Click "Edit" button on any entity page
- Or navigate to `/edit.html?type=deity&id=zeus` (example)

---

## Editor Modes

### Create Mode

**URL**: `/edit.html` (no parameters)

- **Type Selection**: Choose from 9 entity types
- **Empty Form**: All fields start blank
- **Draft Saving**: Creates new document on first save
- **Submit**: Sends entity for admin review

### Edit Mode

**URL**: `/edit.html?type=deity&id=zeus` (example)

- **Pre-populated**: Loads existing entity data
- **Update Workflow**: Changes existing document
- **Immediate Publishing**: Updates go live (if you're the author)

### Wizard Mode

**URL**: `/create-wizard.html`

- **Step-by-Step**: 6-step guided process
- **Simplified Interface**: Focuses on essentials
- **Progress Indicator**: Visual feedback on completion
- **Best for Beginners**: Easier than full editor

---

## Entity Types

The editor supports 9 entity types, each with specialized fields:

### 1. Deity (⚡)
**Gods, goddesses, and divine beings**

Type-specific fields:
- Domains (war, wisdom, love, etc.)
- Symbols (lightning bolt, owl, etc.)
- Epithets & Titles
- Relationships (father, mother, spouse, etc.)
- Sacred animals/plants
- Archetypes

**Examples**: Zeus, Athena, Odin, Ra, Shiva

### 2. Hero (🗡️)
**Legendary heroes and protagonists**

Type-specific fields:
- Parentage (father, mother, divine heritage)
- Legendary Quests
- Abilities (superhuman strength, etc.)
- Weapons & Equipment (cross-references to items)

**Examples**: Heracles, Achilles, Sigurd, Rama

### 3. Creature (🐉)
**Mythical beasts and monsters**

Type-specific fields:
- Physical Description
- Abilities & Powers
- Weaknesses
- Defeated By (cross-references to heroes)

**Examples**: Minotaur, Jörmungandr, Garuda, Hydra

### 4. Item/Artifact (⚔️)
**Magical items and legendary artifacts**

Type-specific fields:
- Powers & Abilities
- Materials (gold, adamantine, etc.)
- Created By (cross-references to deities)
- Notable Wielders

**Examples**: Mjölnir, Excalibur, Vajra, Aegis

### 5. Place (🏛️)
**Sacred sites and mythological locations**

Type-specific fields:
- Coordinates (latitude/longitude for real locations)
- Inhabitants
- Major Events
- Map visualization data

**Examples**: Mount Olympus, Valhalla, Underworld, Delphi

### 6. Concept (💭)
**Abstract concepts and philosophical ideas**

Type-specific fields:
- Opposing Concepts (cross-references)
- Personifications (deities who embody the concept)

**Examples**: Fate, Chaos, Order, Justice

### 7. Magic System (🔮)
**Magical practices and systems**

Type-specific fields:
- Techniques & Methods
- Tools & Materials
- Safety Warnings

**Examples**: Kabbalah, Runes, Alchemy, Shamanism

### 8. Theory (🔬)
**Comparative mythology theories and analyses**

Type-specific fields:
- Intellectual Honesty Warning (required)
- Confidence Score (0-100%)
- Key Correlations
- Alternative Explanations

**Examples**: Sky Gods & Ancient Technology, Serpent Symbolism, Flood Myths

### 9. Mythology (📜)
**Complete mythological systems**

Type-specific fields:
- Creation Myth
- Cosmology
- Major Deities

**Examples**: Greek Mythology, Norse Mythology, Egyptian Mythology

---

## Field Reference

### Common Fields (All Entity Types)

#### **Name** (Required)
- **Description**: Primary display name in English
- **Max Length**: 100 characters
- **Example**: "Zeus", "Mjölnir", "Mount Olympus"

#### **Icon** (Optional)
- **Description**: Single emoji or unicode character
- **Max Length**: 10 characters
- **Example**: "⚡", "🗡️", "🏛️"

#### **Mythologies** (Required)
- **Description**: Which mythologies this entity appears in
- **Type**: Tag input (multiple allowed)
- **Minimum**: 1 required
- **Example**: ["greek", "roman"] for Zeus/Jupiter

#### **Short Description** (Optional)
- **Description**: One-sentence summary
- **Max Length**: 200 characters
- **Example**: "King of the Olympian gods, ruler of sky and thunder"

#### **Long Description** (Optional)
- **Description**: Full detailed description
- **Type**: Markdown-enabled textarea
- **Features**: Supports **bold**, *italic*, lists, paragraphs
- **Example**: Multi-paragraph description with formatting

#### **Tags** (Optional)
- **Description**: Searchable keywords
- **Type**: Tag input
- **Example**: ["thunder", "king", "olympian", "sky-god"]

### Advanced Metadata (Optional)

#### **Linguistic Information**

**Original Name**
- Name in original language/script
- Example: "Ζεύς" (Zeus in Greek)

**Pronunciation**
- IPA phonetic pronunciation
- Example: "/zju:s/"

**Etymology**
- Word origin and meaning
- Example: "From Proto-Indo-European *dyēus (sky, daylight)"

#### **Geographical Information**

**Region**
- General geographical area
- Example: "Mediterranean", "Scandinavia"

**Cultural Area**
- Specific cultural/religious geography
- Example: "Hellenistic World", "Viking Age Scandinavia"

**Primary Location**
- Specific coordinates (for places)
- Latitude/Longitude with accuracy level

#### **Temporal Information**

**Historical Period**
- When entity was prominent
- Example: "Classical Period", "Bronze Age"

**First Attestation**
- Earliest known reference
- Example: "c. 750 BCE - Homer's Iliad"

---

## Creating Entities

### Step-by-Step: Standard Editor

#### 1. Navigate to Editor
- Go to `/edit.html`
- Or click "Create Entity" from any page

#### 2. Select Entity Type
- Click on one of the 9 type cards
- Choose the category that best fits your content

#### 3. Fill in Basic Information
```
Name: Zeus
Icon: ⚡
Mythologies: [greek, roman]
Short Description: King of the Olympian gods, ruler of sky and thunder
```

#### 4. Add Full Description
Use Markdown for rich formatting:
```markdown
**Zeus** is the king of the Olympian gods in ancient Greek religion.

He is the god of:
- Sky and thunder
- Law and order
- Justice

Zeus wielded the thunderbolt as his weapon and was known for his many
romantic conquests.
```

#### 5. Complete Type-Specific Fields
For a deity:
```
Domains: [sky, thunder, justice, law, order]
Symbols: [lightning bolt, eagle, oak tree]
Epithets:
  - Cloud-Gatherer
  - Father of Gods and Men
  - Thunderer
```

#### 6. Add Cross-References
Link to related entities:
```
Related Deities: [hera, athena, apollo]
Related Items: [thunderbolt, aegis]
Related Places: [mount-olympus]
```

#### 7. Add Sources
```
Title: Theogony
Author: Hesiod
Type: Primary Source
Date: c. 700 BCE
```

#### 8. Save or Submit
- **Save Draft**: Keeps entity private, saves progress
- **Submit for Review**: Sends to admins for publication

### Step-by-Step: Wizard Mode

The wizard simplifies creation into 6 steps:

1. **Type Selection**: Choose entity type
2. **Basic Info**: Name, icon, primary mythology
3. **Description**: Short and long descriptions
4. **Type-Specific**: Specialized fields for chosen type
5. **Metadata**: Optional linguistic/geographical/temporal data
6. **Review**: Summary before submission

**Navigation:**
- Click "Next" to proceed
- Click "Previous" to go back
- Click "Submit for Review" on final step

---

## Editing Entities

### Edit Your Own Entities

1. Navigate to entity page (e.g., `/view.html?type=deity&id=zeus`)
2. Click "Edit This Entity" button
3. Make changes in the editor
4. Click "Update" to save changes

### Edit Workflow

- **Auto-Save**: Changes save every 30 seconds
- **Manual Save**: Click "Save Draft" anytime
- **Publish**: Click "Update" to publish changes
- **Cancel**: Click "Cancel" to discard changes

### Keyboard Shortcuts

- **Ctrl/Cmd + S**: Save draft
- **Ctrl/Cmd + Enter**: Submit/Update
- **Esc**: Cancel editing

---

## Form Validation

### Required Field Validation

Fields marked with **\*** are required:

- **Name**: Must not be empty
- **Mythologies**: At least one required
- **Intellectual Honesty Warning**: Required for theories

### Format Validation

- **Short Description**: Maximum 200 characters
- **Icon**: Maximum 10 characters
- **Coordinates**: Valid latitude (-90 to 90) and longitude (-180 to 180)
- **URLs**: Must be valid URLs

### Real-Time Validation

- **Character Counter**: Shows remaining characters for limited fields
- **Error Indicators**: Red border and error message for invalid fields
- **Success States**: Green indicators for valid fields

### Submission Validation

When you click "Submit", the editor validates:
1. All required fields are filled
2. All formats are correct
3. Type-specific requirements met

**Validation Errors:**
- Scroll to first error
- Red highlight on invalid field
- Error message below field

---

## Advanced Features

### Markdown Preview

Click "Toggle Preview" on description fields to see formatted output:

**Input:**
```markdown
**Zeus** is the *king* of the gods.

He rules over:
- Sky
- Thunder
- Justice
```

**Preview:**
> **Zeus** is the *king* of the gods.
>
> He rules over:
> - Sky
> - Thunder
> - Justice

### Cross-Reference Picker

**Search Feature:**
1. Type entity name in search box
2. Select from dropdown results
3. Chosen entities appear as tags
4. Remove by clicking ×

**Example:**
```
Search: "ath..."
Results:
  ⚡ Athena (deity)
  🏛️ Athens (place)

Selected: [Athena]
```

### Tag Input

**Adding Tags:**
1. Type tag name
2. Press Enter
3. Tag appears as chip
4. Auto-suggestions available

**Removing Tags:**
- Click × on tag chip

### Dynamic Lists

For fields like "Quests" or "Powers":

1. Click "➕ Add item"
2. Fill in text field
3. Click "×" to remove item

### Collapsible Sections

Advanced sections start collapsed:

- Click "▶" to expand
- Click "▼" to collapse
- Saves space for optional fields

### Live Preview Panel

Toggle preview to see entity card:

1. Click "👁️ Toggle Preview"
2. See how entity will display
3. Updates as you type

### Auto-Save Status

Bottom of page shows:
- "Auto-save enabled" - Feature active
- "Auto-saved at 3:45 PM" - Last save time
- "● Unsaved changes" - Header indicator

---

## Best Practices

### Content Quality

1. **Be Accurate**: Research thoroughly before creating entities
2. **Cite Sources**: Always add references for academic content
3. **Use Proper Names**: Use authentic spelling from source culture
4. **Add Context**: Explain significance, not just facts
5. **Link Entities**: Cross-reference related content

### Writing Style

1. **Clear & Concise**: Short description under 200 chars
2. **Comprehensive**: Long description with full details
3. **Neutral Tone**: Avoid personal opinions (except in theories)
4. **Proper Formatting**: Use Markdown for readability
5. **Organized**: Use headings and lists in long descriptions

### Markdown Guidelines

**Good:**
```markdown
**Zeus** is the king of the gods.

## Domains
Zeus rules over:
- Sky and thunder
- Law and order
- Justice

## Family
Zeus is the son of **Cronus** and **Rhea**.
```

**Avoid:**
```markdown
Zeus is the king of the gods. Zeus rules over sky and thunder and
law and order and justice. Zeus is the son of Cronus and Rhea.
```

### Cross-Referencing

**When to Link:**
- Family relationships (father, mother, spouse)
- Associated items (weapons, artifacts)
- Related places (temples, battlefields)
- Connected concepts (domains, archetypes)

**Example for Zeus:**
```
Related Deities: hera (spouse), athena (daughter), apollo (son)
Related Items: thunderbolt, aegis
Related Places: mount-olympus, dodona
Related Concepts: justice, order, kingship
```

### Metadata Completeness

**Minimum:**
- Name, type, mythology, short description

**Good:**
- + Long description, tags, sources

**Excellent:**
- + Cross-references, linguistic data, geographical context

**Exceptional:**
- + Historical attestation, etymologies, cultural significance

### Theory-Specific Best Practices

**Required Honesty:**
```
Intellectual Honesty Warning:
"This theory is speculative and connects mythological narratives
with scientific concepts. While the correlations are intriguing,
they should not be taken as historical or scientific fact without
further evidence."
```

**Confidence Scoring:**
- 0-25%: Highly speculative
- 26-50%: Possible but uncertain
- 51-75%: Probable with evidence
- 76-100%: Strong evidence

**Alternative Explanations:**
Always provide at least 2-3 alternative explanations:
```
Alternative Explanations:
- "Coincidental similarity in imagery across cultures"
- "Universal human psychological archetypes"
- "Cultural diffusion through trade routes"
```

---

## FAQ

### General Questions

**Q: Do I need an account to use the editor?**
A: Yes, you must sign in with Google to create or edit entities.

**Q: Are my edits published immediately?**
A: New entities go through admin review. Edits to your own entities publish immediately.

**Q: Can I edit someone else's entity?**
A: No, you can only edit entities you created. Suggest changes to admins.

**Q: What happens to my drafts?**
A: Drafts are saved privately in your account. Only you can see them until published.

**Q: Can I delete an entity?**
A: Contact admins to request deletion. Authors cannot delete published entities.

### Technical Questions

**Q: Why isn't auto-save working?**
A: Check that you're signed in and have internet connectivity.

**Q: The editor won't load. What should I do?**
A: Clear browser cache, check JavaScript is enabled, try different browser.

**Q: I lost my changes. Can I recover them?**
A: If auto-save was enabled, check for draft. Otherwise, changes may be lost.

**Q: Cross-reference search shows no results?**
A: The entity you're searching for may not exist yet. Create it first.

**Q: Can I export my entity as JSON?**
A: Not currently available in the UI. Contact admins for data export.

### Content Questions

**Q: What mythology should I choose for syncretized deities?**
A: List all mythologies (e.g., Zeus: ["greek", "roman"]).

**Q: How do I handle alternate names?**
A: Use "Epithets & Titles" for deities, or add to linguistic alternative names.

**Q: Should I create separate entities for different aspects?**
A: Usually no. Use cross-references and descriptions to explain aspects.

**Q: How detailed should descriptions be?**
A: Short description: 1 sentence. Long description: 2-5 paragraphs minimum.

**Q: Can I include modern interpretations?**
A: Yes, in theories. For deities/heroes, focus on traditional sources.

### Workflow Questions

**Q: How long does review take?**
A: Typically 1-3 days. Check email for approval notification.

**Q: Can I preview before submitting?**
A: Yes, use the preview panel or preview button.

**Q: What if my entity is rejected?**
A: Admins will provide feedback. Make changes and resubmit.

**Q: Can I work on multiple entities simultaneously?**
A: Yes, but each opens in a separate browser tab/window.

**Q: How do I know which fields are required?**
A: Required fields have a red asterisk (*) next to the label.

---

## Support

### Need Help?

- **Documentation**: Read this guide thoroughly
- **Examples**: View existing entities for reference
- **Contact**: Email admin@eyesofazrael.com
- **Community**: Join discussion forum (coming soon)

### Report Issues

Found a bug or have a suggestion?
- Email: bugs@eyesofazrael.com
- Include: Browser, OS, steps to reproduce

### Version History

**v1.0.0** - December 2025
- Initial release
- 9 entity types supported
- Auto-save functionality
- Cross-reference picker
- Markdown support
- Wizard mode

---

## Quick Reference Card

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save draft |
| Ctrl/Cmd + Enter | Submit/Update |
| Esc | Cancel |

### Required Fields by Type
| Type | Required Fields |
|------|----------------|
| All | Name, Mythologies |
| Theory | + Intellectual Honesty Warning |

### Markdown Syntax
| Format | Syntax |
|--------|--------|
| Bold | `**text**` |
| Italic | `*text*` |
| List | `- item` |
| Paragraph | Blank line between |

### Entity Type Icons
| Type | Icon | Use For |
|------|------|---------|
| Deity | ⚡ | Gods, goddesses |
| Hero | 🗡️ | Legendary heroes |
| Creature | 🐉 | Mythical beasts |
| Item | ⚔️ | Magical artifacts |
| Place | 🏛️ | Sacred locations |
| Concept | 💭 | Abstract ideas |
| Magic | 🔮 | Magical systems |
| Theory | 🔬 | Analytical theories |
| Mythology | 📜 | Complete systems |

---

**Happy Creating!**

*Eyes of Azrael - Illuminating the Patterns of World Mythology*
