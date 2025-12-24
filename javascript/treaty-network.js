// Treaty Network Visualization with Zoom


let treatyViz = {
    svg: null,
    g: null,
    zoom: null,
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    config: null,
    nodes: [],
    links: [],
    nodeElements: null,
    linkElements: null,
    linkLabelElements: null,  // Track link relationship labels
    labelElements: null,
    zoomHighlightedNode: null  // Track node highlighted by zoom (story mode only)
};

// Configuration 
const config = {
    margin: { top: 60, right: 80, bottom: 60, left: 80 },
    yearRange: [1909, 2010],
    nodeRadius: {
        treaty: 12,
        amendment: 12,
        body: 9,
        commission: 9,
        law: 6,
        regulation: 6,
        ratification: 5,
        decision: 8
    },
    highlighted: ['Treaty-Hague-1912', 'US-Harrison-1914', 'Treaty-UN-1961', 'Treaty-UN-1988', 'PE-DL22095-1978'],
    colors: {
        'League of Nations': '#08415C',
        'United Nations': '#CC2936',
        'Comunidad Andina de Naciones (CAN)': '#1B998B',
        'Organization of American States (OAS)': '#FFBE0B',
        'European Union (EU)': '#A7BBEC',
        'United States': '#7D8597',
        'Peru': '#E07A5F',
        'International': '#95A5A6'
    },
    forceStrength: {
        charge: -150,
        link: 0.3,
        collide: 1.5
    }
};

treatyViz.config = config;

// Load data 
Promise.all([
    d3.json('./data/treaties_tooltip.json'),
    d3.csv('./data/drug_regulations_shortened_keys.csv')
]).then(([tooltipData, relationships]) => {
    console.log('Data loaded:', Object.keys(tooltipData).length, 'nodes');
    console.log('Relationships:', relationships.length);
    const nodes = processNodes(tooltipData);
    const links = processLinks(relationships, nodes);
    treatyViz.nodes = nodes;
    treatyViz.links = links;
    createVisualization(nodes, links);
    setupScrollObserver(); 
}).catch(error => {
    console.error('Error loading data:', error);
    console.log('Make sure data files are in ./data/ folder:');
    console.log('- ./data/treaties_tooltip.json');
    console.log('- ./data/drug_regulations_shortened_keys.csv');
});

// Process nodes 
function processNodes(tooltipData) {
    const nodes = [];
    
    for (const [key, data] of Object.entries(tooltipData)) {
        if (!data.year) continue;
        
        const isHighlighted = config.highlighted.includes(key);
        const baseRadius = config.nodeRadius[data.type] || 6;
        
        nodes.push({
            id: key,
            name: data.name,
            shortName: data.shortened_name || data.name,
            year: data.year,
            type: data.type,
            entity: data.entity,
            description: data.description,
            highlighted: isHighlighted,
            radius: isHighlighted ? baseRadius * 1.5 : baseRadius
        });
    }
    
    return nodes;
}

// Process links 
function processLinks(relationships, nodes) {
    const links = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    relationships.forEach(rel => {
        const source = nodeMap.get(rel.source);
        const target = nodeMap.get(rel.target);
        
        if (source && target) {
            links.push({
                source: source.id,
                target: target.id,
                relationship: rel.relationship,
                entity: source.entity
            });
        }
    });
    
    return links;
}

// Create visualization 
function createVisualization(nodes, links) {
    const containerSelector = '#graphic-container'; 
    const container = d3.select(containerSelector);
    
    // Clear any existing content
    container.selectAll('svg').remove();
    
    const svg = container.append('svg')
        .attr('id', 'treaty-svg')
        .style('width', '100%')
        .style('height', '100%');
        
    const tooltip = d3.select('body').append('div')
        .attr('id', 'treaty-tooltip')
        .attr('class', 'tooltip')
        .style('position', 'fixed')
        .style('top', '80px')
        .style('left', '40px')
        .style('padding', '12px 15px')
        .style('background', 'rgba(0, 0, 0, 0.95)')
        .style('color', '#fff')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '10px')
        .style('max-width', '320px')
        .style('z-index', 1000)
        .style('transition', 'opacity 0.2s')
        .style('line-height', 1.4)
        .style('border', '1px solid #333');
    
    const containerNode = container.node();
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight;
    
    svg.attr('width', width).attr('height', height);
    
    const innerWidth = width - config.margin.left - config.margin.right;
    const innerHeight = height - config.margin.top - config.margin.bottom;
    
    treatyViz.width = width;
    treatyViz.height = height;
    treatyViz.innerWidth = innerWidth;
    treatyViz.innerHeight = innerHeight;
    
    svg.selectAll('*').remove();
    
    // Create defs for gradients and arrowheads
    const defs = svg.append('defs');
    
    // Create arrowhead markers for each entity color (line-based chevron style)
    Object.entries(config.colors).forEach(([entity, color]) => {
        defs.append('marker')
            .attr('id', `arrow-${entity.replace(/\s+/g, '-')}`)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 9)  // Position at end of line
            .attr('refY', 5)
            .attr('markerWidth', 6)  // Small size
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 2 2 L 8 5 L 2 8')  // Chevron/angle shape: >
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('opacity', 0.8);
    });
    
    // zoom behavior to SVG
    const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on('zoom', (event) => {
        g.attr('transform', event.transform);
    });

    // Store zoom behavior but DON'T apply it yet
    treatyViz.zoom = zoom;
    treatyViz.svg = svg;
    treatyViz.zoomEnabled = false;  // Track zoom state

    // Disable zoom initially (story mode)
    svg.on('.zoom', null);  // Remove zoom listeners
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    treatyViz.g = g;
    
    // X scale for timeline (horizontal)
    const xScale = d3.scaleLinear()
        .domain(config.yearRange)
        .range([0, innerWidth]);
    
    // decade markers (vertical lines)
    const decades = d3.range(1910, 2020, 10);
    decades.forEach(decade => {
        const x = xScale(decade);
        
        g.append('line')
            .attr('class', 'decade-marker')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#A9A9A9')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
        
        g.append('text')
            .attr('class', 'timeline-axis')
            .attr('x', x)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#999')
            .text(decade);
    });
    
    // Timeline axis at bottom
    const xAxis = d3.axisBottom(xScale)
        .tickValues(decades)
        .tickFormat(d => d);
    
    g.append('g')
        .attr('class', 'timeline-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('line')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    
    g.selectAll('.timeline-axis text')
        .style('font-size', '11px')
        .style('fill', '#999')
        .style('font-weight', 500);
    
    // Convert link source/target to node references
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    links.forEach(link => {
        link.source = nodeMap.get(link.source);
        link.target = nodeMap.get(link.target);
    });
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(config.forceStrength.charge))
        .force('link', d3.forceLink(links).id(d => d.id).strength(config.forceStrength.link))
        .force('collide', d3.forceCollide().radius(d => d.radius * config.forceStrength.collide))
        .force('x', d3.forceX(d => xScale(d.year)).strength(0.5))
        .force('y', d3.forceY(innerHeight / 2).strength(0.05))
        .force('bounds', forceBounds);
    
    // Custom force to keep nodes within bounds
    function forceBounds() {
        nodes.forEach(node => {
            node.x = Math.max(node.radius, Math.min(innerWidth - node.radius, node.x));
            node.y = Math.max(node.radius, Math.min(innerHeight - node.radius, node.y));
        });
    }
    
    // Draw links with gradient fade effect
    const linkGroup = g.append('g').attr('class', 'links');
    
    const linkElements = linkGroup.selectAll('.link')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', (d, i) => `url(#gradient-${i})`)
        // No marker-end by default - arrows only show on interaction
        .style('fill', 'none')
        .style('stroke-width', 1.5)
        .style('opacity', 0.6)
        .on('mouseenter', function(event, d) {
            const linkIndex = links.indexOf(d);
            d3.select(this)
                .classed('active', true)
                .style('stroke-width', 2.5)
                .style('opacity', 1)
                .attr('marker-end', `url(#arrow-${d.entity.replace(/\s+/g, '-')})`);  // Show arrow on hover
            
            // Show relationship label for this link
            linkLabelElements.filter((l, i) => i === linkIndex)
                .style('opacity', 1);
        })
        .on('mouseleave', function() {
            d3.select(this)
                .classed('active', false)
                .style('stroke-width', 1.5)
                .style('opacity', 0.6)
                .attr('marker-end', null);  // Hide arrow when not hovering
            
            // Hide relationship label
            linkLabelElements.style('opacity', 0);
        });
    
    treatyViz.linkElements = linkElements;
    
    // Add relationship labels for links (initially hidden)
    const linkLabelElements = linkGroup.selectAll('.link-label')
        .data(links)
        .enter()
        .append('text')
        .attr('class', 'link-label')
        .attr('text-anchor', 'middle')
        .attr('dy', -5)  // Position above the link
        .style('font-size', '8px')
        .style('font-weight', 500)
        .style('fill', '#808080')
        .style('opacity', 0)  // Hidden by default
        .style('pointer-events', 'none')
        .style('stroke', 'white')
        .style('stroke-width', '2px')
        .style('paint-order', 'stroke')
        .text(d => d.relationship);
    
    treatyViz.linkLabelElements = linkLabelElements;
    
    // Draw nodes

    // Draw node CIRCLES first
const nodeGroup = g.append('g').attr('class', 'nodes');

const nodeElements = nodeGroup.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => `node ${d.highlighted ? 'highlighted' : ''}`)
    .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
    .on('mouseenter', function(event, d) {
        showTooltip(event, d);
        highlightConnections(d);
    })
    .on('mouseleave', function() {
        hideTooltip();
        unhighlightConnections();
    });

treatyViz.nodeElements = nodeElements;

// Node circles
nodeElements.append('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => config.colors[d.entity] || '#95A5A6')
    .style('cursor', 'pointer')
    .style('stroke', 'white')
    .style('stroke-width', 2);

nodeElements.selectAll('circle')
    .on('mouseenter', function() {
        d3.select(this).style('stroke', '#000').style('stroke-width', 3);
    })
    .on('mouseleave', function(event, d) {
        // All nodes return to white stroke on mouse leave
        d3.select(this).style('stroke', 'white').style('stroke-width', 2);
    });

// Draw LABELS separately (on top of all circles)
const labelGroup = g.append('g').attr('class', 'labels');

const labelElements = labelGroup.selectAll('.node-label-group')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node-label-group');

labelElements.append('text')
    .attr('class', d => d.highlighted ? 'node-label major' : 'node-label')
    .attr('x', d => d.radius + 8)
    .attr('y', d => -d.radius + 15)
    .attr('text-anchor', 'start')
    // .attr('transform', d => `rotate(-20, ${d.radius + 3}, ${-d.radius - 3})`)
    .style('opacity', 0)  // All labels start hidden
    .style('font-size', d => d.highlighted ? '11px' : '9px')
    .style('font-weight', d => d.highlighted ? 600 : 400)
    .style('fill', '#000')
    .style('pointer-events', 'none')
    .style('stroke', 'white')      
    .style('stroke-width', '3px')   
    .style('paint-order', 'stroke') 
    .text(d => d.shortName);

treatyViz.labelElements = labelElements;
    
    // Update positions on simulation tick

    // Update positions on simulation tick
simulation.on('tick', () => {
    // Update link positions and gradients
    linkElements.each(function(d, i) {
        const link = d3.select(this);
        
        // Calculate shortened endpoint to prevent arrowhead overlap with target node
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Shorten line by target node radius + small gap for arrowhead
        const gap = d.target.radius + 3;
        const ratio = (distance - gap) / distance;
        
        const targetX = d.source.x + dx * ratio;
        const targetY = d.source.y + dy * ratio;
        
        // Update line position
        link
            .attr('x1', d.source.x)
            .attr('y1', d.source.y)
            .attr('x2', targetX)
            .attr('y2', targetY);
        
        // Create/update gradient for this link
        const gradientId = `gradient-${i}`;
        let gradient = defs.select(`#${gradientId}`);
        
        if (gradient.empty()) {
            gradient = defs.append('linearGradient')
                .attr('id', gradientId);
            
            gradient.append('stop')
                .attr('offset', '0%')
                .attr('class', 'start');
            
            gradient.append('stop')
                .attr('offset', '50%')
                .attr('class', 'middle');
            
            gradient.append('stop')
                .attr('offset', '100%')
                .attr('class', 'end');
        }
        
        // Update gradient direction (use original target position for gradient)
        gradient
            .attr('x1', `${d.source.x}px`)
            .attr('y1', `${d.source.y}px`)
            .attr('x2', `${d.target.x}px`)
            .attr('y2', `${d.target.y}px`)
            .attr('gradientUnits', 'userSpaceOnUse');
        
        const baseColor = config.colors[d.entity] || '#666';
        const middleColor = d3.color(baseColor).brighter(1.5);
        
        gradient.select('.start')
            .attr('stop-color', baseColor)
            .attr('stop-opacity', 0.8);
        
        gradient.select('.middle')
            .attr('stop-color', middleColor)
            .attr('stop-opacity', 0.2);
        
        gradient.select('.end')
            .attr('stop-color', baseColor)
            .attr('stop-opacity', 0.8);
    });
    
    // Update link label positions (at midpoint of each link)
    linkLabelElements
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);
    
    // Update node circles
    nodeElements
        .attr('transform', d => `translate(${d.x},${d.y})`);
    
    // Update labels to match node positions
    labelElements
        .attr('transform', d => `translate(${d.x},${d.y})`);
});
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Tooltip functions
    function showTooltip(event, d) {
        const shortDesc = d.description ? 
            (d.description.length > 150 ? d.description.slice(0, 150) + '...' : d.description) : '';
        
        tooltip
            .style('opacity', 1)
            .html(`
                <div style="font-weight: 600; margin-bottom: 4px; font-size: 11px;">${d.name}</div>
                <div style="font-size: 9px; opacity: 0.8; margin-bottom: 4px;">${d.year} • ${d.type} • ${d.entity}</div>
                ${shortDesc ? `<div style="margin-top: 5px;">${shortDesc}</div>` : ''}
            `);
    }
    
    function hideTooltip() {
        tooltip.style('opacity', 0);
    }
    
    function highlightConnections(node) {
        const connectedIds = new Set([node.id]);
        links.forEach(l => {
            if (l.source.id === node.id) connectedIds.add(l.target.id);
            if (l.target.id === node.id) connectedIds.add(l.source.id);
        });
        
        linkElements
            .classed('active', d => d.source.id === node.id || d.target.id === node.id)
            .style('opacity', d => 
                (d.source.id === node.id || d.target.id === node.id) ? 1 : 0.15
            )
            .attr('marker-end', d => 
                (d.source.id === node.id || d.target.id === node.id) 
                    ? `url(#arrow-${d.entity.replace(/\s+/g, '-')})` 
                    : null
            );  // Show arrows only on connected links
        
        // Show relationship labels for connected links
        // linkLabelElements
        //     .style('opacity', d => 
        //         (d.source.id === node.id || d.target.id === node.id) ? 1 : 0
        //     );
        
        nodeElements
            .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);
        
        // Update labels visibility
        labelElements.select('text')
            .style('opacity', d => connectedIds.has(d.id) ? 1 : 0);
    }
    
    function unhighlightConnections() {
        // If there's an active zoom highlight, restore it instead of default
        if (treatyViz.zoomHighlightedNode) {
            highlightNodeOnZoom(treatyViz.zoomHighlightedNode.id);
        } else {
            // Normal restore to default state
            linkElements
                .classed('active', false)
                .style('opacity', 0.6)
                .attr('marker-end', null);  // Remove all arrows
            
            // Hide all link relationship labels
            // linkLabelElements
            //     .style('opacity', 0);
            
            nodeElements
                .style('opacity', 1);
            
            // Hide all labels by default
            labelElements.select('text')
                .style('opacity', 0);
        }
    }
    
    // ZOOM HIGHLIGHTING FUNCTIONS (Story mode only)
    
    // Highlight a node and its connections when zooming (story mode)
    function highlightNodeOnZoom(nodeId) {
        const node = treatyViz.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        treatyViz.zoomHighlightedNode = node;
        
        // Find all connected nodes
        const connectedIds = new Set([node.id]);
        treatyViz.links.forEach(l => {
            if (l.source.id === node.id) connectedIds.add(l.target.id);
            if (l.target.id === node.id) connectedIds.add(l.source.id);
        });
        
        // Fade links not connected to this node, show arrows on connected links
        linkElements
            .style('opacity', d => 
                (d.source.id === node.id || d.target.id === node.id) ? 1 : 0.15
            )
            .attr('marker-end', d => 
                (d.source.id === node.id || d.target.id === node.id) 
                    ? `url(#arrow-${d.entity.replace(/\s+/g, '-')})` 
                    : null
            );  // Show arrows only on connected links
        
        // Show relationship labels for connected links
        // treatyViz.linkLabelElements
        //     .style('opacity', d => 
        //         (d.source.id === node.id || d.target.id === node.id) ? 1 : 0
        //     );
        
        // Fade nodes not connected to this node
        nodeElements
            .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);
        
        // Show labels for connected nodes
        labelElements.select('text')
            .style('opacity', d => connectedIds.has(d.id) ? 1 : 0);
    }
    
    // Clear zoom highlighting and restore defaults
    function clearZoomHighlight() {
        treatyViz.zoomHighlightedNode = null;
        
        // Reset links to default opacity and remove arrows
        linkElements
            .style('opacity', 0.6)
            .attr('marker-end', null);  // Remove all arrows
        
        // Hide all link relationship labels
        treatyViz.linkLabelElements
            .style('opacity', 0);
        
        // Reset nodes to full opacity
        nodeElements
            .style('opacity', 1);
        
        // Hide all labels
        labelElements.select('text')
            .style('opacity', 0);
    }
    
    // Store functions in treatyViz for access outside createVisualization
    treatyViz.highlightNodeOnZoom = highlightNodeOnZoom;
    treatyViz.clearZoomHighlight = clearZoomHighlight;
    
    console.log('Force-directed visualization complete:', nodes.length, 'nodes,', links.length, 'links');
}

// oom functions
function zoomToNode(nodeId, scale = 3, duration = 2000) {
    const node = treatyViz.nodes.find(n => n.id === nodeId);
    if (!node) {
        console.warn('Node not found:', nodeId);
        return;
    }
    
    const x = -node.x * scale + (treatyViz.width / 2);
    const y = -node.y * scale + (treatyViz.height / 2);
    
    treatyViz.svg.transition()
        .duration(duration)
        .call(
            treatyViz.zoom.transform,
            d3.zoomIdentity.translate(x + config.margin.left * scale, y + config.margin.top * scale).scale(scale)
        )
        .on('end', () => {
            // Highlight node after zoom completes (story mode only)
            if (!treatyViz.zoomEnabled && treatyViz.highlightNodeOnZoom) {
                treatyViz.highlightNodeOnZoom(nodeId);
            }
        });
}

function zoomToYearRange(startYear, endYear, scale = 2, duration = 1000) {
    // Clear any existing zoom highlight
    if (treatyViz.clearZoomHighlight) {
        treatyViz.clearZoomHighlight();
    }
    
    const nodesInRange = treatyViz.nodes.filter(n => n.year >= startYear && n.year <= endYear);
    
    if (nodesInRange.length === 0) {
        console.warn('No nodes in year range:', startYear, '-', endYear);
        return;
    }
    
    const centerX = d3.mean(nodesInRange, d => d.x);
    const centerY = d3.mean(nodesInRange, d => d.y);
    
    const x = -centerX * scale + (treatyViz.width / 2);
    const y = -centerY * scale + (treatyViz.height / 2);
    
    treatyViz.svg.transition()
        .duration(duration)
        .call(
            treatyViz.zoom.transform,
            d3.zoomIdentity.translate(x + config.margin.left * scale, y + config.margin.top * scale).scale(scale)
        );
}

function resetZoom(duration = 1000) {
    // Clear any existing zoom highlight
    if (treatyViz.clearZoomHighlight) {
        treatyViz.clearZoomHighlight();
    }
    
    treatyViz.svg.transition()
        .duration(duration)
        .call(
            treatyViz.zoom.transform,
            d3.zoomIdentity.translate(config.margin.left, config.margin.top)
        );
}

// Setup scroll observer

function setupScrollObserver() {
    const captions = document.querySelectorAll('#treaties .caption');
    const exploreBtn = document.getElementById('explore-btn');
    
    if (captions.length === 0) {
        console.warn('No captions found for scroll observer');
        return;
    }
    
    // Observer for caption changes
    const captionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.dataset.index);
                handleCaptionChange(index);
            }
        });
    }, { 
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
    });
    
    captions.forEach(caption => captionObserver.observe(caption));
    



// Observer for last caption (to show explore button)
const lastCaption = captions[captions.length-1];
let exploreButtonShown = false; // Track if button has been shown

const lastCaptionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Show button when last caption becomes visible
        if (entry.isIntersecting && entry.intersectionRatio > 0.8 && !exploreButtonShown) {
            console.log('Showing explore button');
            if (exploreBtn) {
                exploreBtn.classList.add('visible');
                exploreButtonShown = true;
            }
        }
        
        // Only hide button if user scrolls completely away from treaties section
        // AND explore mode is not active
        if (!entry.isIntersecting && entry.intersectionRatio === 0 && !treatyViz.zoomEnabled) {
            console.log('User scrolled away, hiding button');
            if (exploreBtn) {
                exploreBtn.classList.remove('visible');
                exploreButtonShown = false;
            }
        }
    });
}, {
    threshold: [0, 0.8, 1]
});

lastCaptionObserver.observe(lastCaption);
    
    // Explore button click handler
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function() {
            enableExploreMode();
        });
    }
    
    console.log('Scroll observer setup for', captions.length, 'captions');
}

function enableExploreMode() {
    const exploreBtn = document.getElementById('explore-btn');
    const captionsContainer = document.querySelector('#treaties .captions');
    
    if (treatyViz.zoomEnabled) {
        // Already in explore mode - EXIT it
        disableZoom();
        resetZoom(1000);
        
        // Update button
        if (exploreBtn) {
            exploreBtn.classList.remove('active');
            exploreBtn.textContent = 'Explore the Network';
        }
        
        // Show captions again
        if (captionsContainer) {
            captionsContainer.style.opacity = '1';
        }
        
        console.log('Explore mode deactivated');
    } else {
        // Enter explore mode
        
        // Clear any zoom highlighting from story mode
        if (treatyViz.clearZoomHighlight) {
            treatyViz.clearZoomHighlight();
        }
        
        enableZoom();
        
        // Update button
        if (exploreBtn) {
            exploreBtn.classList.add('active');
            exploreBtn.textContent = '← Exit Explore Mode';
        }
        
        // Fade out captions
        if (captionsContainer) {
            captionsContainer.style.transition = 'opacity 0.5s ease';
            captionsContainer.style.opacity = '0.2';
        }
        
        console.log('Explore mode activated');
    }
}

function handleCaptionChange(index) {
    console.log('Caption changed to:', index);
    
    const duration = 1000; // Smooth transition duration
    const zoomScale = 2.5; // Consistent zoom scale for node focus
    
    switch(index) {
        case 0:
            // General view
            resetZoom(duration);
            break;

        case 1:
            // Zoom in on Treaty-UN-1961
            zoomToNode('Treaty-UN-1961', zoomScale, duration);
            break;
            
        case 2:
            // Zoom in on Vienna 1988
            zoomToNode('Treaty-UN-1988', zoomScale, duration);
            break;
            
        case 3:
            // Zoom out a bit (scale 1.5)
            zoomToScale(1.5, duration);
            break;
                       
        case 4:
            // General / zoom out
            resetZoom(duration);
            break;
            
        default:
            resetZoom(duration);
    }
}

// Enable/disable zoom functions
function enableZoom() {
    if (treatyViz.zoomEnabled) return;
    
    treatyViz.svg.call(treatyViz.zoom);
    treatyViz.zoomEnabled = true;
    console.log('Zoom enabled');
}

function disableZoom() {
    if (!treatyViz.zoomEnabled) return;
    
    treatyViz.svg.on('.zoom', null);
    treatyViz.zoomEnabled = false;
    console.log('Zoom disabled');
}

// Zoom to specific scale centered on viewport
function zoomToScale(scale = 1, duration = 1000) {
    // Clear any existing zoom highlight
    if (treatyViz.clearZoomHighlight) {
        treatyViz.clearZoomHighlight();
    }
    
    const centerX = treatyViz.innerWidth / 2;
    const centerY = treatyViz.innerHeight / 2;
    
    treatyViz.svg.transition()
        .duration(duration)
        .call(
            treatyViz.zoom.transform,
            d3.zoomIdentity
                .translate(config.margin.left, config.margin.top)
                .scale(scale)
                .translate(centerX * (1 - scale) / scale, centerY * (1 - scale) / scale)
        );
}

// Expose for debugging
window.treatyViz = treatyViz;
window.zoomToNode = zoomToNode;
window.zoomToYearRange = zoomToYearRange;
window.resetZoom = resetZoom;
window.enableZoom = enableZoom;   
window.disableZoom = disableZoom;