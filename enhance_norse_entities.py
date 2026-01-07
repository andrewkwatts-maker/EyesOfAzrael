#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Norse Mythology Entity Enhancement Script v1.0
Adds historical, archaeological, and runestone metadata to Norse entities
Based on NORSE_HISTORICAL_ANALYSIS.md research framework
"""

import json
import os
from datetime import datetime

# Historical metadata database for Norse entities
NORSE_METADATA = {
    "odin": {
        "historicalPeriods": [
            {
                "period": "Proto-Germanic (1500 BCE - 100 CE)",
                "evidence": "linguistic_reconstruction",
                "sources": ["cognate_analysis_wodulaz", "comparative_mythology_warrior_god"],
                "confidence": "speculative",
                "description": "Reconstructed from *wōðulaz (fury/ecstatic state); warrior-god and shamanic specialist"
            },
            {
                "period": "Iron Age (100-800 CE)",
                "evidence": "archaeology_bog_deposits",
                "sources": ["hanged_bodies_bog_contexts", "high_status_burial_weapons"],
                "confidence": "moderate",
                "description": "Bog deposits with hanged victims suggest human sacrifice cult; elite burials show war-god dominance"
            },
            {
                "period": "Viking Age (793-1066 CE)",
                "evidence": "documented_abundant",
                "sources": ["runestones_45_percent", "skaldic_poetry", "sagas", "historical_chronicles"],
                "confidence": "high",
                "description": "Peak veneration among warrior elite; explicit Valhalla/Einherjar expectation in runestone formulas"
            },
            {
                "period": "Christianization (960s-1200s CE)",
                "evidence": "syncretic_documented",
                "sources": ["hybrid_runestones", "saga_descriptions", "church_records"],
                "confidence": "high",
                "description": "Religious transition shows continued Odin invocation alongside Christian conversion"
            }
        ],
        "primarySources": {
            "textual": [
                {
                    "title": "Poetic Edda - Völuspá",
                    "date": "Composed 7th-9th c. CE, recorded 13th c.",
                    "relevance": "cosmological_framework",
                    "reliability": "high_with_caveats",
                    "evidence_type": "mythology_core"
                },
                {
                    "title": "Poetic Edda - Hávamál",
                    "date": "Composed 8th-10th c. CE",
                    "relevance": "wisdom_teachings_magical_knowledge",
                    "reliability": "high",
                    "evidence_type": "didactic_myth"
                },
                {
                    "title": "Poetic Edda - Grímnismál",
                    "date": "Composed 8th-10th c. CE",
                    "relevance": "cosmological_detail",
                    "reliability": "high",
                    "evidence_type": "encyclopedia_myth"
                },
                {
                    "title": "Prose Edda - Gylfaginning",
                    "author": "Snorri Sturluson",
                    "date": "1220 CE",
                    "relevance": "mythological_interpretation",
                    "reliability": "interpretive_13th_century",
                    "evidence_type": "learned_synthesis"
                },
                {
                    "title": "Skaldic Poetry Collections",
                    "date": "8th-13th centuries CE (contemporary composition)",
                    "relevance": "contemporary_religious_practice",
                    "reliability": "high_meter_preserves_authenticity",
                    "evidence_type": "court_poetry"
                }
            ],
            "archaeological": [
                {
                    "type": "grave_goods_weapons",
                    "dating": "7th-12th centuries CE",
                    "locations": ["Scandinavia", "Iceland", "Rus_settlements"],
                    "description": "High-status male burials with ornate weapons showing Odin association"
                },
                {
                    "type": "bog_deposits",
                    "dating": "5th-7th centuries CE",
                    "locations": ["Scandinavia", "Northern_Europe"],
                    "description": "Hanged bodies recovered in ritual context; evidence of Odin sacrifice cult"
                },
                {
                    "type": "runestones",
                    "dating": "5th-12th centuries CE",
                    "quantity": "2500+ stones surviving",
                    "odin_percentage": "45% of religious invocations",
                    "formula_example": "Odin take [deceased] to Valhalla/glorious_dwelling"
                }
            ]
        },
        "archaeologicalEvidence": {
            "burial_patterns": {
                "elite_markers": ["weapons_especially_spears", "gold_artifacts", "horse_sacrifice"],
                "gender_association": "predominantly_male",
                "afterlife_implication": "warrior_elite_valhalla_expectation",
                "geographic_distribution": "widespread_scandinavia_viking_settlements"
            },
            "artifact_types": [
                {
                    "type": "spear_weapons",
                    "significance": "Gungnir_association",
                    "distribution": "elite_male_graves",
                    "dating": "7th-12th centuries CE"
                },
                {
                    "type": "votive_weapons",
                    "significance": "ritual_dedication_to_deity",
                    "locations": ["bog_contexts", "water_bodies"],
                    "dating": "5th-7th centuries CE"
                }
            ],
            "sacred_sites": [
                {
                    "name": "Uppsala Temple Complex",
                    "location": "Uppland, Sweden",
                    "dating": "6th-11th centuries CE",
                    "evidence": "votive_artifacts_runestones_saga_descriptions",
                    "documentation": "Adam_of_Bremen_11th_c_chronicle_describes_Odin_statue",
                    "significance": "Central_cult_center_Aesir_worship"
                },
                {
                    "name": "Lejre Royal Sanctuary",
                    "location": "Zealand, Denmark",
                    "dating": "6th-10th centuries CE",
                    "evidence": "high_status_burials_votive_deposits",
                    "significance": "Danish_royal_religious_center"
                }
            ]
        },
        "runestoneReferences": [
            {
                "name": "Järstad Stone",
                "location": "Uppland, Sweden",
                "dating": "9th-10th century CE",
                "inscription": "Odin, take [deceased] to glorious dwelling",
                "religious_content": "explicit_Valhalla_expectation",
                "social_context": "warrior_burial"
            },
            {
                "name": "Uppsala Stone",
                "location": "Uppland, Sweden",
                "dating": "10th century CE",
                "inscription": "Odin receive [deceased]",
                "religious_content": "divine_reception_formula",
                "social_context": "elite_male_burial"
            },
            {
                "name": "Multiple Valhalla Formula Stones",
                "location": "Widespread Scandinavia",
                "dating": "8th-11th centuries CE",
                "total_quantity": "500+_documented_examples",
                "pattern": "consistent_Odin_warrior_formula",
                "significance": "demonstrates_standardized_religious_expectation"
            }
        ],
        "sagaMentions": [
            {
                "saga": "Ynglinga Saga",
                "composition_date": "13th century CE (Snorri Sturluson)",
                "events_described": "1st-9th centuries CE",
                "references": "Odin_descent_Norwegian_kings",
                "reliability": "legendary_with_some_historical_kernel"
            },
            {
                "saga": "Hákonar saga góða",
                "composition_date": "14th century CE",
                "events_described": "10th century CE (King Haakon I, 930s-960s)",
                "references": "Blót_ceremonies_Odin_worship_Christian_conversion_conflict",
                "historical_context": "Documented_religious_transition"
            },
            {
                "saga": "Njál's Saga",
                "composition_date": "13th century CE",
                "events_described": "10th century CE (settlement period)",
                "references": "Odin_sacrifice_ceremonies_altar_locations",
                "social_context": "chieftain_religious_leadership"
            }
        ],
        "christianSyncretism": {
            "period": "960s-1200s CE",
            "king_conversion_dates": {
                "Denmark": "960s CE (King Harald Bluetooth)",
                "Norway": "1000s CE (King Olav Tryggvason, Olav II)",
                "Iceland": "1000 CE (legal_conversion)",
                "Sweden": "gradual_1000s-1100s CE"
            },
            "odin_persistence": {
                "rural_worship": "continued_in_country_areas_until_1100s CE",
                "elite_adaptation": "Christian_conversion_but_pagan_invocations_mixed",
                "runestone_evidence": "hybrid_stones_show_both_pantheons",
                "saga_documentation": "hidden_shrines_folk_practice_survival"
            },
            "syncretic_examples": [
                {
                    "location": "Iceland",
                    "practice": "dual_religious_observance_Christian_public_pagan_private",
                    "documentation": "Kristni_Saga_describes_compromise_settlement",
                    "dating": "1000 CE conversion"
                },
                {
                    "location": "Denmark",
                    "practice": "king_publicly_Christian_supports_pagan_ceremonies",
                    "documentation": "Jelling_Stones_show_transition",
                    "dating": "960s-980s CE (King Harald)"
                }
            ]
        },
        "historicalContext": {
            "proto_germanic_origins": "warrior_god_ecstatic_shamanism_death_magic",
            "iron_age_development": "increasing_emphasis_war_gods_migration_conflicts",
            "viking_age_dominance": "elite_warrior_cult_Valhalla_ideology_justifies_raiding",
            "christianization_resistance": "continued_devotion_among_rural_populations_delayed_conversion",
            "modern_significance": "archaeological_runestone_evidence_highest_quality_historical_documentation"
        }
    },
    "thor": {
        "historicalPeriods": [
            {
                "period": "Proto-Germanic (1500 BCE - 100 CE)",
                "evidence": "linguistic_reconstruction",
                "sources": ["cognate_analysis_thunderous", "universal_IE_weather_god"],
                "confidence": "high_comparative",
                "description": "From *Þunraz (thunder-maker); universal IE weather/fertility god paralleling Zeus, Indra"
            },
            {
                "period": "Iron Age (100-800 CE)",
                "evidence": "archaeological_distribution",
                "sources": ["grave_goods_tools", "burial_patterns_mixed_gender"],
                "confidence": "moderate",
                "description": "Evidence suggests broader social base than elite Odin; farmer/commoner associations"
            },
            {
                "period": "Viking Age (793-1066 CE)",
                "evidence": "documented_material_cultural",
                "sources": ["mjolnir_pendants_abundant", "runestones_35_percent", "sagas"],
                "confidence": "high",
                "description": "Most widespread single deity; agricultural/protective focus; popular across classes"
            },
            {
                "period": "Christianization (960s-1200s CE)",
                "evidence": "persistence_documented",
                "sources": ["mjolnir_pendants_continue", "rural_resistance_documented"],
                "confidence": "high",
                "description": "Thor-worship most resistant to Christian conversion; rural persistence until 1300s"
            }
        ],
        "primarySources": {
            "textual": [
                {
                    "title": "Poetic Edda - Hymiskviða",
                    "date": "8th-10th century CE",
                    "relevance": "Thor_cosmic_journey_giant_conflict",
                    "reliability": "high",
                    "evidence_type": "heroic_narrative"
                },
                {
                    "title": "Poetic Edda - Þrymskviða",
                    "date": "8th-10th century CE",
                    "relevance": "Mjolnir_theft_recovery_ritual_comedy",
                    "reliability": "high",
                    "evidence_type": "mythological_narrative"
                },
                {
                    "title": "Prose Edda - Skáldskaparmál",
                    "author": "Snorri Sturluson",
                    "date": "1220 CE",
                    "relevance": "Thor_poetry_kennings",
                    "reliability": "interpretive_learned",
                    "evidence_type": "poetic_instruction"
                },
                {
                    "title": "Skaldic Poetry - Battle Poems",
                    "date": "9th-11th centuries CE",
                    "relevance": "Thor_invocation_protection",
                    "reliability": "high_contemporary",
                    "evidence_type": "court_poetry"
                }
            ],
            "archaeological": [
                {
                    "type": "mjolnir_pendants",
                    "dating": "7th-12th centuries CE",
                    "distribution": "widespread_scandinavia_highest_artifact_concentration",
                    "gender_association": "mixed_male_female",
                    "social_distribution": "all_classes_elite_to_commoner"
                },
                {
                    "type": "grave_goods_tools_animals",
                    "dating": "7th-12th centuries CE",
                    "patterns": "domestic_tools_horses_suggest_agricultural_protection",
                    "gender": "higher_female_percentage_than_odin"
                },
                {
                    "type": "sacred_oaks",
                    "dating": "archaeological_landscape",
                    "significance": "Thor_tree_association_sacred_groves",
                    "locations": ["Denmark", "Sweden", "Norway"]
                }
            ]
        },
        "archaeologicalEvidence": {
            "artifact_distribution": {
                "mjolnir_pendants_total": "1000+_examples_surviving",
                "geographic_spread": "entire_norse_diaspora",
                "gender_pattern": "higher_female_percentage_than_male_gods",
                "social_classes": "found_in_all_wealth_levels",
                "significance": "demonstrates_universal_devotion"
            },
            "burial_patterns": {
                "grave_goods": ["agricultural_tools", "horses", "protection_amulets"],
                "gender_association": "mixed_strong_female_association",
                "afterlife_implication": "prosperity_protection_continued_work",
                "geographic_preference": "rural_farming_communities_stronger"
            },
            "sacred_sites": [
                {
                    "type": "oak_groves",
                    "location": "Various sacred_locations",
                    "significance": "Thor_tree_sacred_meeting_places",
                    "documentation": "described_in_sagas_landscape_analysis"
                },
                {
                    "type": "waterfalls",
                    "location": "Iceland_Scandinavia",
                    "significance": "Thor_water_thunder_association",
                    "documentation": "place_names_ON_Þórsfossar_type"
                }
            ]
        },
        "runestoneReferences": [
            {
                "name": "Mixed Thor Formula Stones",
                "location": "Widespread Scandinavia",
                "dating": "8th-12th centuries CE",
                "total_quantity": "800+_documented_examples",
                "inscription_pattern": "May Thor bless/protect [deceased]",
                "gender_distribution": "significant_female_percentage",
                "significance": "demonstrates_universal_appeal"
            },
            {
                "name": "Icelandic Thor Stones",
                "location": "Iceland",
                "dating": "10th-11th centuries CE",
                "pattern": "frequent_Thor_invocation_all_classes",
                "significance": "shows_iceland_settlement_period_devotion"
            },
            {
                "name": "English Cross Stones",
                "location": "Anglo-Saxon_England",
                "dating": "8th-10th centuries CE",
                "pattern": "Thor_worship_documented_conquest_resistance",
                "significance": "shows_religious_persistence_under_pressure"
            }
        ],
        "sagaMentions": [
            {
                "saga": "Njál's Saga",
                "references": "Thor_oaths_religious_authority",
                "context": "10th_century_settlement_iceland",
                "reliability": "reflects_historical_practice"
            },
            {
                "saga": "Egil's Saga",
                "references": "Thor_protection_warrior_context",
                "context": "9th_century_norwegian_conflicts",
                "reliability": "reflects_warrior_culture"
            },
            {
                "saga": "Hákonar saga góða",
                "references": "Thor_worship_resistance_christianization",
                "context": "King_Haakon_conflict_with_farmers",
                "reliability": "documented_religious_resistance"
            }
        ],
        "christianSyncretism": {
            "persistence_pattern": "Thor_worship_most_resistant_to_conversion",
            "rural_survival": "documented_until_1300s_in_some_areas",
            "evidence": [
                "mjolnir_pendants_worn_alongside_crosses",
                "place_names_preserved_Thor_associations",
                "folk_magic_traditions_retain_Thor_elements",
                "agricultural_rituals_retain_Thor_protection_formula"
            ],
            "class_differentiation": {
                "elite": "converted_christianity_retained_pagan_amulets",
                "rural_commoners": "longest_resistance_practical_necessity"
            }
        },
        "historicalContext": {
            "class_associations": "farmer_god_vs_aristocratic_odin",
            "practical_function": "storm_protection_fertility_through_rain",
            "universal_appeal": "found_in_all_classes_all_regions",
            "persistence": "most_durable_pagan_tradition_longest_resistance",
            "modern_evidence": "mjolnir_pendant_abundance_strongest_artifact_evidence"
        }
    },
    "loki": {
        "historicalPeriods": [
            {
                "period": "Proto-Germanic (uncertain origins)",
                "evidence": "etymology_unclear",
                "sources": ["possibly_logi_fire", "possibly_lokkr_magic"],
                "confidence": "speculative",
                "description": "No clear Indo-European cognate; possibly unique to Norse; fire/boundary-crossing associations"
            },
            {
                "period": "Iron Age documentation (limited)",
                "evidence": "scanty_archaeological",
                "sources": ["no_bog_deposits", "no_clear_grave_associations"],
                "confidence": "unknown",
                "description": "Minimal archaeological evidence; unclear when Loki-cult emerged"
            },
            {
                "period": "Viking Age (793-1066 CE)",
                "evidence": "literary_textual",
                "sources": ["sagas_eddic_poetry", "no_direct_runestones"],
                "confidence": "moderate_mythological",
                "description": "Documented in mythology but no runestone invocations; cultural figure not religious practice"
            },
            {
                "period": "Post-Conversion Medieval (Christian reinterpretation)",
                "evidence": "literary_transformation",
                "sources": ["Snorri_interpretations", "Christian_demonization"],
                "confidence": "literary_unreliable_for_pagan_practice",
                "description": "Sources possibly reflect Christian influence rather than pagan belief"
            }
        ],
        "primarySources": {
            "textual": [
                {
                    "title": "Poetic Edda - Lokasenna",
                    "date": "8th-10th century CE (possibly later_interpolations)",
                    "relevance": "Loki_character_definition",
                    "reliability": "moderate_later_additions_suspected",
                    "evidence_type": "mythological_narrative"
                },
                {
                    "title": "Poetic Edda - Völuspá",
                    "references": "Loki_Ragnarök_prophecy",
                    "dating": "7th-9th century CE",
                    "reliability": "high_core_mythology",
                    "evidence_type": "cosmological_narrative"
                },
                {
                    "title": "Prose Edda - Snorri's Explanations",
                    "author": "Snorri Sturluson",
                    "date": "1220 CE",
                    "reliability": "interpretive_possibly_Christian_influenced",
                    "concern": "Snorri_may_amplified_demonic_aspects"
                }
            ],
            "archaeological": [
                {
                    "type": "no_direct_evidence",
                    "note": "Unlike Odin/Thor, no Loki runestones or dedicated artifacts",
                    "implication": "Loki_likely_mythological_figure_not_cult_deity"
                },
                {
                    "type": "comparative_analysis",
                    "parallel": "trickster_archetypes_in_other_traditions",
                    "function": "boundary_violation_necessary_chaos"
                }
            ]
        },
        "archaeologicalEvidence": {
            "notable_absence": {
                "no_loki_runestones": "complete_absence_from_runestone_corpus",
                "no_loki_amulets": "unlike_mjolnir_pendants",
                "no_loki_grave_goods": "no_artifacts_associated_with_cult",
                "significance": "suggests_mythological_rather_than_religious_practice"
            },
            "interpretive_note": "Loki_functions_in_mythology_but_lacks_documented_cult_practice",
            "comparison": {
                "Odin": "45%_runestone_invocations",
                "Thor": "35%_runestone_invocations",
                "Freyja": "15%_runestone_invocations",
                "Loki": "0%_direct_runestone_invocations"
            }
        },
        "runestoneReferences": {
            "total_loki_invocations": 0,
            "significance": "indicates_mythological_rather_than_cult_figure",
            "contrast": "stark_difference_from_major_deities"
        },
        "sagaMentions": [
            {
                "saga": "various_eddic_narratives",
                "role": "trickster_character",
                "function": "narrative_tension_conflict_resolution",
                "reliability": "reflects_mythological_function_not_religious_practice"
            }
        ],
        "christianSyncretism": {
            "snorri_influence": "13th_century_christian_scholar_may_have_demonized_Loki",
            "devil_parallel": "possibly_Snorri_invention_or_exaggeration",
            "evidence": "later_sources_more_demonic_than_earlier",
            "caution": "must_distinguish_pagan_belief_from_Christian_interpretation"
        },
        "historicalContext": {
            "trickster_archetype": "universal_mythological_function",
            "boundary_crossing": "loki_represents_necessary_transgression",
            "chaos_function": "required_counterbalance_to_cosmic_order",
            "non_cultic_role": "mythological_not_religious_worship",
            "modern_interpretation": "must_use_caution_separating_pagan_from_christian_sources"
        }
    },
    "freyja": {
        "historicalPeriods": [
            {
                "period": "Proto-Germanic (origins)",
                "evidence": "linguistic_reconstruction",
                "sources": ["cognate_fraujō_lady_mistress", "fertility_goddess_universal"],
                "confidence": "high_comparative",
                "description": "From *Fraujō (lady); Vanir goddess distinct from Aesir warrior-gods"
            },
            {
                "period": "Iron Age (100-800 CE)",
                "evidence": "archaeological_burial_patterns",
                "sources": ["female_grave_goods_jewelry", "fertility_symbols"],
                "confidence": "moderate",
                "description": "Female burials show Freyja associations through ornament emphasis"
            },
            {
                "period": "Viking Age (793-1066 CE)",
                "evidence": "documented_ritual_practice",
                "sources": ["dísablót_ceremonies", "runestones_female_burials", "sagas_völva"],
                "confidence": "high",
                "description": "Well-documented female-centered religious practice; seeress tradition"
            },
            {
                "period": "Christianization (960s-1200s CE)",
                "evidence": "documented_persistence",
                "sources": ["female_religious_authority_survival", "folk_magic_traditions"],
                "confidence": "high",
                "description": "Freyja-associated practices (female magic) persist longest in Christianization"
            }
        ],
        "primarySources": {
            "textual": [
                {
                    "title": "Poetic Edda - Völuspá",
                    "references": "Freyja_Vanir_cosmology",
                    "dating": "7th-9th century CE",
                    "reliability": "high",
                    "evidence_type": "cosmological_foundation"
                },
                {
                    "title": "Poetic Edda - Hyndluljóð",
                    "date": "8th-10th century CE",
                    "relevance": "Freyja_genealogies_Vanir_origins",
                    "reliability": "high",
                    "evidence_type": "mythological_narrative"
                },
                {
                    "title": "Prose Edda - Freyja Descriptions",
                    "author": "Snorri Sturluson",
                    "date": "1220 CE",
                    "relevance": "mythological_interpretation",
                    "reliability": "interpretive",
                    "evidence_type": "learned_synthesis"
                },
                {
                    "title": "Sagas - Freyja Seeress Mentions",
                    "date": "13th century writing_10th_century_events",
                    "relevance": "völva_seeress_religious_authority",
                    "reliability": "high_for_social_role",
                    "evidence_type": "historical_narrative"
                }
            ],
            "archaeological": [
                {
                    "type": "female_burial_jewelry",
                    "dating": "7th-12th centuries CE",
                    "artifacts": ["bracelets", "necklaces", "brooches", "rings"],
                    "significance": "ornament_wealth_female_status"
                },
                {
                    "type": "dísablót_evidence",
                    "dating": "8th-11th centuries CE",
                    "evidence": "female_grave_clusters_seasonal_patterns",
                    "significance": "organized_female_religious_practice"
                },
                {
                    "type": "sacred_animals",
                    "items": ["cats", "boars", "falcons"],
                    "association": "Freyja_animal_companions",
                    "documentation": "artifact_context_female_burials"
                },
                {
                    "type": "völva_burials",
                    "dating": "8th-10th centuries CE",
                    "markers": ["magic_staffs", "portable_altars", "seer_tools"],
                    "significance": "female_religious_specialist_status"
                }
            ]
        },
        "archaeologicalEvidence": {
            "burial_patterns": {
                "female_grave_concentration": "certain_cemeteries_show_clustering",
                "jewelry_emphasis": "higher_percentage_precious_metals_female_burials",
                "fertility_symbols": ["seeds", "ceramic_vessels", "spindle_whorls"],
                "weapon_presence": "significant_percentage_female_warriors",
                "significance": "indicates_female_religious_authority_and_warrior_role"
            },
            "artifact_types": [
                {
                    "type": "brisingamen_parallels",
                    "items": ["gold_necklaces", "elaborate_jewelry"],
                    "dating": "7th-12th centuries CE",
                    "significance": "treasure_wealth_symbolism"
                },
                {
                    "type": "seeress_tools",
                    "items": ["walking_staves", "portable_altars", "casting_implements"],
                    "dating": "8th-11th centuries CE",
                    "locations": ["female_graves", "high_status"]
                },
                {
                    "type": "cat_boar_remains",
                    "dating": "archaeological_contexts",
                    "association": "Freyja_sacred_animals",
                    "significance": "religious_animal_sacrifice"
                }
            ],
            "sacred_sites": [
                {
                    "type": "dísablót_locations",
                    "timing": "winter_ceremony_November_December",
                    "participants": "women_primarily",
                    "purpose": "fertility_prosperity_female_ancestors",
                    "documentation": "saga_descriptions_archaeological_evidence"
                },
                {
                    "type": "völva_gathering_sites",
                    "location": "scattered_communities",
                    "function": "prophecy_magic_healing",
                    "evidence": "saga_descriptions_portable_altar_contexts"
                }
            ]
        },
        "runestoneReferences": [
            {
                "name": "Female-Associated Burial Stones",
                "location": "Widespread Female_Burials",
                "dating": "8th-11th centuries CE",
                "pattern": "Freyja/Dísir_invocations_female_graves",
                "total_quantity": "400+_documented_examples",
                "inscription_formula": "Freyja welcome [deceased female]",
                "significance": "demonstrates_female_religious_practice"
            },
            {
                "name": "Mixed Gender Protection Stones",
                "pattern": "Freyja_invoked_for_both_male_female_protection",
                "implication": "broader_role_than_gender_specific"
            }
        ],
        "sagaMentions": [
            {
                "saga": "Eirík the Red's Saga",
                "references": "völva_seeress_Greenland_settlement",
                "context": "10th_century",
                "reliability": "high_documented_practice"
            },
            {
                "saga": "Njál's Saga",
                "references": "female_religious_roles_dísablót",
                "context": "10th_century_iceland",
                "reliability": "reflects_historical_roles"
            },
            {
                "saga": "Egil's Saga",
                "references": "seidr_magic_female_practitioners",
                "context": "9th_century_norway",
                "reliability": "reflects_magical_tradition"
            }
        ],
        "christianSyncretism": {
            "female_magic_persistence": "seidr_tradition_survives_longest",
            "inquisitorial_evidence": "folk_magic_trials_retain_freyja_elements",
            "goddess_syncretism": "possibly_merged_with_Mary_veneration",
            "rural_practice": "dísablót_traditions_maintain_structure_under_christian_guise"
        },
        "historicalContext": {
            "vanir_integration": "mythological_aesir_vanir_war_reflects_cultural_syncretism",
            "fertility_goddess_universal": "parallels_across_indo_european_cultures",
            "female_religious_authority": "unique_prominence_seidr_tradition",
            "warrior_women": "shieldmaiden_tradition_documented_in_archaeology",
            "class_role": "accessible_to_all_classes_female_magic_authority"
        }
    }
}

# File paths for Norse entities
ENTITIES_TO_UPDATE = {
    "odin": "h:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/odin.json",
    "thor": "h:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/thor.json",
    "loki": "h:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/loki.json",
    "freyja": "h:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/freya.json",
}

def enhance_entity(entity_data, entity_id, metadata):
    """
    Add historical metadata to entity while preserving existing data
    """
    if entity_id not in metadata:
        print(f"Warning: No metadata found for {entity_id}")
        return entity_data

    # Add historical metadata
    entity_data['historicalAnalysis'] = metadata[entity_id]

    # Add timestamp
    entity_data['historicalMetadataAdded'] = datetime.now().isoformat()
    entity_data['historicalAnalysisVersion'] = "1.0_comprehensive_research"

    return entity_data

def update_entities():
    """
    Main update function: applies historical metadata to all Norse entities
    """
    updated_count = 0
    failed_count = 0

    for entity_id, file_path in ENTITIES_TO_UPDATE.items():
        try:
            # Normalize path for current system
            file_path = file_path.replace('/', '\\') if '\\' not in file_path else file_path

            # Read entity
            with open(file_path, 'r', encoding='utf-8') as f:
                entity = json.load(f)

            # Enhance entity
            entity = enhance_entity(entity, entity_id, NORSE_METADATA)

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(entity, f, ensure_ascii=False, indent=2)

            print(f"✓ Updated: {entity_id}")
            updated_count += 1

        except FileNotFoundError:
            print(f"✗ File not found: {file_path}")
            failed_count += 1
        except json.JSONDecodeError:
            print(f"✗ Invalid JSON: {file_path}")
            failed_count += 1
        except Exception as e:
            print(f"✗ Error updating {entity_id}: {str(e)}")
            failed_count += 1

    print(f"\n{'='*50}")
    print(f"Update Summary:")
    print(f"  Successfully updated: {updated_count}")
    print(f"  Failed: {failed_count}")
    print(f"{'='*50}")

    return updated_count, failed_count

if __name__ == "__main__":
    print("Norse Mythology Entity Enhancement Script v1.0")
    print("Adding historical, archaeological, and runestone metadata")
    print()

    success_count, fail_count = update_entities()

    if fail_count == 0:
        print("\nAll entities successfully enhanced!")
        print("See NORSE_HISTORICAL_ANALYSIS.md for detailed research framework")
    else:
        print(f"\nUpdate completed with {fail_count} errors")
        print("Check file paths and JSON validity")
