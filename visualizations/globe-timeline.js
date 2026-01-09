/**
 * 3D Globe Timeline Visualization
 * Shows temporal and geographical spread of mythological entities
 */

class GlobeTimeline {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globe = null;
    this.markers = [];
    this.arrows = [];
    this.entities = [];
    this.currentYear = -3000;
    this.isPlaying = false;
    this.animationSpeed = 1;
    this.selectedEntity = null;
    this.highlightedMarkers = new Set();
    this.relationshipArrows = [];
    this.hoveredArrow = null;
    this.activeFilters = {
      mythologies: new Set(),
      types: new Set(['place', 'deity', 'concept', 'item', 'all']),
      relationshipTypes: new Set(['cultural', 'temporal', 'geographical', 'parallel', 'etymological', 'all']),
      relationshipStrengths: new Set(['strong', 'moderate', 'weak', 'possible', 'all'])
    };

    this.mythologyColors = {
      greek: 0x4169E1,
      egyptian: 0xDAA520,
      norse: 0x4682B4,
      hindu: 0xFF6B35,
      celtic: 0x228B22,
      chinese: 0xDC143C,
      japanese: 0xFF1493,
      jewish: 0x0047AB,
      roman: 0x8B0000
    };
  }

  async init() {
    await this.loadEntities();
    this.setupScene();
    this.createGlobe();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
    this.updateTimeline(this.currentYear);

    document.getElementById('loading').style.display = 'none';
  }

  async loadEntities() {
    try {
      const response = await fetch('../data/indices/by-mythology.json');
      const data = await response.json();

      // Flatten all entities with their metadata
      for (const [mythology, categories] of Object.entries(data)) {
        for (const [category, entities] of Object.entries(categories)) {
          for (const entity of entities) {
            // Load full entity data if it has geographical info
            if (entity.geographical || entity.temporal) {
              this.entities.push({
                ...entity,
                mythology,
                category
              });
            }
          }
        }
      }

      console.log(`Loaded ${this.entities.length} entities with metadata`);

      // Load relationship data
      await this.loadRelationships();

      // Populate mythology filters
      const mythologies = [...new Set(this.entities.map(e => e.mythology))];
      const filtersContainer = document.getElementById('mythology-filters');
      mythologies.forEach(myth => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip active';
        chip.dataset.mythology = myth;
        chip.textContent = myth.charAt(0).toUpperCase() + myth.slice(1);
        filtersContainer.appendChild(chip);
        this.activeFilters.mythologies.add(myth);
      });

      document.getElementById('stat-total').textContent = this.entities.length;

    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  async loadRelationships() {
    try {
      const response = await fetch('../data/relationships-by-entity.json');
      this.relationshipsData = await response.json();
      console.log(`Loaded relationship data for ${Object.keys(this.relationshipsData).length} entities`);
    } catch (error) {
      console.error('Error loading relationships:', error);
      this.relationshipsData = {};
    }
  }

  setupScene() {
    // Create scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 300;

    // Renderer
    const canvas = document.getElementById('globe-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    // Orbit controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 150;
    this.controls.maxDistance = 500;

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createGlobe() {
    // Create sphere for Earth
    const geometry = new THREE.SphereGeometry(100, 64, 64);

    // Create gradient material for globe
    const material = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      specular: 0x333333,
      shininess: 15,
      opacity: 0.9,
      transparent: true
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // Add wireframe for continents effect
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.globe.add(wireframe);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(105, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(atmosphere);

    // Add starfield
    this.createStarfield();
  }

  createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  latLonToVector3(lat, lon, radius = 100) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  createMarker(entity) {
    const coords = entity.geographical?.originPoint?.coordinates ||
                   entity.geographical?.primaryLocation?.coordinates;

    if (!coords || coords.latitude === undefined) return null;

    // Create marker
    const geometry = new THREE.SphereGeometry(2, 16, 16);
    const color = this.mythologyColors[entity.mythology] || 0xffffff;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });

    const marker = new THREE.Mesh(geometry, material);
    const position = this.latLonToVector3(coords.latitude, coords.longitude, 102);
    marker.position.copy(position);

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    marker.add(glow);

    marker.userData = { entity };

    return marker;
  }

  createInfluenceArrow(from, to, color = 0xffaa00) {
    const fromPos = this.latLonToVector3(
      from.coordinates.latitude,
      from.coordinates.longitude,
      102
    );
    const toPos = this.latLonToVector3(
      to.coordinates.latitude,
      to.coordinates.longitude,
      102
    );

    // Create curved path for arrow
    const midPoint = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(120); // Arc outward

    const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });

    const line = new THREE.Line(geometry, material);
    return line;
  }

  updateTimeline(year) {
    this.currentYear = year;

    // Update display
    const displayYear = Math.abs(year);
    const era = year < 0 ? 'BCE' : 'CE';
    document.getElementById('current-year').textContent = `${displayYear} ${era}`;

    // Clear existing markers and arrows
    this.markers.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.markers = [];

    this.arrows.forEach(a => {
      this.scene.remove(a);
      a.geometry.dispose();
      a.material.dispose();
    });
    this.arrows = [];

    // Filter entities by current year and filters
    const visibleEntities = this.entities.filter(entity => {
      // Check if entity exists at this time
      const firstAttestation = entity.temporal?.firstAttestation?.date?.year;
      const endDate = entity.temporal?.historicalDate?.end?.year;

      if (!firstAttestation) return false;
      if (year < firstAttestation) return false;
      if (endDate && year > endDate) return false;

      // Check filters
      if (!this.activeFilters.mythologies.has(entity.mythology)) return false;
      if (!this.activeFilters.types.has('all') &&
          !this.activeFilters.types.has(entity.category)) return false;

      return true;
    });

    // Create markers for visible entities
    visibleEntities.forEach(entity => {
      const marker = this.createMarker(entity);
      if (marker) {
        this.markers.push(marker);
        this.scene.add(marker);

        // Animate marker appearance
        marker.scale.set(0, 0, 0);
        this.animateMarkerIn(marker);
      }
    });

    // Update stats
    document.getElementById('stat-visible').textContent = visibleEntities.length;

    // Create influence arrows between visible entities that have influence data
    this.createInfluenceArrows(visibleEntities, year);
  }

  /**
   * Create arrows showing influence relationships between visible entities
   * @param {Array} visibleEntities - Entities currently visible on the globe
   * @param {number} year - Current timeline year
   */
  createInfluenceArrows(visibleEntities, year) {
    // Clear existing influence arrows
    this.arrows.forEach(arrow => {
      this.scene.remove(arrow);
      if (arrow.geometry) arrow.geometry.dispose();
      if (arrow.material) arrow.material.dispose();
    });
    this.arrows = [];

    // Create a map of entity IDs to their positions for quick lookup
    const entityPositions = new Map();
    visibleEntities.forEach(entity => {
      if (entity.geographical?.coordinates) {
        const pos = this.latLonToVector3(
          entity.geographical.coordinates.latitude,
          entity.geographical.coordinates.longitude,
          102
        );
        entityPositions.set(entity.id, { entity, position: pos });
      }
    });

    // Iterate through visible entities and create arrows for their influences
    visibleEntities.forEach(entity => {
      if (!entity.influences) return;

      // Handle entities that this entity influenced
      if (entity.influences.influenced && Array.isArray(entity.influences.influenced)) {
        entity.influences.influenced.forEach(influence => {
          const targetId = influence.entityId || influence.id || influence;
          const target = entityPositions.get(targetId);
          const source = entityPositions.get(entity.id);

          if (source && target) {
            const arrow = this.createInfluenceArrow(
              { coordinates: entity.geographical.coordinates },
              { coordinates: target.entity.geographical.coordinates },
              this.mythologyColors[entity.mythology] || 0xffaa00
            );
            if (arrow) {
              arrow.userData = {
                fromEntity: entity.id,
                toEntity: targetId,
                influenceType: influence.type || 'cultural',
                description: influence.description || 'Influenced'
              };
              this.arrows.push(arrow);
              this.scene.add(arrow);
            }
          }
        });
      }

      // Handle entities that influenced this entity (reverse direction arrows)
      if (entity.influences.influencedBy && Array.isArray(entity.influences.influencedBy)) {
        entity.influences.influencedBy.forEach(influence => {
          const sourceId = influence.entityId || influence.id || influence;
          const source = entityPositions.get(sourceId);
          const target = entityPositions.get(entity.id);

          if (source && target) {
            const arrow = this.createInfluenceArrow(
              { coordinates: source.entity.geographical.coordinates },
              { coordinates: entity.geographical.coordinates },
              this.mythologyColors[source.entity.mythology] || 0xffaa00
            );
            if (arrow) {
              arrow.userData = {
                fromEntity: sourceId,
                toEntity: entity.id,
                influenceType: influence.type || 'cultural',
                description: influence.description || 'Influenced by'
              };
              this.arrows.push(arrow);
              this.scene.add(arrow);
            }
          }
        });
      }
    });
  }

  animateMarkerIn(marker) {
    const startScale = 0;
    const endScale = 1;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = startScale + (endScale - startScale) * this.easeOut Cubic(progress);

      marker.scale.set(scale, scale, scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  setupControls() {
    // Timeline slider
    const slider = document.getElementById('timeline-slider');
    slider.addEventListener('input', (e) => {
      this.updateTimeline(parseInt(e.target.value));
    });

    // Play/pause button
    const playButton = document.getElementById('play-button');
    playButton.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playButton.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play Timeline';

      if (this.isPlaying) {
        this.playTimeline();
      }
    });

    // Speed buttons
    document.querySelectorAll('.speed-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-button').forEach(b =>
          b.classList.remove('active')
        );
        btn.classList.add('active');
        this.animationSpeed = parseFloat(btn.dataset.speed);
      });
    });

    // Mythology filters
    document.querySelectorAll('[data-mythology]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const myth = chip.dataset.mythology;

        if (chip.classList.contains('active')) {
          this.activeFilters.mythologies.add(myth);
        } else {
          this.activeFilters.mythologies.delete(myth);
        }

        this.updateTimeline(this.currentYear);
      });
    });

    // Type filters
    document.querySelectorAll('[data-type]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const type = chip.dataset.type;

        if (chip.classList.contains('active')) {
          this.activeFilters.types.add(type);
        } else {
          this.activeFilters.types.delete(type);
        }

        this.updateTimeline(this.currentYear);
      });
    });
  }

  setupEventListeners() {
    // Raycaster for marker interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
      // Ignore clicks on control panel
      if (event.target.closest('#controls-panel') || event.target.closest('#info-panel')) {
        return;
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.markers);

      if (intersects.length > 0) {
        const marker = intersects[0].object;
        const entity = marker.userData.entity;

        // Toggle selection
        if (this.selectedEntity?.id === entity.id) {
          this.deselectEntity();
        } else {
          this.selectEntity(entity, marker);
        }
      } else {
        // Clicked empty space - deselect
        this.deselectEntity();
      }
    });

    // Hover effect for markers and arrows
    window.addEventListener('mousemove', (event) => {
      if (event.target.closest('#controls-panel') || event.target.closest('#info-panel')) {
        return;
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      // Check for marker hovers
      const markerIntersects = raycaster.intersectObjects(this.markers);

      // Check for arrow hovers
      const arrowIntersects = raycaster.intersectObjects(this.relationshipArrows, true);

      if (markerIntersects.length > 0) {
        document.body.style.cursor = 'pointer';
        this.hideRelationshipTooltip();
      } else if (arrowIntersects.length > 0) {
        document.body.style.cursor = 'help';
        // Find the top-level arrow object (not child ArrowHelper)
        let arrow = arrowIntersects[0].object;
        while (arrow.parent && !arrow.userData.relationshipType) {
          arrow = arrow.parent;
        }
        if (arrow.userData.relationshipType) {
          // Highlight arrow on hover
          if (this.hoveredArrow && this.hoveredArrow !== arrow) {
            this.hoveredArrow.material.opacity = this.hoveredArrow.userData.originalOpacity || 0.7;
          }
          if (this.hoveredArrow !== arrow) {
            arrow.userData.originalOpacity = arrow.material.opacity;
            arrow.material.opacity = Math.min(1.0, arrow.material.opacity + 0.2);
            this.hoveredArrow = arrow;
          }

          this.showRelationshipTooltip(event.clientX, event.clientY, arrow.userData);
        }
      } else {
        document.body.style.cursor = 'default';
        this.hideRelationshipTooltip();

        // Reset hovered arrow
        if (this.hoveredArrow) {
          this.hoveredArrow.material.opacity = this.hoveredArrow.userData.originalOpacity || 0.7;
          this.hoveredArrow = null;
        }
      }
    });

    // Relationship type filter listeners
    document.querySelectorAll('#relationship-filters .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const relType = chip.dataset.relType;

        if (relType === 'all') {
          // Toggle all
          const allActive = chip.classList.contains('active');
          document.querySelectorAll('#relationship-filters .filter-chip').forEach(c => {
            if (allActive) {
              c.classList.remove('active');
              this.activeFilters.relationshipTypes.delete(c.dataset.relType);
            } else {
              c.classList.add('active');
              this.activeFilters.relationshipTypes.add(c.dataset.relType);
            }
          });
        } else {
          // Toggle individual filter
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) {
            this.activeFilters.relationshipTypes.add(relType);
          } else {
            this.activeFilters.relationshipTypes.delete(relType);
            // Uncheck "all" if unchecking individual
            document.querySelector('#relationship-filters [data-rel-type="all"]')?.classList.remove('active');
            this.activeFilters.relationshipTypes.delete('all');
          }
        }

        // Re-highlight if entity is selected
        if (this.selectedEntity) {
          this.clearRelationshipHighlights();
          this.highlightRelationships(this.selectedEntity);
        }
      });
    });

    // Relationship strength filter listeners
    document.querySelectorAll('#strength-filters .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const strength = chip.dataset.strength;

        if (strength === 'all') {
          // Toggle all
          const allActive = chip.classList.contains('active');
          document.querySelectorAll('#strength-filters .filter-chip').forEach(c => {
            if (allActive) {
              c.classList.remove('active');
              this.activeFilters.relationshipStrengths.delete(c.dataset.strength);
            } else {
              c.classList.add('active');
              this.activeFilters.relationshipStrengths.add(c.dataset.strength);
            }
          });
        } else {
          // Toggle individual filter
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) {
            this.activeFilters.relationshipStrengths.add(strength);
          } else {
            this.activeFilters.relationshipStrengths.delete(strength);
            // Uncheck "all" if unchecking individual
            document.querySelector('#strength-filters [data-strength="all"]')?.classList.remove('active');
            this.activeFilters.relationshipStrengths.delete('all');
          }
        }

        // Re-highlight if entity is selected
        if (this.selectedEntity) {
          this.clearRelationshipHighlights();
          this.highlightRelationships(this.selectedEntity);
        }
      });
    });
  }

  selectEntity(entity, marker) {
    this.selectedEntity = entity;

    // Show entity info
    this.showEntityInfo(entity);

    // Highlight selected marker
    marker.scale.set(1.5, 1.5, 1.5);

    // Find and highlight related entities
    this.highlightRelationships(entity);
  }

  deselectEntity() {
    if (!this.selectedEntity) return;

    this.selectedEntity = null;

    // Hide info panel
    const panel = document.getElementById('info-panel');
    panel.classList.remove('visible');

    // Reset all marker scales
    this.markers.forEach(marker => {
      marker.scale.set(1, 1, 1);
    });

    // Clear relationship highlights
    this.clearRelationshipHighlights();
  }

  highlightRelationships(entity) {
    this.clearRelationshipHighlights();
    this.highlightedMarkers.clear();

    // Find related entities
    const relatedEntities = this.findRelatedEntities(entity);

    // Highlight related markers and create arrows (with filters applied)
    relatedEntities.forEach(({ relatedEntity, relationship, type, strength }) => {
      // Apply relationship type filter
      const hasAllTypes = this.activeFilters.relationshipTypes.has('all');
      const typeMatches = hasAllTypes || this.activeFilters.relationshipTypes.has(type);

      // Apply relationship strength filter
      const hasAllStrengths = this.activeFilters.relationshipStrengths.has('all');
      const strengthMatches = hasAllStrengths || this.activeFilters.relationshipStrengths.has(strength);

      // Skip if doesn't match filters
      if (!typeMatches || !strengthMatches) {
        return;
      }

      const relatedMarker = this.markers.find(m =>
        m.userData.entity.id === relatedEntity.id
      );

      if (relatedMarker) {
        // Highlight marker
        this.highlightedMarkers.add(relatedMarker);
        relatedMarker.scale.set(1.3, 1.3, 1.3);

        // Dim non-related markers
        this.markers.forEach(m => {
          if (m.userData.entity.id !== entity.id &&
              !this.highlightedMarkers.has(m)) {
            m.material.opacity = 0.3;
          }
        });

        // Create arrow showing relationship
        const selectedMarker = this.markers.find(m =>
          m.userData.entity.id === entity.id
        );
        if (selectedMarker) {
          const arrow = this.createRelationshipArrow(
            selectedMarker.position,
            relatedMarker.position,
            { type, strength, description: relationship }
          );
          if (arrow) {
            // Add fade-in animation
            const targetOpacity = arrow.material.opacity;
            arrow.material.opacity = 0;
            arrow.userData.targetOpacity = targetOpacity;
            arrow.userData.animationProgress = 0;

            this.relationshipArrows.push(arrow);
            this.scene.add(arrow);
          }
        }
      }
    });

    console.log(`Found ${relatedEntities.length} related entities for ${entity.name}`);
  }

  clearRelationshipHighlights() {
    // Remove relationship arrows
    this.relationshipArrows.forEach(arrow => {
      this.scene.remove(arrow);
      arrow.geometry.dispose();
      arrow.material.dispose();
    });
    this.relationshipArrows = [];

    // Reset marker opacities
    this.markers.forEach(marker => {
      marker.material.opacity = 0.8;
    });

    this.highlightedMarkers.clear();
  }

  findRelatedEntities(entity) {
    const related = [];
    const seen = new Set();

    // Use loaded relationship data if available
    if (this.relationshipsData && this.relationshipsData[entity.id]) {
      const relationships = this.relationshipsData[entity.id];

      // Process outgoing relationships
      if (relationships.outgoing) {
        relationships.outgoing.forEach(rel => {
          if (seen.has(rel.to)) return;
          seen.add(rel.to);

          const relatedEntity = this.entities.find(e => e.id === rel.to);
          if (relatedEntity) {
            related.push({
              relatedEntity,
              relationship: rel.description || rel.type,
              type: rel.type,
              strength: rel.strength
            });
          }
        });
      }

      // Process incoming relationships
      if (relationships.incoming) {
        relationships.incoming.forEach(rel => {
          if (seen.has(rel.from)) return;
          seen.add(rel.from);

          const relatedEntity = this.entities.find(e => e.id === rel.from);
          if (relatedEntity) {
            related.push({
              relatedEntity,
              relationship: rel.description || rel.type,
              type: rel.type,
              strength: rel.strength
            });
          }
        });
      }
    }

    // Fallback: Check relatedEntities field
    if (related.length === 0 && entity.relatedEntities) {
      Object.values(entity.relatedEntities).forEach(categoryEntities => {
        if (Array.isArray(categoryEntities)) {
          categoryEntities.forEach(rel => {
            const relatedEntity = this.entities.find(e => e.id === rel.id);
            if (relatedEntity && !seen.has(relatedEntity.id)) {
              seen.add(relatedEntity.id);
              related.push({
                relatedEntity,
                relationship: rel.relationship || 'related',
                type: 'direct'
              });
            }
          });
        }
      });
    }

    // Limit to top 20 relationships sorted by strength
    const strengthOrder = { strong: 3, moderate: 2, weak: 1, possible: 0 };
    return related
      .sort((a, b) => (strengthOrder[b.strength] || 0) - (strengthOrder[a.strength] || 0))
      .slice(0, 20);
  }

  createRelationshipArrow(fromPos, toPos, relationship) {
    // Determine color based on relationship type
    const relationshipColors = {
      direct: 0xFFD700,      // Gold for direct relationships
      parallel: 0x9C27B0,    // Purple for parallels
      cultural: 0x4CAF50,    // Green for cultural continuity
      geographical: 0x2196F3, // Blue for geographical proximity
      temporal: 0xFF6B6B,    // Red for temporal relationships
      etymological: 0xFFA726 // Orange for etymological
    };

    const color = relationshipColors[relationship.type] || 0xFFAA00;

    // Determine opacity and visual weight based on strength
    const strengthConfig = {
      strong: { opacity: 0.9, tubeRadius: 0.8, arrowSize: 6 },
      moderate: { opacity: 0.7, tubeRadius: 0.5, arrowSize: 5 },
      weak: { opacity: 0.5, tubeRadius: 0.3, arrowSize: 4 },
      possible: { opacity: 0.3, tubeRadius: 0.2, arrowSize: 3 }
    };

    const config = strengthConfig[relationship.strength] || strengthConfig.weak;

    // Create curved path
    const start = fromPos.clone();
    const end = toPos.clone();

    // Calculate midpoint raised above surface
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(120); // Arc outward from globe

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);

    // Use TubeGeometry for variable thickness instead of LineBasicMaterial
    const tubeGeometry = new THREE.TubeGeometry(curve, 50, config.tubeRadius, 8, false);

    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: config.opacity,
      side: THREE.DoubleSide
    });

    const tube = new THREE.Mesh(tubeGeometry, material);

    // Add arrow head with appropriate size
    const direction = new THREE.Vector3().subVectors(end, mid).normalize();
    const arrowHelper = new THREE.ArrowHelper(
      direction,
      end,
      config.arrowSize,
      color,
      config.arrowSize * 0.5,
      config.arrowSize * 0.4
    );
    tube.add(arrowHelper);

    // Store relationship data for filtering and tooltips
    tube.userData = {
      relationshipType: relationship.type,
      relationshipStrength: relationship.strength,
      relationshipDescription: relationship.description
    };

    return tube;
  }

  showRelationshipTooltip(x, y, relationshipData) {
    const tooltip = document.getElementById('relationship-tooltip');
    const typeLabels = {
      cultural: '🌿 Cultural Relationship',
      temporal: '⏱️ Temporal Relationship',
      geographical: '📍 Geographical Relationship',
      parallel: '🔀 Cross-Cultural Parallel',
      etymological: '📖 Etymological Connection',
      direct: '🔗 Direct Relationship'
    };

    const strengthLabels = {
      strong: 'Strong',
      moderate: 'Moderate',
      weak: 'Weak',
      possible: 'Possible'
    };

    tooltip.querySelector('.tooltip-type').textContent =
      typeLabels[relationshipData.relationshipType] || 'Relationship';
    tooltip.querySelector('.tooltip-strength').textContent =
      `Strength: ${strengthLabels[relationshipData.relationshipStrength] || 'Unknown'}`;
    tooltip.querySelector('.tooltip-desc').textContent =
      relationshipData.relationshipDescription || 'No description available';

    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y + 15}px`;
  }

  hideRelationshipTooltip() {
    const tooltip = document.getElementById('relationship-tooltip');
    tooltip.style.display = 'none';
  }

  showEntityInfo(entity) {
    const panel = document.getElementById('info-panel');
    panel.classList.add('visible');

    document.getElementById('entity-name').textContent = entity.name;
    document.getElementById('entity-description').textContent =
      entity.shortDescription || entity.description || '';

    const firstAtt = entity.temporal?.firstAttestation;
    if (firstAtt) {
      document.getElementById('entity-date').textContent =
        firstAtt.date?.display || 'Unknown';
    }

    const location = entity.geographical?.region ||
                     entity.geographical?.originPoint?.name ||
                     'Unknown';
    document.getElementById('entity-location').textContent = location;

    // Calculate and show relationship statistics
    const relatedEntities = this.findRelatedEntities(entity);

    if (relatedEntities.length > 0) {
      // Show stats panel
      document.getElementById('relationship-stats').style.display = 'block';

      // Calculate statistics
      const stats = {
        total: relatedEntities.length,
        strong: 0,
        cultural: 0,
        temporal: 0,
        geographical: 0,
        parallel: 0
      };

      relatedEntities.forEach(({ type, strength }) => {
        if (strength === 'strong') stats.strong++;
        if (type === 'cultural') stats.cultural++;
        if (type === 'temporal') stats.temporal++;
        if (type === 'geographical') stats.geographical++;
        if (type === 'parallel') stats.parallel++;
      });

      // Update UI
      document.getElementById('stat-total-rel').textContent = stats.total;
      document.getElementById('stat-strong').textContent = stats.strong;
      document.getElementById('stat-cultural').textContent = stats.cultural;
      document.getElementById('stat-temporal').textContent = stats.temporal;
      document.getElementById('stat-geo').textContent = stats.geographical;
      document.getElementById('stat-parallel').textContent = stats.parallel;
    } else {
      document.getElementById('relationship-stats').style.display = 'none';
    }

    // Show related entities list
    const relatedList = document.getElementById('related-list');
    relatedList.innerHTML = '';

    if (relatedEntities.length > 0) {
      document.getElementById('related-entities').style.display = 'block';

      // Group by type
      const byType = {
        direct: [],
        parallel: [],
        cultural: [],
        geographical: []
      };

      relatedEntities.forEach(({ relatedEntity, type }) => {
        byType[type].push(relatedEntity);
      });

      // Display each type
      Object.entries(byType).forEach(([type, entities]) => {
        if (entities.length === 0) return;

        const typeLabel = {
          direct: '🔗 Direct Relations',
          parallel: '🔀 Parallels',
          cultural: '🌿 Same Tradition',
          geographical: '📍 Nearby'
        }[type];

        const typeDiv = document.createElement('div');
        typeDiv.style.marginTop = '0.5rem';
        typeDiv.innerHTML = `<strong style="font-size: 0.85rem; color: var(--color-text-secondary);">${typeLabel}</strong>`;

        const entitiesList = document.createElement('div');
        entitiesList.style.marginLeft = '1rem';
        entitiesList.style.fontSize = '0.85rem';

        entities.slice(0, 5).forEach(rel => {
          const item = document.createElement('div');
          item.textContent = `• ${rel.name}`;
          item.style.marginTop = '0.25rem';
          item.style.color = 'var(--color-text-secondary)';
          entitiesList.appendChild(item);
        });

        if (entities.length > 5) {
          const more = document.createElement('div');
          more.textContent = `  ... and ${entities.length - 5} more`;
          more.style.fontStyle = 'italic';
          more.style.marginTop = '0.25rem';
          more.style.color = 'var(--color-text-tertiary)';
          entitiesList.appendChild(more);
        }

        typeDiv.appendChild(entitiesList);
        relatedList.appendChild(typeDiv);
      });
    } else {
      document.getElementById('related-entities').style.display = 'none';
    }
  }

  playTimeline() {
    if (!this.isPlaying) return;

    const slider = document.getElementById('timeline-slider');
    let year = this.currentYear + (10 * this.animationSpeed);

    if (year > 2000) {
      year = -3000;
    }

    slider.value = year;
    this.updateTimeline(year);

    setTimeout(() => this.playTimeline(), 100);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Rotate globe slowly
    if (this.globe) {
      this.globe.rotation.y += 0.001;
    }

    // Pulse markers
    this.markers.forEach((marker, i) => {
      const pulse = Math.sin(Date.now() * 0.002 + i) * 0.2 + 1;
      if (marker.children[0]) {
        marker.children[0].scale.set(pulse, pulse, pulse);
      }
    });

    // Animate relationship arrows (fade in)
    this.relationshipArrows.forEach(arrow => {
      if (arrow.userData.animationProgress !== undefined && arrow.userData.animationProgress < 1) {
        arrow.userData.animationProgress += 0.05; // 20 frames = ~333ms animation
        const eased = this.easeOutCubic(arrow.userData.animationProgress);
        arrow.material.opacity = arrow.userData.targetOpacity * eased;

        if (arrow.userData.animationProgress >= 1) {
          arrow.material.opacity = arrow.userData.targetOpacity;
          delete arrow.userData.animationProgress; // Clean up after animation
        }
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const globe = new GlobeTimeline();
  globe.init();
});
