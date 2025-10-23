// Treaty Network Visualization with Zoom
// This wraps your EXACT original code and only adds zoom capabilities

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
    linkElements: null
};

// Configuration (UNCHANGED from your original)
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

// Load data (UNCHANGED from your original)
Promise.all([
    d3.json('./data/tooltip_data_template.json'),
    d3.csv('./data/drug_regulations_shortened_keys.csv')
]).then(([tooltipData, relationships]) => {
    console.log('Data loaded:', Object.keys(tooltipData).length, 'nodes');
    console.log('Relationships:', relationships.length);
    const nodes = processNodes(tooltipData);
    const links = processLinks(relationships, nodes);
    treatyViz.nodes = nodes;
    treatyViz.links = links;
    createVisualization(nodes, links);
    setupScrollObserver(); // NEW: Add scroll observer
}).catch(error => {
    console.error('Error loading data:', error);
    console.log('Make sure data files are in ./data/ folder:');
    console.log('- ./data/tooltip_data_template.json');
    console.log('- ./data/drug_regulations_shortened_keys.csv');
});

// Process nodes (UNCHANGED from your original)
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

// Process links (UNCHANGED from your original)
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

// Create visualization (YOUR ORIGINAL CODE with zoom added to SVG)
function createVisualization(nodes, links) {
    const containerSelector = '#graphic-container'; // Changed from '#main-svg'
    const container = d3.select(containerSelector);
    
    // Clear any existing content
    container.selectAll('*').remove();
    
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
    
    // Create defs for gradients
    const defs = svg.append('defs');
    
    // NEW: Add zoom behavior to SVG
    const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    treatyViz.zoom = zoom;
    treatyViz.svg = svg;
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    treatyViz.g = g;
    
    // X scale for timeline (horizontal)
    const xScale = d3.scaleLinear()
        .domain(config.yearRange)
        .range([0, innerWidth]);
    
    // Draw decade markers (vertical lines)
    const decades = d3.range(1910, 2020, 10);
    decades.forEach(decade => {
        const x = xScale(decade);
        
        g.append('line')
            .attr('class', 'decade-marker')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#f0f0f0')
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
        .force('x', d3.forceX(d => xScale(d.year)).strength(1))
        .force('y', d3.forceY(innerHeight / 2).strength(0.1))
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
        .style('fill', 'none')
        .style('stroke-width', 1.5)
        .style('opacity', 0.6)
        .on('mouseenter', function() {
            d3.select(this).classed('active', true).style('stroke-width', 2.5).style('opacity', 1);
        })
        .on('mouseleave', function() {
            d3.select(this).classed('active', false).style('stroke-width', 1.5).style('opacity', 0.6);
        });
    
    treatyViz.linkElements = linkElements;
    
    // Draw nodes
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
            const node = d3.select(this.parentNode);
            if (!node.classed('highlighted')) {
                d3.select(this).style('stroke', 'white').style('stroke-width', 2);
            }
        });
    
    nodeElements.filter(d => d.highlighted).selectAll('circle')
        .style('stroke', '#000')
        .style('stroke-width', 3);
    
    // Name labels
    nodeElements.append('text')
        .attr('class', d => d.highlighted ? 'node-label major' : 'node-label')
        .attr('x', d => d.radius + 3)
        .attr('y', d => -d.radius - 3)
        .attr('text-anchor', 'start')
        .attr('transform', d => `rotate(-25, ${d.radius + 3}, ${-d.radius - 3})`)
        .style('opacity', d => d.highlighted ? 1 : 0)
        .style('font-size', d => d.highlighted ? '11px' : '9px')
        .style('font-weight', d => d.highlighted ? 600 : 400)
        .style('fill', '#000')
        .style('pointer-events', 'none')
        .text(d => d.shortName);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
        // Update link positions and gradients
        linkElements.each(function(d, i) {
            const link = d3.select(this);
            
            // Update line position
            link
                .attr('x1', d.source.x)
                .attr('y1', d.source.y)
                .attr('x2', d.target.x)
                .attr('y2', d.target.y);
            
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
            
            // Update gradient direction
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
        
        nodeElements
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
            );
        
        nodeElements
            .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);
        
        nodeElements.each(function(d) {
            const node = d3.select(this);
            const label = node.select('text');
            
            if (!label.empty()) {
                label.style('opacity', connectedIds.has(d.id) ? 1 : 0);
            }
        });
    }
    
    function unhighlightConnections() {
        linkElements
            .classed('active', false)
            .style('opacity', 0.6);
        nodeElements.style('opacity', 1);
        
        nodeElements.each(function(d) {
            const node = d3.select(this);
            const label = node.select('text');
            
            if (!label.empty()) {
                label.style('opacity', d.highlighted ? 1 : 0);
            }
        });
    }
    
    console.log('Force-directed visualization complete:', nodes.length, 'nodes,', links.length, 'links');
}

// NEW: Zoom functions
function zoomToNode(nodeId, scale = 3, duration = 1000) {
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
        );
}

function zoomToYearRange(startYear, endYear, scale = 2, duration = 1000) {
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
    treatyViz.svg.transition()
        .duration(duration)
        .call(
            treatyViz.zoom.transform,
            d3.zoomIdentity.translate(config.margin.left, config.margin.top)
        );
}

// NEW: Setup scroll observer
function setupScrollObserver() {
    const captions = document.querySelectorAll('#treaties .caption');
    
    if (captions.length === 0) {
        console.warn('No captions found for scroll observer');
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
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
    
    captions.forEach(caption => observer.observe(caption));
    
    console.log('Scroll observer setup for', captions.length, 'captions');
}

function handleCaptionChange(index) {
    console.log('Caption changed to:', index);
    
    switch(index) {
        case 0:
            resetZoom();
            break;
            
        case 1:
            zoomToNode('Treaty-UN-1961', 3);
            break;
            
        case 2:
            zoomToYearRange(1970, 1980, 2.5);
            break;
            
        case 3:
            resetZoom();
            break;
            
        default:
            resetZoom();
    }
}

// Expose for debugging
window.treatyViz = treatyViz;
window.zoomToNode = zoomToNode;
window.zoomToYearRange = zoomToYearRange;
window.resetZoom = resetZoom;