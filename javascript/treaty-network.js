// treaty-network.js
// Treaty network visualization with scroll-triggered interactions

class TreatyNetworkViz {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.selectedNode = null;
        this.nodes = [];
        this.edges = [];
        this.links = null;
        this.nodeGroups = null;
        this.linkLabelGroups = null;
        this.g = null;
        this.svg = null;
        this.zoom = null;
        
        this.width = this.container.node().getBoundingClientRect().width;
        this.height = this.container.node().getBoundingClientRect().height;
    }
    
    async init() {
        console.log('Initializing Treaty Network...');
        
        // Load CSV data
        try {
            const data = await d3.csv('drug_regulations_full.csv');
            console.log('CSV loaded:', data.length, 'relationships');
            
            this.processData(data);
            this.setupSVG();
            this.positionNodes();
            this.renderVisualization();
            this.setupScrollObserver();
            
            console.log('Treaty Network initialized successfully');
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    }
    
    extractYear(name) {
        const match = name.match(/\b(19\d{2}|18\d{2}|20\d{2})\b/);
        return match ? parseInt(match[1]) : null;
    }
    
    getOrganizationColor(entity) {
        if (!entity) return '#95A5A6';
        
        const e = entity.toLowerCase().trim();
        
        if (e === 'league of nations') return '#08415C';
        if (e === 'un' || e === 'united nations' || 
            (e.includes('united nations') && !e.includes('organization of american states'))) {
            return '#CC2936';
        }
        if (e.includes('comunidad andina') || e === 'can' || 
            e.startsWith('can ') || e.endsWith(' can')) {
            return '#1B998B';
        }
        if (e.includes('organization of american states') || 
            e === 'oas' || e.includes('(oas)')) {
            return '#FFBE0B';
        }
        if (e.includes('european council') || e.includes('european union') || 
            e === 'eu' || e.includes('emcdda')) {
            return '#A7BBEC';
        }
        
        return '#95A5A6';
    }
    
    processData(data) {
        const nodeMap = new Map();
        
        // Create nodes
        data.forEach(edge => {
            [edge.source, edge.target].forEach(nodeName => {
                if (!nodeMap.has(nodeName)) {
                    const year = this.extractYear(nodeName);
                    nodeMap.set(nodeName, {
                        id: nodeName,
                        name: nodeName,
                        year: year,
                        entity: edge.entity,
                        type: edge.type,
                        outgoing: [],
                        incoming: []
                    });
                }
            });
        });
        
        // Add relationships
        data.forEach(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (sourceNode) {
                sourceNode.outgoing.push({ to: edge.target, rel: edge.relationship });
            }
            if (targetNode) {
                targetNode.incoming.push({ from: edge.source, rel: edge.relationship });
            }
        });
        
        this.nodes = Array.from(nodeMap.values());
        this.edges = data;
        
        // Determine importance
        this.nodes.forEach(node => {
            if (!node.year) {
                node.importance = 1;
            } else if (node.year === 1912 || node.year === 1961 || 
                       node.year === 1971 || node.year === 1988) {
                node.importance = 4;
            } else if (node.year === 1931 || node.year === 1925) {
                node.importance = 3;
            } else {
                node.importance = 2;
            }
        });
        
        console.log('Processed:', this.nodes.length, 'nodes');
    }
    
    setupSVG() {
        const margin = { top: 80, right: 80, bottom: 80, left: 80 };
        
        this.svg = this.container.append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Define arrow markers
        const defs = this.svg.append('defs');
        
        defs.append('marker')
            .attr('id', 'arrow-grey')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 8)
            .attr('refY', 5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 2 L 5 5 L 0 8')
            .attr('stroke', '#CCCCCC')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none');
        
        const colors = [
            { id: 'arrow-08415C', color: '#08415C' },
            { id: 'arrow-CC2936', color: '#CC2936' },
            { id: 'arrow-1B998B', color: '#1B998B' },
            { id: 'arrow-FFBE0B', color: '#FFBE0B' },
            { id: 'arrow-A7BBEC', color: '#A7BBEC' }
        ];
        
        colors.forEach(c => {
            defs.append('marker')
                .attr('id', c.id)
                .attr('viewBox', '0 0 10 10')
                .attr('refX', 8)
                .attr('refY', 5)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M 0 2 L 5 5 L 0 8')
                .attr('stroke', c.color)
                .attr('stroke-width', 1.5)
                .attr('fill', 'none');
        });
        
        this.g = this.svg.append('g').attr('class', 'main-group');
        
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });
        
        this.svg.call(this.zoom);
        
        this.margin = margin;
    }
    
    positionNodes() {
        const nodesWithYears = this.nodes.filter(n => n.year);
        const years = nodesWithYears.map(n => n.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        const yScale = d3.scaleLinear()
            .domain([minYear, maxYear])
            .range([this.margin.top, this.height - this.margin.bottom]);
        
        this.yScale = yScale;
        
        const nodesByYear = d3.group(nodesWithYears, n => n.year);
        
        this.nodes.forEach(node => {
            if (node.year) {
                node.targetY = yScale(node.year);
                
                const sameYearNodes = nodesByYear.get(node.year);
                const indexInYear = sameYearNodes.indexOf(node);
                const totalInYear = sameYearNodes.length;
                
                const xSpread = this.width - this.margin.left - this.margin.right;
                const baseX = this.margin.left + (xSpread / (totalInYear + 1)) * (indexInYear + 1);
                node.x = baseX + (Math.random() - 0.5) * 40;
                node.y = node.targetY + (Math.random() - 0.5) * 20;
            } else {
                node.targetY = this.height - 50;
                node.x = this.margin.left + Math.random() * (this.width - this.margin.left - this.margin.right);
                node.y = node.targetY;
            }
        });
        
        // Force simulation
        const simulation = d3.forceSimulation(this.nodes)
            .force('x', d3.forceX(d => d.x).strength(0.08))
            .force('y', d3.forceY(d => d.targetY).strength(0.4))
            .force('collide', d3.forceCollide().radius(d => 10 + d.importance * 3.5))
            .force('charge', d3.forceManyBody().strength(-25))
            .stop();
        
        for (let i = 0; i < 300; i++) {
            simulation.tick();
        }
        
        console.log('Nodes positioned');
    }
    
    createCurvedPath(source, target) {
        const sx = source.x;
        const sy = source.y;
        const tx = target.x;
        const ty = target.y;
        
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const curvature = Math.min(dist * 0.15, 50);
        
        const controlX = midX - dy / dist * curvature;
        const controlY = midY + dx / dist * curvature;
        
        return `M ${sx},${sy} Q ${controlX},${controlY} ${tx},${ty}`;
    }
    
    renderVisualization() {
        const nodeById = new Map(this.nodes.map(n => [n.id, n]));
        
        // Draw year lines
        const minYear = Math.min(...this.nodes.filter(n => n.year).map(n => n.year));
        const maxYear = Math.max(...this.nodes.filter(n => n.year).map(n => n.year));
        const yearTicks = d3.range(Math.ceil(minYear / 10) * 10, maxYear + 1, 10);
        
        this.g.selectAll('.year-line')
            .data(yearTicks)
            .enter()
            .append('line')
            .attr('class', 'year-line')
            .attr('x1', this.margin.left - 30)
            .attr('x2', this.width - this.margin.right + 30)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
        
        this.g.selectAll('.year-label')
            .data(yearTicks)
            .enter()
            .append('text')
            .attr('class', 'year-label')
            .attr('x', this.margin.left - 40)
            .attr('y', d => this.yScale(d))
            .attr('text-anchor', 'end')
            .attr('dy', 4)
            .style('font-size', '11px')
            .style('fill', '#666')
            .style('font-weight', 'bold')
            .text(d => d);
        
        // Draw links
        const linksGroup = this.g.append('g').attr('class', 'links');
        
        this.links = linksGroup.selectAll('.link')
            .data(this.edges)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d => {
                const source = nodeById.get(d.source);
                const target = nodeById.get(d.target);
                if (!source || !target) return '';
                return this.createCurvedPath(source, target);
            })
            .attr('stroke', '#CCCCCC')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.4)
            .attr('marker-end', 'url(#arrow-grey)');
        
        // Link labels
        this.linkLabelGroups = linksGroup.selectAll('.link-label-group')
            .data(this.edges)
            .enter()
            .append('g')
            .attr('class', 'link-label-group')
            .style('opacity', 0)
            .attr('transform', d => {
                const source = nodeById.get(d.source);
                const target = nodeById.get(d.target);
                if (!source || !target) return 'translate(0,0)';
                
                const sx = source.x;
                const sy = source.y;
                const tx = target.x;
                const ty = target.y;
                const midX = (sx + tx) / 2;
                const midY = (sy + ty) / 2;
                const dy = ty - sy;
                const dx = tx - sx;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const curvature = Math.min(dist * 0.15, 50);
                
                const x = midX - dy / dist * curvature;
                const y = midY + dx / dist * curvature;
                
                return `translate(${x},${y})`;
            });
        
        this.linkLabelGroups.append('rect')
            .attr('x', d => {
                const textLength = (d.relationship || '').length * 5;
                return -textLength / 2 - 3;
            })
            .attr('y', -14)
            .attr('width', d => (d.relationship || '').length * 5 + 6)
            .attr('height', 14)
            .attr('fill', 'rgba(255,255,255,0.9)')
            .attr('rx', 2);
        
        this.linkLabelGroups.append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dy', -5)
            .style('font-size', '9px')
            .style('font-style', 'italic')
            .style('fill', '#000')
            .style('pointer-events', 'none')
            .text(d => d.relationship || '');
        
        // Draw nodes
        this.nodeGroups = this.g.append('g').attr('class', 'nodes')
            .selectAll('.node')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        this.nodeGroups.append('circle')
            .attr('r', d => 3 + d.importance * 2.5)
            .attr('fill', d => this.getOrganizationColor(d.entity))
            .attr('stroke', 'none')
            .attr('stroke-width', 0);
        
        // Node labels
        this.nodeGroups.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            const displayName = d.name.length > 50 ? d.name.slice(0, 50) + '...' : d.name;
            const textWidth = displayName.length * 5;
            
            group.append('rect')
                .attr('class', 'node-label-bg')
                .attr('x', -textWidth / 2)
                .attr('y', 10)
                .attr('width', textWidth)
                .attr('height', 16)
                .attr('fill', 'rgba(255, 255, 255, 0.9)')
                .attr('rx', 2)
                .style('opacity', 0)
                .style('pointer-events', 'none');
            
            group.append('text')
                .attr('class', 'node-label')
                .attr('dy', 22)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', '#000')
                .style('opacity', 0)
                .style('pointer-events', 'none')
                .text(displayName);
        });
        
        // Initial zoom
        setTimeout(() => this.zoomToFit(), 200);
        
        console.log('Visualization rendered');
    }
    
    zoomToFit() {
        const bounds = this.g.node().getBBox();
        const scale = 0.9 / Math.max(bounds.width / this.width, bounds.height / this.height);
        const translate = [
            this.width / 2 - scale * (bounds.x + bounds.width / 2),
            this.height / 2 - scale * (bounds.y + bounds.height / 2)
        ];
        
        this.svg.transition().duration(1000)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
    
    zoomToNode(nodeId, scale = 2.5) {
        const node = this.nodes.find(n => n.id === nodeId || n.name.includes(nodeId));
        if (!node) {
            console.warn('Node not found:', nodeId);
            return;
        }
        
        const translate = [this.width / 2 - scale * node.x, this.height / 2 - scale * node.y];
        
        this.svg.transition().duration(1000)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        
        // Highlight node
        this.highlightNode(node);
    }
    
    zoomToYear(year, scale = 1.8) {
        const nodesInYear = this.nodes.filter(n => n.year === year);
        if (nodesInYear.length === 0) return;
        
        // Calculate center of nodes in this year
        const avgX = d3.mean(nodesInYear, n => n.x);
        const avgY = d3.mean(nodesInYear, n => n.y);
        
        const translate = [this.width / 2 - scale * avgX, this.height / 2 - scale * avgY];
        
        this.svg.transition().duration(1000)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        
        // Highlight nodes in this year
        this.nodeGroups.selectAll('circle')
            .transition().duration(300)
            .attr('opacity', n => n.year === year ? 1 : 0.2)
            .attr('stroke', n => n.year === year ? '#000' : 'none')
            .attr('stroke-width', n => n.year === year ? 2 : 0);
        
        this.links
            .transition().duration(300)
            .attr('stroke-opacity', 0.1);
    }
    
    highlightNode(node) {
        const connectedIds = new Set([node.id]);
        node.incoming.forEach(c => connectedIds.add(c.from));
        node.outgoing.forEach(c => connectedIds.add(c.to));
        
        this.links
            .transition().duration(300)
            .attr('stroke-opacity', l => 
                (l.source === node.id || l.target === node.id) ? 0.9 : 0.05
            )
            .attr('stroke-width', l =>
                (l.source === node.id || l.target === node.id) ? 3 : 1.5
            )
            .attr('stroke', l => {
                if (l.source === node.id || l.target === node.id) {
                    return this.getOrganizationColor(l.entity);
                }
                return '#CCCCCC';
            })
            .attr('marker-end', l => {
                if (l.source === node.id || l.target === node.id) {
                    const color = this.getOrganizationColor(l.entity);
                    const colorId = color.replace('#', '');
                    return `url(#arrow-${colorId})`;
                }
                return 'url(#arrow-grey)';
            });
        
        this.nodeGroups.selectAll('circle')
            .transition().duration(300)
            .attr('opacity', n => connectedIds.has(n.id) ? 1 : 0.15)
            .attr('stroke', n => n.id === node.id ? '#000' : 'none')
            .attr('stroke-width', n => n.id === node.id ? 3 : 0);
        
        // Show labels for connected nodes
        this.nodeGroups.each((n, i, nodes) => {
            const group = d3.select(nodes[i]);
            if (connectedIds.has(n.id)) {
                group.select('.node-label').style('opacity', 1);
                group.select('.node-label-bg').style('opacity', 1);
            } else {
                group.select('.node-label').style('opacity', 0);
                group.select('.node-label-bg').style('opacity', 0);
            }
        });
        
        this.linkLabelGroups
            .style('opacity', l => 
                (l.source === node.id || l.target === node.id) ? 1 : 0
            );
    }
    
    resetView() {
        this.links
            .transition().duration(500)
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', 1.5)
            .attr('stroke', '#CCCCCC')
            .attr('marker-end', 'url(#arrow-grey)');
        
        this.nodeGroups.selectAll('circle')
            .transition().duration(500)
            .attr('opacity', 1)
            .attr('stroke', 'none')
            .attr('stroke-width', 0);
        
        this.nodeGroups.selectAll('.node-label').style('opacity', 0);
        this.nodeGroups.selectAll('.node-label-bg').style('opacity', 0);
        this.linkLabelGroups.style('opacity', 0);
    }
    
    setupScrollObserver() {
        const captions = document.querySelectorAll('#intro .caption');
        
        if (captions.length === 0) {
            console.warn('No captions found for scroll observer');
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(captions).indexOf(entry.target);
                    this.handleCaptionChange(index);
                }
            });
        }, { threshold: 0.6 });
        
        captions.forEach(caption => observer.observe(caption));
        
        console.log('Scroll observer setup for', captions.length, 'captions');
    }
    
    handleCaptionChange(index) {
        console.log('Caption changed to:', index);
        
        switch(index) {
            case 0:
                // "In January, 1912, the first treaty..."
                this.zoomToNode('International Opium Convention (Hague, 1912)');
                break;
                
            case 1:
                // "Made under the auspices of the League of Nations..."
                this.zoomToYear(1912, 2.0);
                break;
                
            case 2:
                // "those 'best efforts' were few and far between..."
                // Show broader context - zoom out slightly
                this.zoomToYear(1912, 1.5);
                break;
                
            default:
                this.resetView();
                this.zoomToFit();
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.TreatyNetworkViz = TreatyNetworkViz;
    
    window.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, checking for treaty network container...');
        const container = document.querySelector('#graphic-container');
        if (container) {
            window.treatyNetwork = new TreatyNetworkViz('#graphic-container');
            window.treatyNetwork.init();
        }
    });
}