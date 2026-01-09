/**
 * Timeline Tree Visualization
 * WoW-style talent tree showing temporal connections between mythological entities
 */

class TimelineTree {
  constructor() {
    this.canvas = document.getElementById('timeline-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.entities = [];
    this.nodes = [];
    this.connections = [];

    // View state
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Layout configuration
    this.nodeRadius = 25;
    this.nodeSpacing = 150;
    this.layerHeight = 120;
    this.timelineStart = -3000;
    this.timelineEnd = 2000;

    // Filters
    this.activeFilters = {
      mythologies: new Set(),
      types: new Set(['all', 'place', 'deity', 'concept', 'item'])
    };

    // Colors
    this.mythologyColors = {
      greek: '#4169E1',
      egyptian: '#DAA520',
      norse: '#4682B4',
      hindu: '#FF6B35',
      celtic: '#228B22',
      chinese: '#DC143C',
      japanese: '#FF1493',
      jewish: '#0047AB',
      roman: '#8B0000'
    };

    // Connection type colors
    this.connectionColors = {
      direct: '#FFD700',
      cultural: '#4CAF50',
      syncretism: '#9C27B0',
      parallel: '#2196F3'
    };

    this.hoveredNode = null;
    this.selectedNode = null;
  }

  async init() {
    await this.loadEntities();
    this.setupCanvas();
    this.layoutNodes();
    this.setupControls();
    this.setupEventListeners();
    this.render();

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
            if (entity.temporal?.firstAttestation) {
              this.entities.push({
                ...entity,
                mythology,
                category
              });
            }
          }
        }
      }

      // Sort by date
      this.entities.sort((a, b) => {
        const dateA = a.temporal?.firstAttestation?.date?.year || 0;
        const dateB = b.temporal?.firstAttestation?.date?.year || 0;
        return dateA - dateB;
      });

      console.log(`Loaded ${this.entities.length} entities`);

      // Populate filters
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

    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  layoutNodes() {
    this.nodes = [];

    // Group entities by time period (century)
    const timePeriods = new Map();

    this.entities.forEach(entity => {
      const year = entity.temporal?.firstAttestation?.date?.year || 0;
      const century = Math.floor(year / 100) * 100;

      if (!timePeriods.has(century)) {
        timePeriods.set(century, []);
      }
      timePeriods.get(century).push(entity);
    });

    // Layout nodes by time period and mythology
    const sortedPeriods = Array.from(timePeriods.keys()).sort((a, b) => a - b);
    const mythologies = [...new Set(this.entities.map(e => e.mythology))];

    sortedPeriods.forEach((century, periodIndex) => {
      const entitiesInPeriod = timePeriods.get(century);

      // Group by mythology within period
      const byMythology = new Map();
      entitiesInPeriod.forEach(entity => {
        if (!byMythology.has(entity.mythology)) {
          byMythology.set(entity.mythology, []);
        }
        byMythology.get(entity.mythology).push(entity);
      });

      // Layout each mythology in its own lane
      byMythology.forEach((entities, mythology) => {
        const mythIndex = mythologies.indexOf(mythology);
        const baseY = mythIndex * this.layerHeight + 100;

        entities.forEach((entity, entityIndex) => {
          const x = periodIndex * this.nodeSpacing + 200;
          const y = baseY + (entityIndex % 3) * 50; // Stack up to 3 in same period

          this.nodes.push({
            entity,
            x,
            y,
            radius: this.nodeRadius,
            color: this.mythologyColors[mythology] || '#888'
          });
        });
      });
    });

    // Calculate connections based on influences and temporal/cultural relationships
    this.calculateConnections();

    // Center view
    this.centerView();
  }

  calculateConnections() {
    this.connections = [];

    // Create connections between related entities
    this.nodes.forEach((node1, i) => {
      this.nodes.forEach((node2, j) => {
        if (i >= j) return;

        const entity1 = node1.entity;
        const entity2 = node2.entity;

        // Check for explicit influences
        if (entity1.influences?.influencedBy?.some(inf => inf.entityId === entity2.id)) {
          this.connections.push({
            from: node1,
            to: node2,
            type: 'direct',
            strength: 1
          });
        } else if (entity1.influences?.influenced?.some(inf => inf.entityId === entity2.id)) {
          this.connections.push({
            from: node2,
            to: node1,
            type: 'direct',
            strength: 1
          });
        }

        // Check for same-mythology temporal proximity (suggests cultural continuity)
        if (entity1.mythology === entity2.mythology) {
          const year1 = entity1.temporal?.firstAttestation?.date?.year || 0;
          const year2 = entity2.temporal?.firstAttestation?.date?.year || 0;
          const yearDiff = Math.abs(year2 - year1);

          if (yearDiff > 0 && yearDiff < 500) {
            // Temporal proximity in same culture
            this.connections.push({
              from: year1 < year2 ? node1 : node2,
              to: year1 < year2 ? node2 : node1,
              type: 'cultural',
              strength: 0.5
            });
          }
        }

        // Check for cross-mythology parallels
        if (entity1.mythology !== entity2.mythology &&
            entity1.category === entity2.category) {
          const year1 = entity1.temporal?.firstAttestation?.date?.year || 0;
          const year2 = entity2.temporal?.firstAttestation?.date?.year || 0;
          const yearDiff = Math.abs(year2 - year1);

          if (yearDiff < 200) {
            // Possible parallel development or diffusion
            this.connections.push({
              from: node1,
              to: node2,
              type: 'parallel',
              strength: 0.3
            });
          }
        }
      });
    });

    console.log(`Created ${this.connections.length} connections`);
  }

  centerView() {
    if (this.nodes.length === 0) return;

    const bounds = this.getNodesBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    this.offsetX = this.canvas.width / 2 - centerX;
    this.offsetY = this.canvas.height / 2 - centerY;
  }

  getNodesBounds() {
    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  setupControls() {
    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.scale *= 1.2;
      this.render();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.scale /= 1.2;
      this.render();
    });

    document.getElementById('zoom-reset').addEventListener('click', () => {
      this.scale = 1;
      this.centerView();
      this.render();
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

        this.render();
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

        this.render();
      });
    });
  }

  setupEventListeners() {
    // Pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.offsetX;
      this.dragStartY = e.clientY - this.offsetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.offsetX = e.clientX - this.dragStartX;
        this.offsetY = e.clientY - this.dragStartY;
        this.render();
      } else {
        // Check hover
        this.updateHover(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Zoom with mouse wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= delta;
      this.render();
    });

    // Click
    this.canvas.addEventListener('click', (e) => {
      const node = this.getNodeAt(e.clientX, e.clientY);
      if (node) {
        this.selectedNode = node;
        this.showTooltip(node, e.clientX, e.clientY);
      } else {
        this.hideTooltip();
      }
    });
  }

  updateHover(mouseX, mouseY) {
    const node = this.getNodeAt(mouseX, mouseY);

    if (node !== this.hoveredNode) {
      this.hoveredNode = node;
      this.render();

      if (node) {
        this.canvas.style.cursor = 'pointer';
      } else {
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    }
  }

  getNodeAt(mouseX, mouseY) {
    const worldX = (mouseX - this.offsetX) / this.scale;
    const worldY = (mouseY - this.offsetY) / this.scale;

    for (const node of this.nodes) {
      if (!this.isNodeVisible(node)) continue;

      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < node.radius) {
        return node;
      }
    }

    return null;
  }

  isNodeVisible(node) {
    const entity = node.entity;

    if (!this.activeFilters.mythologies.has(entity.mythology)) return false;
    if (!this.activeFilters.types.has('all') &&
        !this.activeFilters.types.has(entity.category)) return false;

    return true;
  }

  showTooltip(node, x, y) {
    const tooltip = document.getElementById('entity-tooltip');
    const entity = node.entity;

    document.getElementById('tooltip-name').textContent = entity.name;
    document.getElementById('tooltip-date').textContent =
      entity.temporal?.firstAttestation?.date?.display || 'Unknown date';
    document.getElementById('tooltip-location').textContent =
      entity.geographical?.region || 'Unknown location';
    document.getElementById('tooltip-description').textContent =
      entity.shortDescription || entity.description || '';

    tooltip.style.display = 'block';
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y + 15) + 'px';
  }

  hideTooltip() {
    document.getElementById('entity-tooltip').style.display = 'none';
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Clear
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-background') || '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Draw connections first
    this.drawConnections();

    // Draw nodes
    this.drawNodes();

    ctx.restore();
  }

  drawConnections() {
    const ctx = this.ctx;

    this.connections.forEach(conn => {
      if (!this.isNodeVisible(conn.from) || !this.isNodeVisible(conn.to)) return;

      const color = this.connectionColors[conn.type] || '#888';
      const alpha = conn.strength * 0.5;

      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;

      if (conn.type === 'cultural') {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(conn.from.x, conn.from.y);

      // Curved connection
      const midX = (conn.from.x + conn.to.x) / 2;
      const midY = (conn.from.y + conn.to.y) / 2;
      const dx = conn.to.x - conn.from.x;
      const dy = conn.to.y - conn.from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curvature = Math.min(dist * 0.2, 50);

      const controlX = midX - dy / dist * curvature;
      const controlY = midY + dx / dist * curvature;

      ctx.quadraticCurveTo(controlX, controlY, conn.to.x, conn.to.y);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(conn.to.y - controlY, conn.to.x - controlX);
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(conn.to.x, conn.to.y);
      ctx.lineTo(
        conn.to.x - arrowSize * Math.cos(angle - Math.PI / 6),
        conn.to.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        conn.to.x - arrowSize * Math.cos(angle + Math.PI / 6),
        conn.to.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  drawNodes() {
    const ctx = this.ctx;

    this.nodes.forEach(node => {
      if (!this.isNodeVisible(node)) return;

      const isHovered = node === this.hoveredNode;
      const isSelected = node === this.selectedNode;
      const radius = node.radius * (isHovered ? 1.2 : 1);

      // Outer glow for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '33';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fff' : '#ffffff44';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Icon or text
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.entity.icon || node.entity.name[0], node.x, node.y);

      // Label
      if (isHovered || isSelected || this.scale > 1.5) {
        ctx.font = '12px Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text-primary') || '#fff';
        ctx.fillText(node.entity.name, node.x, node.y + radius + 15);
      }
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const timeline = new TimelineTree();
  timeline.init();
});
