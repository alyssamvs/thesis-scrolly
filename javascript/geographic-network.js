// Geographic Network Visualization for War as Policy Section

// Global variables
let geoViz = {
    svg: null,
    g: null,
    data: [],
    countryCoordinates: null,
    currentMetric: 'seizure_count',
    yearStart: 2011,
    yearEnd: 2016,
    width: 1400,
    height: 700,
    projection: null,
    path: null,
    tooltip: null,
    interactionEnabled: false,
    controlsEnabled: false,
    // Choropleth layer properties
    choroplethData: [],
    choroplethEnabled: false,
    choroplethYear: 2024,  // Default to most recent year
    routingEnabled: true   // Routing layer on by default
};

// Country name mapping for geographic network: seizures data -> coordinates data
const geoCountryNameMapping = {
    // Exact matches don't need mapping, but variants do
    "Bolivia (Plurinational State of)": "Bolivia",
    "Bolivia, Plurinational State of": "Bolivia",
    "Czech Republic": "Czechia",
    "Czechia": "Czechia",
    "Iran (Islamic Republic of)": "Iran",
    "Iran, Islamic Republic of": "Iran",
    "Libyan Arab Jamahiriya": "Libya",
    "Republic of Korea": "South Korea",
    "Korea, Republic of": "South Korea",
    "Republic of Moldova": "Moldova",
    "Moldova, Republic of": "Moldova",
    "Russian Federation": "Russia",
    "Serbia and Montenegro": "Serbia",
    "Tanzania": "Tanzania",
    "Tanzania, United Republic of": "Tanzania",
    "United Kingdom (England and Wales)": "United Kingdom",
    "Venezuela": "Venezuela",
    "Venezuela, Bolivarian Republic of": "Venezuela",
    "Viet Nam": "Vietnam",
    "Vietnam": "Vietnam",
    // United States variations
    "United States": "United States of America",
    "USA": "United States of America",
    // Dominican Republic
    "Dominican Republic": "Dominican Rep.",
    // Bosnia
    "Bosnia and Herzegovina": "Bosnia and Herz.",
    // Additional mappings for partial matches
    "China": "China",
    "Korea": "South Korea"
};

// Function to normalize country names for geographic network
function geoNormalizeCountryName(name) {
    // Remove quotes and trim
    name = name.replace(/^"|"$/g, '').trim();
    
    // Check if we have a mapping
    if (geoCountryNameMapping[name]) {
        return geoCountryNameMapping[name];
    }
    
    return name;
}

// Process choropleth data for a specific year
function processChoroplethData(year) {
    if (!geoViz.choroplethData || geoViz.choroplethData.length === 0) {
        return new Map();
    }
    
    const dataByCountry = new Map();
    
    geoViz.choroplethData.forEach(d => {
        if (d.Year && parseInt(d.Year) === year) {
            const countryName = geoNormalizeCountryName(d['Country/Territory of Seizure']);
            const quantity = parseFloat(d['Quantity Seized']);
            
            if (!isNaN(quantity) && countryName) {
                // If country already has data for this year, sum it
                if (dataByCountry.has(countryName)) {
                    dataByCountry.set(countryName, dataByCountry.get(countryName) + quantity);
                } else {
                    dataByCountry.set(countryName, quantity);
                }
            }
        }
    });
    
    console.log(`Processed choropleth data for ${year}: ${dataByCountry.size} countries`);
    return dataByCountry;
}

// Create projection
geoViz.projection = d3.geoMercator()
    .scale(200)
    .center([0, 20])
    .translate([geoViz.width / 2, geoViz.height / 2]);

geoViz.path = d3.geoPath().projection(geoViz.projection);

// Initialize chart
function initGeoChart() {
    const container = d3.select("#map-container");
    
    geoViz.svg = container
        .append("svg")
        .attr("width", geoViz.width)
        .attr("height", geoViz.height);

    geoViz.g = geoViz.svg.append("g");
    
    geoViz.tooltip = d3.select("#tooltip");
}

// Load data
function loadGeoData() {
    return Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        d3.json('./data/country_coordinates.json'),
        d3.csv('./data/seizures_routing_network_data.csv'),
        d3.csv('./data/full_ids_seizuresperyear.csv')
    ]);
}

// Check if route is in year range
function isRouteInYearRange(route, startYear, endYear) {
    const routeStart = parseInt(route.first_year);
    const routeEnd = parseInt(route.last_year);
    return routeEnd >= startYear && routeStart <= endYear;
}

// Process data
function processGeoData(data, metric, startYear, endYear) {
    console.log("Processing", data.length, "routes for geographic network");
    
    // Filter by seizure count, valid coordinates, and year range
    const filteredData = data.filter(d => {
        return d.seizure_count > 3 && 
               d.DEPARTURE_COUNTRY !== d.DESTINATION_COUNTRY &&
               geoViz.countryCoordinates[d.DEPARTURE_COUNTRY] && 
               geoViz.countryCoordinates[d.DESTINATION_COUNTRY] &&
               isRouteInYearRange(d, startYear, endYear);
    });
    
    console.log("After filtering:", filteredData.length, "routes for years", startYear, "-", endYear);
    
    // Create nodes from unique countries
    const nodeMap = new Map();
    const nodes = [];
    
    filteredData.forEach(d => {
        [d.DEPARTURE_COUNTRY, d.DESTINATION_COUNTRY].forEach(country => {
            if (!nodeMap.has(country)) {
                const coords = geoViz.countryCoordinates[country];
                const projected = geoViz.projection([coords.lon, coords.lat]);
                const node = {
                    id: country,
                    name: country,
                    lat: coords.lat,
                    lon: coords.lon,
                    x: projected[0],
                    y: projected[1],
                    totalSeizures: 0,
                    totalQuantity: 0,
                    connections: 0
                };
                nodeMap.set(country, node);
                nodes.push(node);
            }
        });
    });
    
    // Calculate node sizes based on total activity
    filteredData.forEach(d => {
        const source = nodeMap.get(d.DEPARTURE_COUNTRY);
        const target = nodeMap.get(d.DESTINATION_COUNTRY);
        
        if (source && target) {
            source.totalSeizures += d.seizure_count;
            source.totalQuantity += d.total_quantity_kg;
            source.connections += 1;
            
            target.totalSeizures += d.seizure_count;
            target.totalQuantity += d.total_quantity_kg;
            target.connections += 1;
        }
    });

    // Create routes
    const routes = filteredData.map(d => {
        const source = nodeMap.get(d.DEPARTURE_COUNTRY);
        const target = nodeMap.get(d.DESTINATION_COUNTRY);
        
        return {
            source: source,
            target: target,
            value: d[metric],
            seizure_count: d.seizure_count,
            total_quantity_kg: d.total_quantity_kg,
            departure: d.DEPARTURE_COUNTRY,
            destination: d.DESTINATION_COUNTRY,
            first_year: d.first_year,
            last_year: d.last_year
        };
    });

    return { nodes: nodes, routes: routes };
}

// Create curved path for routes
function createRoutePath(d) {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
    
    return "M" + d.source.x + "," + d.source.y + 
           "A" + dr + "," + dr + " 0 0,1 " + 
           d.target.x + "," + d.target.y;
}

// Update visualization
function updateGeoVisualization() {
    if (geoViz.data.length === 0 || !geoViz.countryCoordinates) {
        console.log("Waiting for geo data...");
        return;
    }

    // Clear previous routes and nodes (keep map)
    geoViz.g.selectAll(".route").remove();
    geoViz.g.selectAll(".node-circle").remove();
    geoViz.g.selectAll(".node-label").remove();
    
    // Render choropleth layer if enabled
    if (geoViz.choroplethEnabled) {
        const choroplethData = processChoroplethData(geoViz.choroplethYear);
        
        // Create color scale for choropleth (grayscale) - using log scale for outliers
        const seizureValues = Array.from(choroplethData.values());
        const minSeizure = d3.min(seizureValues.filter(v => v > 0)) || 0.01; // Avoid log(0)
        const maxSeizure = d3.max(seizureValues);
        
        const choroplethScale = d3.scaleLog()
            .domain([minSeizure, maxSeizure])
            .range(["#f0f0f0", "#333333"])
            .clamp(true);  // Clamp values outside domain
        
        console.log("Choropleth max seizure:", maxSeizure);
        console.log("Number of .country elements:", geoViz.g.selectAll(".country").size());
        
        // Update country colors
        geoViz.g.selectAll(".country")
            .style("fill", function(d) {
                const countryName = d.properties.name;
                const seizureAmount = choroplethData.get(countryName);
                
                if (seizureAmount !== undefined) {
                    return choroplethScale(seizureAmount);
                }
                return "#e0e0e0";
            })
            .on("mouseover", function(event, d) {
                if (!geoViz.interactionEnabled) return;
                
                const countryName = d.properties.name;
                const seizureAmount = choroplethData.get(countryName);
                
                if (seizureAmount !== undefined) {
                    geoViz.tooltip
                        .style("opacity", 1)
                        .html("<strong>" + countryName + "</strong><br/>" +
                              "Year: " + geoViz.choroplethYear + "<br/>" +
                              "Seizures: " + seizureAmount.toFixed(2) + " kg")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                }
            })
            .on("mouseout", function() {
                if (!geoViz.interactionEnabled) return;
                geoViz.tooltip.style("opacity", 0);
            });
    } else {
        // Reset country colors to default
        geoViz.g.selectAll(".country")
            .style("fill", "#e0e0e0")
            .on("mouseover", null)
            .on("mouseout", null);
    }

    const processed = processGeoData(
        geoViz.data, 
        geoViz.currentMetric, 
        geoViz.yearStart, 
        geoViz.yearEnd
    );
    
    console.log("Creating map with", processed.nodes.length, "nodes and", processed.routes.length, "routes");

    // Create scales
    const maxValue = d3.max(processed.routes, d => d.value);
    const routeScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0.5, 8]);

    const maxConnections = d3.max(processed.nodes, d => d.connections);
    const nodeScale = d3.scaleLinear()
        .domain([0, maxConnections])
        .range([4, 20]);

    // Add routes (only if routing layer is enabled)
    if (geoViz.routingEnabled) {
        geoViz.g.append("g")
            .attr("class", "routes-layer")
            .selectAll(".route")
            .data(processed.routes)
            .enter().append("path")
            .attr("class", "route")
            .attr("d", createRoutePath)
            .attr("stroke", d => {
                const intensity = d.value / maxValue;
                return d3.interpolateReds(0.3 + intensity * 0.6);
            })
            .attr("stroke-width", d => routeScale(d.value))
            .on("mouseover", function(event, d) {
                if (!geoViz.interactionEnabled) return;
                
                d3.select(this).attr("stroke-opacity", 0.9);
                geoViz.tooltip
                    .style("opacity", 1)
                    .html("<strong>" + d.departure + " → " + d.destination + "</strong><br/>" +
                          "Years Active: " + d.first_year + " - " + d.last_year + "<br/>" +
                          "Seizures: " + d.seizure_count.toLocaleString() + "<br/>" +
                          "Total Quantity: " + d.total_quantity_kg.toLocaleString() + " kg<br/>" +
                          "Avg per Seizure: " + (d.total_quantity_kg / d.seizure_count).toFixed(2) + " kg")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                if (!geoViz.interactionEnabled) return;
                
                d3.select(this).attr("stroke-opacity", 0.5);
                geoViz.tooltip.style("opacity", 0);
            });
    }

    // Add nodes (only if routing layer is enabled)
    if (geoViz.routingEnabled) {
        geoViz.g.append("g")
            .attr("class", "nodes-layer")
            .selectAll(".node-circle")
            .data(processed.nodes)
            .enter().append("circle")
            .attr("class", "node-circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => nodeScale(d.connections))
            .attr("fill", d => {
                const intensity = d.connections / maxConnections;
                return d3.interpolateOranges(0.4 + intensity * 0.5);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                if (!geoViz.interactionEnabled) return;
                
                geoViz.tooltip
                    .style("opacity", 1)
                    .html("<strong>" + d.name + "</strong><br/>" +
                          "Connections: " + d.connections + "<br/>" +
                          "Total Seizures: " + d.totalSeizures.toLocaleString() + "<br/>" +
                          "Total Quantity: " + d.totalQuantity.toLocaleString() + " kg")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                if (!geoViz.interactionEnabled) return;
                
                geoViz.tooltip.style("opacity", 0);
            });
    }

    // Add labels for major hubs (top 20) (only if routing layer is enabled)
    if (geoViz.routingEnabled) {
        const sortedNodes = processed.nodes.slice().sort((a, b) => b.connections - a.connections);
        const topNodes = sortedNodes.slice(0, 20);

        geoViz.g.append("g")
            .attr("class", "labels-layer")
            .selectAll(".node-label")
            .data(topNodes)
            .enter().append("text")
            .attr("class", "node-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y + nodeScale(d.connections) + 12)
            .text(d => d.name)
            .style("font-size", d => Math.min(11, Math.max(8, nodeScale(d.connections) / 1.5)) + "px")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white")
            .style("pointer-events", "none");
    }
}

// Update slider range visual
function updateSliderRange() {
    const rangeDiv = document.getElementById('geo-slider-range');
    if (!rangeDiv) return;
    
    const startPercent = ((geoViz.yearStart - 2011) / (2016 - 2011)) * 100;
    const endPercent = ((geoViz.yearEnd - 2011) / (2016 - 2011)) * 100;
    
    rangeDiv.style.left = startPercent + '%';
    rangeDiv.style.width = (endPercent - startPercent) + '%';
}

// Update year display
function updateYearDisplay() {
    const display = document.getElementById('geo-year-range-display');
    if (display) {
        display.textContent = geoViz.yearStart + ' - ' + geoViz.yearEnd;
    }
}

// Enable/disable controls
function setControlsEnabled(enabled) {
    geoViz.controlsEnabled = enabled;
    const controls = document.querySelector('#war-as-policy .map-controls');
    if (controls) {
        if (enabled) {
            controls.classList.add('interactive');
        } else {
            controls.classList.remove('interactive');
        }
    }
}

// Setup control event listeners
function setupGeoControls() {
    // Metric buttons
    const metricBtns = document.querySelectorAll('#war-as-policy .metric-btn');
    metricBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!geoViz.controlsEnabled) return;
            
            const metric = this.dataset.metric;
            geoViz.currentMetric = metric;
            
            // Update button states
            metricBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            updateGeoVisualization();
        });
    });
    
    // Year sliders
    const startSlider = document.getElementById('geo-year-start');
    const endSlider = document.getElementById('geo-year-end');
    
    function handleSliderChange() {
        if (!geoViz.controlsEnabled) return;
        
        let start = parseInt(startSlider.value);
        let end = parseInt(endSlider.value);
        
        // Ensure start is not greater than end
        if (start > end) {
            if (event.target.id === 'geo-year-start') {
                startSlider.value = end;
                start = end;
            } else {
                endSlider.value = start;
                end = start;
            }
        }
        
        geoViz.yearStart = start;
        geoViz.yearEnd = end;
        
        updateSliderRange();
        updateYearDisplay();
        updateGeoVisualization();
    }
    
    if (startSlider) startSlider.addEventListener('input', handleSliderChange);
    if (endSlider) endSlider.addEventListener('input', handleSliderChange);
    
    // Reset button
    const resetBtn = document.getElementById('geo-reset-year');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (!geoViz.controlsEnabled) return;
            
            geoViz.yearStart = 2011;
            geoViz.yearEnd = 2016;
            startSlider.value = 2011;
            endSlider.value = 2016;
            
            updateSliderRange();
            updateYearDisplay();
            updateGeoVisualization();
        });
    }
    
    // Layer toggles
    const routingToggle = document.getElementById('routing-toggle');
    const choroplethToggle = document.getElementById('choropleth-toggle');
    
    if (routingToggle) {
        routingToggle.addEventListener('change', function() {
            if (!geoViz.controlsEnabled) return;
            
            geoViz.routingEnabled = this.checked;
            updateGeoVisualization();
        });
    }
    
    if (choroplethToggle) {
        choroplethToggle.addEventListener('change', function() {
            if (!geoViz.controlsEnabled) return;
            
            geoViz.choroplethEnabled = this.checked;
            updateGeoVisualization();
        });
    }
    // Choropleth timeline scrubber
    const choroplethScrubber = document.getElementById('choropleth-year-scrubber');
    const choroplethYearDisplay = document.getElementById('choropleth-year-display');
    
    if (choroplethScrubber) {
        choroplethScrubber.addEventListener('input', function() {
            if (!geoViz.controlsEnabled || !geoViz.choroplethEnabled) return;
            
            const year = parseInt(this.value);
            geoViz.choroplethYear = year;
            
            // Update display
            if (choroplethYearDisplay) {
                choroplethYearDisplay.textContent = year;
            }
            
            // Update visualization
            updateGeoVisualization();
        });
    }
    console.log('Geographic controls setup complete');
}

// Handle caption changes
function handleGeoCaption(index) {
    console.log("Geographic network caption:", index);
    
    switch(index) {
        case 0:
            // Introduction - show full network
            geoViz.currentMetric = 'seizure_count';
            geoViz.yearStart = 2011;
            geoViz.yearEnd = 2016;
            geoViz.interactionEnabled = false;
            setControlsEnabled(false);
            updateGeoVisualization();
            updateSliderRange();
            updateYearDisplay();
            break;
            
        case 1:
            // Explain metrics - switch to quantity
            geoViz.currentMetric = 'total_quantity_kg';
            geoViz.interactionEnabled = false;
            setControlsEnabled(false);
            
            // Update button states
            const metricBtns = document.querySelectorAll('#war-as-policy .metric-btn');
            metricBtns.forEach(btn => {
                if (btn.dataset.metric === 'total_quantity_kg') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            updateGeoVisualization();
            break;
            
        case 2:
            // Show color/intensity - back to seizure count
            geoViz.currentMetric = 'seizure_count';
            geoViz.interactionEnabled = false;
            setControlsEnabled(false);
            
            // Update button states
            const metricBtns2 = document.querySelectorAll('#war-as-policy .metric-btn');
            metricBtns2.forEach(btn => {
                if (btn.dataset.metric === 'seizure_count') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            updateGeoVisualization();
            break;
            
        case 3:
            // Show year filtering - focus on specific period
            geoViz.yearStart = 2013;
            geoViz.yearEnd = 2015;
            geoViz.interactionEnabled = false;
            setControlsEnabled(false);
            
            // Update sliders
            const startSlider = document.getElementById('geo-year-start');
            const endSlider = document.getElementById('geo-year-end');
            if (startSlider) startSlider.value = 2013;
            if (endSlider) endSlider.value = 2015;
            
            updateSliderRange();
            updateYearDisplay();
            updateGeoVisualization();
            break;
            
        case 4:
            
                // Enable exploration - reset to full range and turn on choropleth
                geoViz.yearStart = 2011;
                geoViz.yearEnd = 2016;
                geoViz.interactionEnabled = true;
                geoViz.choroplethEnabled = true;  // Auto-enable choropleth
                setControlsEnabled(true);
                
                // Update checkbox state
                const choroplethToggle = document.getElementById('choropleth-toggle');
                if (choroplethToggle) {
                    choroplethToggle.checked = true;
                }
                
                // Reset sliders
                const startSlider2 = document.getElementById('geo-year-start');
                const endSlider2 = document.getElementById('geo-year-end');
                if (startSlider2) startSlider2.value = 2011;
                if (endSlider2) endSlider2.value = 2016;
                
                updateSliderRange();
                updateYearDisplay();
                updateGeoVisualization();
                break;
    }
}

// Setup scroll observer
function setupGeoScrollObserver() {
    const captions = document.querySelectorAll('#war-as-policy .caption');
    
    if (captions.length === 0) {
        console.warn('No captions found for geographic network');
        return;
    }
    
    const captionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.dataset.index);
                handleGeoCaption(index);
            }
        });
    }, { 
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
    });
    
    captions.forEach(caption => captionObserver.observe(caption));
    
    console.log('Geographic scroll observer setup for', captions.length, 'captions');
}

// Initialize
function initGeoNetwork() {
    initGeoChart();
    
    loadGeoData().then(([worldData, coordinates, csvData, seizuresPerYear]) => {
        console.log("Geographic data loaded successfully");
        
        geoViz.countryCoordinates = coordinates;
        
        // Convert strings to numbers in CSV
        csvData.forEach(d => {
            d.seizure_count = +d.seizure_count;
            d.total_quantity_kg = +d.total_quantity_kg;
        });
        
        geoViz.data = csvData;

        // Store choropleth data
        geoViz.choroplethData = seizuresPerYear;
        console.log("Loaded", seizuresPerYear.length, "seizures per year records");
        
        // Draw world map
        const countries = topojson.feature(worldData, worldData.objects.countries);
        
        geoViz.g.append("g")
            .attr("class", "countries")
            .selectAll(".country")
            .data(countries.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", geoViz.path)
            .style("fill", "#e0e0e0")
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
        
        // Setup controls
        setupGeoControls();
        
        // Initial visualization
        updateGeoVisualization();
        updateSliderRange();
        
        // Setup scroll observer
        setupGeoScrollObserver();
        
    }).catch(error => {
        console.error("Error loading geographic data:", error);
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeoNetwork);
} else {
    initGeoNetwork();
}