// ============================================
// RANKINGS VISUALIZATION JAVASCRIPT
// All IDs prefixed with "rankings-" to prevent conflicts
// ============================================

// ============================================
// DATA STRUCTURES
// ============================================

// Law in Books - Raw data
const rawData = {
    'France': {use: 'Yes', possession: 'Yes', maxPoss: 1, personalExempt: 'No', maxSupply: 5, mandatory: 'No'},
    'Greece': {use: 'Yes', possession: 'Yes', maxPoss: 0.4, personalExempt: 'No', maxSupply: 40, mandatory: 'Yes'},
    'Netherlands': {use: 'No', possession: 'Yes', maxPoss: 1, personalExempt: 'Yes', maxSupply: 12, mandatory: 'No'},
    'Portugal': {use: 'No', possession: 'No', maxPoss: 0, personalExempt: 'No', maxSupply: 20, mandatory: 'Yes'},
    'Spain': {use: 'No', possession: 'No', maxPoss: 0, personalExempt: 'Yes', maxSupply: 12, mandatory: 'Yes'},
    'Sweden': {use: 'Yes', possession: 'Yes', maxPoss: 3, personalExempt: 'No', maxSupply: 10, mandatory: 'No'},
    'Peru': {use: 'No', possession: 'No', maxPoss: 2, personalExempt: 'No', maxSupply: 40, mandatory: 'Yes'},
    'Colombia': {use: 'No', possession: 'No', maxPoss: 30, personalExempt: 'No', maxSupply: 30, mandatory: 'Yes'},
    'USA': {use: 'No', possession: 'Yes', maxPoss: 1, personalExempt: 'No', maxSupply: 40, mandatory: 'Yes'},
    'Bolivia': {use: 'No', possession: 'Yes', maxPoss: 25, personalExempt: 'No', maxSupply: 25, mandatory: 'Yes'},
    'Brazil': {use: 'No', possession: 'Yes', maxPoss: 15, personalExempt: 'No', maxSupply: 15, mandatory: 'Yes'},
    'Belgium': {use: 'No', possession: 'Yes', maxPoss: 5, personalExempt: 'No', maxSupply: 20, mandatory: 'No'}
};

// Drug Prevalence (placeholder data - 2010-2020)
const drugPrevalenceData = {
    'USA': { rank: 1, timeseries: [85, 87, 89, 90, 92, 93, 91, 89, 88, 86, 85] },
    'Spain': { rank: 2, timeseries: [75, 78, 80, 82, 80, 78, 76, 74, 72, 70, 68] },
    'Netherlands': { rank: 3, timeseries: [65, 67, 70, 72, 71, 70, 68, 66, 65, 64, 63] },
    'Belgium': { rank: 4, timeseries: [60, 62, 64, 66, 65, 64, 62, 61, 60, 59, 58] },
    'France': { rank: 5, timeseries: [55, 57, 59, 60, 59, 58, 57, 56, 55, 54, 53] },
    'Greece': { rank: 6, timeseries: [50, 52, 54, 55, 54, 53, 52, 51, 50, 49, 48] },
    'Portugal': { rank: 7, timeseries: [45, 47, 49, 50, 49, 48, 47, 46, 45, 44, 43] },
    'Sweden': { rank: 8, timeseries: [40, 42, 44, 45, 44, 43, 42, 41, 40, 39, 38] },
    'Colombia': { rank: 9, timeseries: [38, 40, 42, 43, 42, 41, 40, 39, 38, 37, 36] },
    'Brazil': { rank: 10, timeseries: [35, 37, 39, 40, 39, 38, 37, 36, 35, 34, 33] },
    'Peru': { rank: 11, timeseries: [30, 32, 34, 35, 34, 33, 32, 31, 30, 29, 28] },
    'Bolivia': { rank: 12, timeseries: [25, 27, 29, 30, 29, 28, 27, 26, 25, 24, 23] }
};

// Incarceration Rates (placeholder data)
const incarcerationData = {
    'USA': { rate: 95, rank: 1 },
    'Brazil': { rate: 78, rank: 2 },
    'Peru': { rate: 72, rank: 3 },
    'Colombia': { rate: 68, rank: 4 },
    'Bolivia': { rate: 65, rank: 5 },
    'Greece': { rate: 52, rank: 6 },
    'Spain': { rate: 48, rank: 7 },
    'Belgium': { rate: 45, rank: 8 },
    'France': { rate: 42, rank: 9 },
    'Sweden': { rate: 38, rank: 10 },
    'Netherlands': { rate: 28, rank: 11 },
    'Portugal': { rate: 22, rank: 12 }
};

// Seizure Rates (placeholder data - 2010-2020)
const seizureData = {
    'Colombia': { rank: 1, timeseries: [95, 92, 98, 100, 97, 95, 93, 90, 88, 85, 82] },
    'USA': { rank: 2, timeseries: [70, 72, 75, 78, 80, 82, 81, 79, 77, 76, 75] },
    'Belgium': { rank: 3, timeseries: [45, 50, 55, 60, 65, 68, 70, 72, 71, 69, 68] },
    'Peru': { rank: 4, timeseries: [60, 58, 62, 65, 63, 61, 59, 57, 55, 53, 52] },
    'Brazil': { rank: 5, timeseries: [50, 52, 54, 56, 58, 57, 55, 53, 52, 50, 49] },
    'Netherlands': { rank: 6, timeseries: [38, 40, 42, 45, 47, 48, 46, 44, 42, 41, 40] },
    'Bolivia': { rank: 7, timeseries: [35, 37, 39, 41, 40, 38, 36, 35, 34, 33, 32] },
    'Spain': { rank: 8, timeseries: [32, 34, 36, 35, 33, 32, 31, 30, 29, 28, 27] },
    'France': { rank: 9, timeseries: [28, 30, 31, 30, 29, 28, 27, 26, 25, 24, 23] },
    'Greece': { rank: 10, timeseries: [22, 24, 26, 25, 24, 23, 22, 21, 20, 19, 18] },
    'Sweden': { rank: 11, timeseries: [15, 17, 19, 18, 17, 16, 15, 14, 13, 12, 11] },
    'Portugal': { rank: 12, timeseries: [10, 12, 14, 13, 12, 11, 10, 9, 8, 7, 6] }
};

// Metrics Configuration - EASY TO EXTEND!
const metricsConfig = {
    'law': {
        title: 'Law in Books',
        type: 'score',
        getData: () => processedLawData,
        getRank: (country) => {
            const sorted = Object.keys(processedLawData).sort((a, b) => 
                processedLawData[b].legalPunitiveness - processedLawData[a].legalPunitiveness
            );
            return sorted.indexOf(country) + 1;
        },
        getValue: (country) => processedLawData[country].legalPunitiveness
    },
    'prevalence': {
        title: 'Drug Prevalence',
        type: 'sparkline',
        getData: () => drugPrevalenceData,
        getRank: (country) => drugPrevalenceData[country].rank,
        getValue: (country) => drugPrevalenceData[country].timeseries
    },
    'incarceration': {
        title: 'Incarceration Rates',
        type: 'bar',
        getData: () => incarcerationData,
        getRank: (country) => incarcerationData[country].rank,
        getValue: (country) => incarcerationData[country].rate
    },
    'seizure': {
        title: 'Seizure Rate',
        type: 'sparkline',
        getData: () => seizureData,
        getRank: (country) => seizureData[country].rank,
        getValue: (country) => seizureData[country].timeseries
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================

let processedLawData = {};
let hoveredCountry = null;

// Column configuration: which metric is in which position
let columnMetrics = ['law', 'prevalence', 'incarceration']; // Default

// Sorting mode
let sortMode = 'independent'; // 'independent' or metric key (e.g., 'law', 'prevalence')

// ============================================
// CALCULATION FUNCTIONS
// ============================================

function binaryToScore(value) {
    return value.toLowerCase() === 'yes' ? 1 : 0;
}

function normalizeValues(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return values.map(() => 0.5);
    return values.map(val => (val - min) / (max - min));
}

function calculateLawInBooksIndex() {
    const crimSlider = document.getElementById('rankings-weight-criminalization');
    const penaltySlider = document.getElementById('rankings-weight-penalty');
    
    // Check if elements exist
    if (!crimSlider || !penaltySlider) {
        console.warn('Weight sliders not found');
        return;
    }
    
    const countries = Object.keys(rawData);
    const allMaxPoss = countries.map(country => rawData[country].maxPoss);
    const allMaxSupply = countries.map(country => rawData[country].maxSupply);

    const normalizedMaxPoss = normalizeValues(allMaxPoss);
    const normalizedMaxSupply = normalizeValues(allMaxSupply);

    const crimWeight = parseInt(crimSlider.value) / 100;
    const penaltyWeight = parseInt(penaltySlider.value) / 100;
    const totalWeight = crimWeight + penaltyWeight;

    const normCrimWeight = totalWeight > 0 ? crimWeight / totalWeight : 0.5;
    const normPenaltyWeight = totalWeight > 0 ? penaltyWeight / totalWeight : 0.5;

    countries.forEach((country, index) => {
        const raw = rawData[country];
        
        const useCriminal = binaryToScore(raw.use);
        const possessionCriminal = binaryToScore(raw.possession);
        const personalExempt = binaryToScore(raw.personalExempt);
        const mandatoryMinimums = binaryToScore(raw.mandatory);
        
        const normMaxPoss = normalizedMaxPoss[index];
        const normMaxSupply = normalizedMaxSupply[index];
        
        const criminalizationScope = (useCriminal + possessionCriminal + (1 - personalExempt)) / 3;
        const penaltySeverity = (normMaxPoss + normMaxSupply + mandatoryMinimums) / 3;
        
        const legalPunitiveness = normCrimWeight * criminalizationScope + normPenaltyWeight * penaltySeverity;
        
        processedLawData[country] = {
            criminalizationScope: Math.round(criminalizationScope * 1000) / 10,
            penaltySeverity: Math.round(penaltySeverity * 1000) / 10,
            legalPunitiveness: Math.round(legalPunitiveness * 1000) / 10,
            raw: raw
        };
    });
}

// ============================================
// SORTING FUNCTIONS
// ============================================

function getSortedCountries() {
    const countries = Object.keys(rawData);
    
    if (sortMode === 'independent') {
        // Return countries in their natural ranking for each metric
        return countries;
    } else {
        // Sort all countries by the selected metric
        const metric = metricsConfig[sortMode];
        return countries.sort((a, b) => {
            const rankA = metric.getRank(a);
            const rankB = metric.getRank(b);
            return rankA - rankB;
        });
    }
}

function toggleSortAll(metricKey) {
    if (sortMode === metricKey) {
        // Turn off unified sort
        sortMode = 'independent';
    } else {
        // Turn on unified sort for this metric
        sortMode = metricKey;
    }
    renderAllColumns();
}

// ============================================
// COLUMN MANAGEMENT
// ============================================

function changeColumnMetric(columnIndex, newMetric) {
    // Check if metric is already used in another column
    if (columnMetrics.includes(newMetric) && columnMetrics[columnIndex] !== newMetric) {
        alert('This metric is already displayed in another column. Please choose a different one.');
        return;
    }
    
    columnMetrics[columnIndex] = newMetric;
    
    // If the changed column had sort-all active, turn it off
    if (sortMode === columnMetrics[columnIndex]) {
        sortMode = 'independent';
    }
    
    renderAllColumns();
}

function swapColumns(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= columnMetrics.length) return;
    
    // Swap metrics
    [columnMetrics[fromIndex], columnMetrics[toIndex]] = 
    [columnMetrics[toIndex], columnMetrics[fromIndex]];
    
    // Turn off sort-all when swapping
    sortMode = 'independent';
    
    renderAllColumns();
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderAllColumns() {
    const grid = document.getElementById('rankings-grid');
    grid.innerHTML = '';
    
    const sortedCountries = getSortedCountries();
    
    columnMetrics.forEach((metricKey, columnIndex) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'ranking-column';
        columnDiv.id = `rankings-column-${columnIndex}`;
        
        if (columnIndex === 0) {
            columnDiv.classList.add('active'); // For mobile
        }
        
        columnDiv.innerHTML = createColumnHTML(metricKey, columnIndex);
        grid.appendChild(columnDiv);
        
        renderColumnContent(metricKey, columnIndex, sortedCountries);
    });
    
    updateMobileSelector();
    drawConnectionLines();
}

function createColumnHTML(metricKey, columnIndex) {
    const metric = metricsConfig[metricKey];
    const isFirstColumn = columnIndex === 0;
    const isLastColumn = columnIndex === columnMetrics.length - 1;
    const isSortActive = sortMode === metricKey;
    
    // Build metric selector options
    const metricOptions = Object.keys(metricsConfig).map(key => {
        const isUsedInOtherColumn = columnMetrics.includes(key) && columnMetrics[columnIndex] !== key;
        const selected = key === metricKey ? 'selected' : '';
        const disabled = isUsedInOtherColumn ? 'disabled' : '';
        return `<option value="${key}" ${selected} ${disabled}>${metricsConfig[key].title}</option>`;
    }).join('');
    
    return `
        <div class="column-header">
            <div class="column-top-controls">
                <div class="column-reorder">
                    <button class="reorder-btn" 
                            onclick="swapColumns(${columnIndex}, ${columnIndex - 1})"
                            ${isFirstColumn ? 'disabled' : ''}>←</button>
                    <button class="reorder-btn" 
                            onclick="swapColumns(${columnIndex}, ${columnIndex + 1})"
                            ${isLastColumn ? 'disabled' : ''}>→</button>
                </div>
                <select class="metric-selector" 
                        onchange="changeColumnMetric(${columnIndex}, this.value)">
                    ${metricOptions}
                </select>
            </div>
            <div class="column-bottom-controls">
                <div class="sort-all-control ${isSortActive ? 'active' : ''}" 
                     onclick="toggleSortAll('${metricKey}')">
                    <div class="sort-checkbox ${isSortActive ? 'checked' : ''}"></div>
                    <span>Sort All</span>
                </div>
            </div>
        </div>
        <div id="rankings-content-${columnIndex}"></div>
    `;
}

function renderColumnContent(metricKey, columnIndex, sortedCountries) {
    const container = document.getElementById(`rankings-content-${columnIndex}`);
    const metric = metricsConfig[metricKey];
    
    // Get countries sorted by this metric's ranking
    let countriesToShow;
    if (sortMode === 'independent') {
        // Sort by this metric's own ranking
        countriesToShow = [...sortedCountries].sort((a, b) => {
            return metric.getRank(a) - metric.getRank(b);
        });
    } else {
        // Use the global sort order
        countriesToShow = sortedCountries;
    }
    
    countriesToShow.forEach((country, displayIndex) => {
        const actualRank = metric.getRank(country);
        const value = metric.getValue(country);
        
        const div = document.createElement('div');
        div.className = 'country-row';
        div.dataset.country = country;
        
        let visualizationHTML = '';
        if (metric.type === 'score') {
            visualizationHTML = `<span class="score-display">${value}</span>`;
        } else if (metric.type === 'bar') {
            visualizationHTML = `
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${value}%"></div>
                </div>
            `;
        } else if (metric.type === 'sparkline') {
            visualizationHTML = `
                <div class="sparkline-container">
                    ${createSparkline(value)}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="rank-number">${displayIndex + 1}.</div>
            <div class="country-name">${country}</div>
            <div class="metric-visualization">
                ${visualizationHTML}
            </div>
        `;
        
        addCountryRowListeners(div, country);
        container.appendChild(div);
    });
}

function createSparkline(timeseries) {
    const width = 80;
    const height = 25;
    const padding = 2;
    
    const max = Math.max(...timeseries);
    const min = Math.min(...timeseries);
    const range = max - min || 1;
    
    const points = timeseries.map((value, index) => {
        const x = padding + (index / (timeseries.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');
    
    return `
        <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <polyline 
                points="${points}" 
                fill="none" 
                stroke="#000" 
                stroke-width="1.5"
            />
        </svg>
    `;
}

// ============================================
// INTERACTION FUNCTIONS
// ============================================

function addCountryRowListeners(element, country) {
    element.addEventListener('mouseenter', (e) => {
        hoveredCountry = country;
        highlightCountry(country);
        showTooltip(e, country);
    });
    
    element.addEventListener('mousemove', (e) => {
        if (hoveredCountry === country) {
            updateTooltipPosition(e);
        }
    });
    
    element.addEventListener('mouseleave', () => {
        if (hoveredCountry === country) {
            hoveredCountry = null;
            clearHighlight();
            hideTooltip();
        }
    });
}

function highlightCountry(country) {
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) return;
    
    container.querySelectorAll('.country-row').forEach(row => {
        if (row.dataset.country === country) {
            row.classList.add('highlighted');
        } else {
            row.classList.add('faded');
        }
    });
    
    drawConnectionLines();
}

function clearHighlight() {
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) return;
    
    container.querySelectorAll('.country-row').forEach(row => {
        row.classList.remove('highlighted', 'faded');
    });
    
    drawConnectionLines();
}

// ============================================
// TOOLTIP FUNCTIONS
// ============================================

function showTooltip(event, country) {
    const tooltip = document.getElementById('rankings-tooltip');
    
    // Gather all metric data for this country
    let tooltipHTML = `<div class="tooltip-header">${country}</div>`;
    
    // Law in Books
    if (processedLawData[country]) {
        const lawData = processedLawData[country];
        tooltipHTML += `
            <div class="tooltip-section">
                <div class="tooltip-section-title">Law in Books</div>
                <div class="tooltip-metric">
                    <span>Overall Score:</span>
                    <span><strong>${lawData.legalPunitiveness}/100</strong></span>
                </div>
                <div class="tooltip-metric">
                    <span>Criminalization:</span>
                    <span>${lawData.criminalizationScope}/100</span>
                </div>
                <div class="tooltip-metric">
                    <span>Penalty Severity:</span>
                    <span>${lawData.penaltySeverity}/100</span>
                </div>
            </div>
        `;
    }
    
    // Drug Prevalence
    if (drugPrevalenceData[country]) {
        const prevData = drugPrevalenceData[country];
        tooltipHTML += `
            <div class="tooltip-section">
                <div class="tooltip-section-title">Drug Prevalence (2010-2020)</div>
                <div class="tooltip-metric">
                    <span>Rank:</span>
                    <span>#${prevData.rank} of 12</span>
                </div>
                <div class="tooltip-metric">
                    <span>Trend:</span>
                    <span>${getTrendDescription(prevData.timeseries)}</span>
                </div>
            </div>
        `;
    }
    
    // Incarceration
    if (incarcerationData[country]) {
        const incarData = incarcerationData[country];
        tooltipHTML += `
            <div class="tooltip-section">
                <div class="tooltip-section-title">Incarceration Rate</div>
                <div class="tooltip-metric">
                    <span>Relative Rate:</span>
                    <span>
                        <div class="tooltip-bar">
                            <div class="tooltip-bar-fill" style="width: ${incarData.rate}%"></div>
                        </div>
                        ${incarData.rate}/100
                    </span>
                </div>
                <div class="tooltip-metric">
                    <span>Rank:</span>
                    <span>#${incarData.rank} of 12</span>
                </div>
            </div>
        `;
    }
    
    // Seizure Rate
    if (seizureData[country]) {
        const seizData = seizureData[country];
        tooltipHTML += `
            <div class="tooltip-section">
                <div class="tooltip-section-title">Seizure Rate (2010-2020)</div>
                <div class="tooltip-metric">
                    <span>Rank:</span>
                    <span>#${seizData.rank} of 12</span>
                </div>
                <div class="tooltip-metric">
                    <span>Trend:</span>
                    <span>${getTrendDescription(seizData.timeseries)}</span>
                </div>
            </div>
        `;
    }
    
    tooltip.innerHTML = tooltipHTML;
    tooltip.classList.add('visible');
    updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('rankings-tooltip');
    const offset = 15;
    
    let x = event.clientX + offset;
    let y = event.clientY + offset;
    
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
        x = event.clientX - rect.width - offset;
    }
    if (y + rect.height > window.innerHeight) {
        y = event.clientY - rect.height - offset;
    }
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('rankings-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function getTrendDescription(timeseries) {
    const first = timeseries[0];
    const last = timeseries[timeseries.length - 1];
    const diff = last - first;
    
    if (diff > 10) return '↑ Increasing';
    if (diff < -10) return '↓ Decreasing';
    return '→ Stable';
}

// ============================================
// CONNECTION LINES
// ============================================

function drawConnectionLines() {
    const canvas = document.getElementById('rankings-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!hoveredCountry) return;
    
    const rankingsContainer = document.querySelector('.strictness-rankings-container');
    if (!rankingsContainer) return;
    
    const highlightedRows = rankingsContainer.querySelectorAll('.country-row.highlighted');
    if (highlightedRows.length < 2) return;
    
    const positions = Array.from(highlightedRows).map(row => {
        const rect = row.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top
        };
    });
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < positions.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[i + 1].x, positions[i + 1].y);
        ctx.stroke();
    }
}

window.addEventListener('resize', () => {
    if (hoveredCountry) {
        drawConnectionLines();
    }
});

// ============================================
// MOBILE FUNCTIONS
// ============================================

function updateMobileSelector() {
    const selector = document.getElementById('rankings-mobile-selector');
    if (!selector) return;
    
    selector.innerHTML = columnMetrics.map((metricKey, index) => {
        const metric = metricsConfig[metricKey];
        return `<div class="mobile-tab ${index === 0 ? 'active' : ''}" 
                     onclick="showMobileColumn(${index})">
            ${metric.title}
        </div>`;
    }).join('');
}

function showMobileColumn(columnIndex) {
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) return;
    
    container.querySelectorAll('.mobile-tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === columnIndex);
    });
    
    container.querySelectorAll('.ranking-column').forEach((col, index) => {
        col.classList.toggle('active', index === columnIndex);
    });
}

// ============================================
// WEIGHT CONTROLS (Law in Books)
// ============================================

function updateWeightDisplays() {
    const crimSlider = document.getElementById('rankings-weight-criminalization');
    const penaltySlider = document.getElementById('rankings-weight-penalty');
    const crimDisplay = document.getElementById('rankings-weight-criminalization-display');
    const penaltyDisplay = document.getElementById('rankings-weight-penalty-display');
    
    // Check if elements exist
    if (!crimSlider || !penaltySlider || !crimDisplay || !penaltyDisplay) {
        console.warn('Weight display elements not found');
        return;
    }
    
    const crimWeight = parseInt(crimSlider.value);
    const penaltyWeight = parseInt(penaltySlider.value);
    const total = crimWeight + penaltyWeight;

    crimDisplay.textContent = total > 0 ? `${Math.round((crimWeight / total) * 100)}%` : '0%';
    penaltyDisplay.textContent = total > 0 ? `${Math.round((penaltyWeight / total) * 100)}%` : '0%';

    updateVariablePercentages('criminalization', Math.round((crimWeight / total) * 100));
    updateVariablePercentages('penalty', Math.round((penaltyWeight / total) * 100));
}

function updateVariablePercentages(component, componentPercentage) {
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) return;
    
    const variables = container.querySelectorAll(`[data-component="${component}"]`);
    const variableWeights = Array.from(variables).map(slider => parseInt(slider.value));
    const totalVarWeight = variableWeights.reduce((a, b) => a + b, 0);

    variables.forEach((slider) => {
        const variableWeight = parseInt(slider.value);
        const actualPercentage = totalVarWeight > 0 ? 
            Math.round((variableWeight / totalVarWeight) * componentPercentage * 10) / 10 : 0;
        
        const display = slider.nextElementSibling;
        display.textContent = `${actualPercentage}%`;
    });
}

function toggleComponent(componentId) {
    const element = document.getElementById(`rankings-variables-${componentId}`);
    const header = element.previousElementSibling;
    
    element.classList.toggle('visible');
    header.classList.toggle('expanded');
}

function resetWeights() {
    const crimSlider = document.getElementById('rankings-weight-criminalization');
    const penaltySlider = document.getElementById('rankings-weight-penalty');
    
    if (!crimSlider || !penaltySlider) {
        console.warn('Weight sliders not found');
        return;
    }
    
    crimSlider.value = 50;
    penaltySlider.value = 50;
    
    const container = document.querySelector('.strictness-rankings-container');
    if (container) {
        container.querySelectorAll('.variable-slider').forEach(slider => {
            slider.value = 33.3;
        });
    }
    
    updateWeightDisplays();
    calculateLawInBooksIndex();
    renderAllColumns();
}

// ============================================
// EVENT LISTENERS
// ============================================

function initRankingsEventListeners() {
    const crimSlider = document.getElementById('rankings-weight-criminalization');
    const penaltySlider = document.getElementById('rankings-weight-penalty');
    
    if (crimSlider) {
        crimSlider.addEventListener('input', () => {
            updateWeightDisplays();
            calculateLawInBooksIndex();
            renderAllColumns();
        });
    }

    if (penaltySlider) {
        penaltySlider.addEventListener('input', () => {
            updateWeightDisplays();
            calculateLawInBooksIndex();
            renderAllColumns();
        });
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('variable-slider')) {
            updateWeightDisplays();
            calculateLawInBooksIndex();
            renderAllColumns();
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

function initRankings() {
    // Check if the rankings container exists
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) {
        console.warn('Rankings container not found. Skipping initialization.');
        return;
    }
    
    console.log('Initializing rankings visualization...');
    
    updateWeightDisplays();
    calculateLawInBooksIndex();
    renderAllColumns();
    initRankingsEventListeners();
    
    console.log('Rankings visualization initialized successfully.');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRankings);
} else {
    initRankings();
}