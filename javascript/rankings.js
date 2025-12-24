// ============================================
// RANKINGS VISUALIZATION JAVASCRIPT
// All IDs prefixed with "rankings-" to prevent conflicts
// ============================================

// ============================================
// DATA STRUCTURES
// ============================================

// Seizure data variables
let rawSeizureData = [];
let processedSeizureData = {};

// Prevalence data variables
let rawPrevalenceData = [];
let processedPrevalenceData = {};

// Prisoners data variables
let rawPrisonersData = [];
let processedPrisonersData = {};

// Country name mapping
const countryNameMapping = {
    'United States of America': 'USA',
    'Bolivia (Plurinational State of)': 'Bolivia',
    'Netherlands (Kingdom of the)': 'Netherlands'
};

// Country flag emojis
const countryFlags = {
    'France': '🇫🇷',
    'Greece': '🇬🇷',
    'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹',
    'Spain': '🇪🇸',
    'Sweden': '🇸🇪',
    'Peru': '🇵🇪',
    'Colombia': '🇨🇴',
    'USA': '🇺🇸',
    'Bolivia': '🇧🇴',
    'Brazil': '🇧🇷',
    'Belgium': '🇧🇪'
};

// For all time-series metrics
let timeSeriesTimeRange = 3;
let timeSeriesCalculationMode = 'average';

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


// ============================================
// SEIZURE DATA LOADING & PROCESSING
// ============================================

async function loadSeizureData() {
    try {
        console.log('Loading seizure data from CSV...');
        
        rawSeizureData = await d3.csv('./data/seizures_by_year.csv', d => {
            let countryName = d.Country;
            if (countryNameMapping[countryName]) {
                countryName = countryNameMapping[countryName];
            }
            
            return {
                country: countryName,
                year: +d.Year,
                seizures: +d.Seizures_kg
            };
        });
        
        console.log(`✓ Loaded ${rawSeizureData.length} seizure records`);
        console.log(`  Countries: ${[...new Set(rawSeizureData.map(d => d.country))].length}`);
        console.log(`  Years: ${Math.min(...rawSeizureData.map(d => d.year))}-${Math.max(...rawSeizureData.map(d => d.year))}`);
        
        processSeizureData();
        
        return true;
        
    } catch (error) {
        console.error('Error loading seizure data:', error);
        console.error('Make sure data/seizures_by_year.csv exists in your repository');
        return false;
    }
}

function processSeizureData() {
    if (rawSeizureData.length === 0) {
        console.warn('No raw seizure data to process');
        return;
    }
    
    const countries = [...new Set(rawSeizureData.map(d => d.country))];
    const MIN_YEAR = 2010;
    const MAX_YEAR = 2023;
    
    processedSeizureData = {};
    
    countries.forEach(country => {
        const countryData = rawSeizureData
            .filter(d => d.country === country)
            .sort((a, b) => a.year - b.year);
        
        const rawTimeseries = [];
        
        for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
            const record = countryData.find(d => d.year === year);
            rawTimeseries.push(record ? record.seizures : null);
        }
        
        const validValues = rawTimeseries.filter(v => v !== null);
        
        if (validValues.length === 0) {
            console.warn(`${country} has no valid seizure data`);
            return;
        }
        
        const maxValue = Math.max(...validValues);
        const normalizedTimeseries = rawTimeseries.map(v => 
            v === null ? null : (v / maxValue) * 100
        );
        
        let calculatedValue;
        if (timeSeriesCalculationMode === 'recent') {
            calculatedValue = validValues[validValues.length - 1];
        } else if (timeSeriesCalculationMode === 'total') {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0);
        } else {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0) / lastNYears.length;
        }
        
        processedSeizureData[country] = {
            timeseries: normalizedTimeseries,
            rawTimeseries: rawTimeseries,
            calculatedValue: calculatedValue,
            totalSeizures: validValues.reduce((sum, v) => sum + v, 0),
            averagePerYear: validValues.reduce((sum, v) => sum + v, 0) / validValues.length,
            mostRecentYear: validValues[validValues.length - 1],
            yearsWithData: validValues.length,
            maxValue: maxValue
        };
    });
    
    const ranked = Object.entries(processedSeizureData)
        .sort((a, b) => b[1].calculatedValue - a[1].calculatedValue);
    
    ranked.forEach(([country, data], index) => {
        data.rank = index + 1;
    });
    
    console.log(`✓ Processed seizure data for ${countries.length} countries`);
    console.log(`  Mode: ${timeSeriesCalculationMode}, Range: last ${timeSeriesTimeRange} years`);
}

// ============================================
// PREVALENCE DATA LOADING & PROCESSING
// ============================================

async function loadPrevalenceData() {
    try {
        console.log('Loading prevalence data from CSV...');
        
        rawPrevalenceData = await d3.csv('./data/prevalence_by_year.csv', d => {
            let countryName = d.Country;
            if (countryNameMapping[countryName]) {
                countryName = countryNameMapping[countryName];
            }
            
            return {
                country: countryName,
                year: +d.Year,
                prevalence: +d.Prevalence_Percentage
            };
        });
        
        console.log(`✓ Loaded ${rawPrevalenceData.length} prevalence records`);
        
        processPrevalenceData();
        
        return true;
        
    } catch (error) {
        console.error('Error loading prevalence data:', error);
        return false;
    }
}

function processPrevalenceData() {
    if (rawPrevalenceData.length === 0) {
        console.warn('No raw prevalence data to process');
        return;
    }
    
    const countries = [...new Set(rawPrevalenceData.map(d => d.country))];
    const MIN_YEAR = 2003;
    const MAX_YEAR = 2023;
    
    processedPrevalenceData = {};
    
    countries.forEach(country => {
        const countryData = rawPrevalenceData
            .filter(d => d.country === country)
            .sort((a, b) => a.year - b.year);
        
        const rawTimeseries = [];
        for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
            const record = countryData.find(d => d.year === year);
            rawTimeseries.push(record ? record.prevalence : null);
        }
        
        const validValues = rawTimeseries.filter(v => v !== null);
        
        if (validValues.length === 0) {
            console.warn(`${country} has no valid prevalence data`);
            return;
        }
        
        const maxValue = Math.max(...validValues);
        const normalizedTimeseries = rawTimeseries.map(v => 
            v === null ? null : (v / maxValue) * 100
        );
        
        let calculatedValue;
        if (timeSeriesCalculationMode === 'recent') {
            calculatedValue = validValues[validValues.length - 1];
        } else if (timeSeriesCalculationMode === 'total') {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0);
        } else {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0) / lastNYears.length;
        }
        
        processedPrevalenceData[country] = {
            timeseries: normalizedTimeseries,
            rawTimeseries: rawTimeseries,
            calculatedValue: calculatedValue,
            yearsWithData: validValues.length,
            maxValue: maxValue
        };
    });
    
    const ranked = Object.entries(processedPrevalenceData)
        .sort((a, b) => b[1].calculatedValue - a[1].calculatedValue);
    
    ranked.forEach(([country, data], index) => {
        data.rank = index + 1;
    });
    
    console.log(`✓ Processed prevalence data for ${countries.length} countries`);
}

// ============================================
// PRISONERS DATA LOADING & PROCESSING
// ============================================

async function loadPrisonersData() {
    try {
        console.log('Loading prisoners data from CSV...');
        
        rawPrisonersData = await d3.csv('./data/prisoners_by_year.csv', d => {
            let countryName = d.Country;
            if (countryNameMapping[countryName]) {
                countryName = countryNameMapping[countryName];
            }
            
            return {
                country: countryName,
                year: +d.Year,
                percentage: +d.Drug_Prisoner_Percentage
            };
        });
        
        console.log(`✓ Loaded ${rawPrisonersData.length} prisoners records`);
        
        processPrisonersData();
        
        return true;
        
    } catch (error) {
        console.error('Error loading prisoners data:', error);
        return false;
    }
}

function processPrisonersData() {
    if (rawPrisonersData.length === 0) {
        console.warn('No raw prisoners data to process');
        return;
    }
    
    const countries = [...new Set(rawPrisonersData.map(d => d.country))];
    const MIN_YEAR = 2010;
    const MAX_YEAR = 2024;
    
    processedPrisonersData = {};
    
    countries.forEach(country => {
        const countryData = rawPrisonersData
            .filter(d => d.country === country)
            .sort((a, b) => a.year - b.year);
        
        const rawTimeseries = [];
        for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
            const record = countryData.find(d => d.year === year);
            rawTimeseries.push(record ? record.percentage : null);
        }
        
        const validValues = rawTimeseries.filter(v => v !== null);
        
        if (validValues.length === 0) {
            console.warn(`${country} has no valid prisoners data`);
            return;
        }
        
        const maxValue = Math.max(...validValues);
        const normalizedTimeseries = rawTimeseries.map(v => 
            v === null ? null : (v / maxValue) * 100
        );
        
        let calculatedValue;
        if (timeSeriesCalculationMode === 'recent') {
            calculatedValue = validValues[validValues.length - 1];
        } else if (timeSeriesCalculationMode === 'total') {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0);
        } else {
            const lastNYears = validValues.slice(-timeSeriesTimeRange);
            calculatedValue = lastNYears.reduce((sum, v) => sum + v, 0) / lastNYears.length;
        }
        
        processedPrisonersData[country] = {
            timeseries: normalizedTimeseries,
            rawTimeseries: rawTimeseries,
            calculatedValue: calculatedValue,
            yearsWithData: validValues.length,
            maxValue: maxValue
        };
    });
    
    const ranked = Object.entries(processedPrisonersData)
        .sort((a, b) => b[1].calculatedValue - a[1].calculatedValue);
    
    ranked.forEach(([country, data], index) => {
        data.rank = index + 1;
    });
    
    console.log(`✓ Processed prisoners data for ${countries.length} countries`);
}

// ============================================
// TIME-SERIES SETTINGS
// ============================================

function updateTimeSeriesSettings(range, mode) {
    timeSeriesTimeRange = range;
    timeSeriesCalculationMode = mode;
    
    processSeizureData();
    processPrevalenceData();
    processPrisonersData();
    
    updateTimeSeriesDisplay();
    
    renderAllColumns();
    
    console.log(`✓ Updated all time-series: ${mode} over last ${range} years`);
}

function updateTimeSeriesDisplay() {
    const displayEl = document.getElementById('timeseries-range-display');
    
    if (displayEl) {
        if (timeSeriesTimeRange === 14) {
            displayEl.textContent = 'All years (14)';
        } else {
            displayEl.textContent = `Last ${timeSeriesTimeRange} year${timeSeriesTimeRange > 1 ? 's' : ''}`;
        }
    }
}

// ============================================
// METRICS CONFIGURATION
// ============================================

const metricsConfig = {
    'law': {
        title: 'Law in Books',
        type: 'score',
        infoText: `<strong>Data Source:</strong> National legislation and legal codes<br>
                   <strong>Methodology:</strong> Composite index weighing criminalization scope (use, possession, exemptions) and penalty severity (max sentences, mandatory minimums)<br>
                   <strong>Coverage:</strong> 100% complete for all 12 countries<br>
                   <strong>Time Period:</strong> Current laws as of 2024`,
        getData: () => processedLawData,
        getRank: (country) => {
            if (!processedLawData[country]) return 99;
            const sorted = Object.keys(processedLawData).sort((a, b) => 
                processedLawData[b].legalPunitiveness - processedLawData[a].legalPunitiveness
            );
            return sorted.indexOf(country) + 1;
        },
        getValue: (country) => {
            if (!processedLawData[country]) return 0;
            return processedLawData[country].legalPunitiveness;
        }
    },
    'prevalence': {
        title: 'Drug Prevalence',
        type: 'sparkline',
        infoText: `<strong>Data Source:</strong> UNODC World Drug Report, national health surveys<br>
                   <strong>Methodology:</strong> Annual prevalence (%) of cocaine use among population aged 15-64<br>
                   <strong>Coverage:</strong> Varies by country (52-100% complete, 2003-2023)<br>
                   <strong>Normalization:</strong> Each country scaled to its own maximum (shows trend)`,
        getData: () => processedPrevalenceData,
        getRank: (country) => {
            if (!processedPrevalenceData[country]) return 99;
            return processedPrevalenceData[country].rank;
        },
        getValue: (country) => {
            if (!processedPrevalenceData[country]) {
                return Array(21).fill(null);
            }
            return processedPrevalenceData[country].timeseries;
        },
        getTooltipText: (country) => {
            if (!processedPrevalenceData[country]) return '';
            const data = processedPrevalenceData[country];
            const modeText = {
                'average': 'Average',
                'total': 'Total',
                'recent': 'Most Recent'
            };
            return `${modeText[timeSeriesCalculationMode]}: ${data.calculatedValue.toFixed(2)}%`;
        }
    },
    'incarceration': {
        title: 'Drug Prisoners %',
        type: 'sparkline',
        infoText: `<strong>Data Source:</strong> National prison statistics, UNODC, EMCDDA<br>
                   <strong>Methodology:</strong> Percentage of total prison population incarcerated for drug-related offenses<br>
                   <strong>Coverage:</strong> Varies by country (40-100% complete, 2010-2024)<br>
                   <strong>Normalization:</strong> Each country scaled to its own maximum (shows trend)`,
        getData: () => processedPrisonersData,
        getRank: (country) => {
            if (!processedPrisonersData[country]) return 99;
            return processedPrisonersData[country].rank;
        },
        getValue: (country) => {
            if (!processedPrisonersData[country]) {
                return Array(15).fill(null);
            }
            return processedPrisonersData[country].timeseries;
        },
        getTooltipText: (country) => {
            if (!processedPrisonersData[country]) return '';
            const data = processedPrisonersData[country];
            const modeText = {
                'average': 'Average',
                'total': 'Total',
                'recent': 'Most Recent'
            };
            return `${modeText[timeSeriesCalculationMode]}: ${data.calculatedValue.toFixed(2)}%`;
        }
    },
    'seizure': {
        title: 'Seizure Rate',
        type: 'sparkline',
        infoText: `<strong>Data Source:</strong> UNODC, national police statistics (DIRANDRO, EMCDDA, etc.)<br>
                   <strong>Methodology:</strong> Annual cocaine seizures in kilograms, validated across multiple sources<br>
                   <strong>Coverage:</strong> Varies by country (71-100% complete, 2010-2023)<br>
                   <strong>Normalization:</strong> Each country scaled to its own maximum (shows trend)`,
        getData: () => processedSeizureData,
        getRank: (country) => {
            if (!processedSeizureData[country]) return 99;
            return processedSeizureData[country].rank;
        },
        getValue: (country) => {
            if (!processedSeizureData[country]) {
                return Array(14).fill(null);
            }
            return processedSeizureData[country].timeseries;
        },
        getTooltipText: (country) => {
            if (!processedSeizureData[country]) return '';
            const data = processedSeizureData[country];
            const modeText = {
                'average': 'Average',
                'total': 'Total',
                'recent': 'Most Recent'
            };
            return `${modeText[timeSeriesCalculationMode]}: ${data.calculatedValue.toLocaleString('en-US', {maximumFractionDigits: 0})} kg`;
        }
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================

let processedLawData = {};
let hoveredCountry = null;

let columnMetrics = ['law', 'prevalence', 'incarceration'];

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
    
    let crimWeight = 0.5;
    let penaltyWeight = 0.5;
    
    if (crimSlider && penaltySlider) {
        crimWeight = parseInt(crimSlider.value) / 100;
        penaltyWeight = parseInt(penaltySlider.value) / 100;
    } else {
        console.warn('Weight sliders not found, using default 50/50 weights');
    }
    
    const countries = Object.keys(rawData);
    const allMaxPoss = countries.map(country => rawData[country].maxPoss);
    const allMaxSupply = countries.map(country => rawData[country].maxSupply);

    const normalizedMaxPoss = normalizeValues(allMaxPoss);
    const normalizedMaxSupply = normalizeValues(allMaxSupply);

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
// COLUMN MANAGEMENT
// ============================================

function changeColumnMetric(columnIndex, newMetric) {
    if (columnMetrics.includes(newMetric) && columnMetrics[columnIndex] !== newMetric) {
        alert('This metric is already displayed in another column. Please choose a different one.');
        return;
    }
    
    columnMetrics[columnIndex] = newMetric;
    
    renderAllColumns();
}

function swapColumns(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= columnMetrics.length) return;
    
    [columnMetrics[fromIndex], columnMetrics[toIndex]] = 
    [columnMetrics[toIndex], columnMetrics[fromIndex]];
    
    renderAllColumns();
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderAllColumns() {
    const grid = document.getElementById('rankings-grid');
    grid.innerHTML = '';
    
    const countries = Object.keys(rawData);
    
    columnMetrics.forEach((metricKey, columnIndex) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'ranking-column';
        columnDiv.id = `rankings-column-${columnIndex}`;
        
        if (columnIndex === 0) {
            columnDiv.classList.add('active');
        }
        
        columnDiv.innerHTML = createColumnHTML(metricKey, columnIndex);
        grid.appendChild(columnDiv);
        
        renderColumnContent(metricKey, columnIndex, countries);
    });
    
    updateMobileSelector();
    drawConnectionLines();
}

function createColumnHTML(metricKey, columnIndex) {
    const metric = metricsConfig[metricKey];
    const isFirstColumn = columnIndex === 0;
    const isLastColumn = columnIndex === columnMetrics.length - 1;
    
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
                <button class="info-btn" data-info="${metricKey}">ⓘ</button>
            </div>
        </div>
        <div id="rankings-content-${columnIndex}"></div>
    `;
}

function renderColumnContent(metricKey, columnIndex, countries) {
    const container = document.getElementById(`rankings-content-${columnIndex}`);
    const metric = metricsConfig[metricKey];
    
    // Sort countries by this metric's ranking
    const countriesToShow = [...countries].sort((a, b) => {
        return metric.getRank(a) - metric.getRank(b);
    });
    
    countriesToShow.forEach((country) => {
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
            if (!value || value.every(v => v === null)) {
                visualizationHTML = `
                    <div class="sparkline-container">
                        ${createSparkline(Array(14).fill(null), '#000')}
                    </div>
                `;
            } else {
                const sparkline = createSparkline(value, '#000');
                
                visualizationHTML = `
                    <div class="sparkline-container">
                        ${sparkline}
                    </div>
                `;
            }
        }
        
        div.innerHTML = `
            <div class="rank-number">${actualRank}.</div>
            <div class="country-name">
                <span class="country-flag">${countryFlags[country] || ''}</span>
                ${country}
            </div>
            <div class="metric-visualization">
                ${visualizationHTML}
            </div>
        `;
        
        addCountryRowListeners(div, country);
        container.appendChild(div);
    });
}

function createSparkline(timeseries, color = '#000') {
    const width = 80;
    const height = 25;
    const padding = 2;
    
    const validValues = timeseries.filter(v => v !== null && v !== undefined);
    
    if (validValues.length === 0) {
        return `<svg class="sparkline" viewBox="0 0 ${width} ${height}"></svg>`;
    }
    
    const max = Math.max(...validValues);
    const min = Math.min(...validValues);
    const range = max - min || 1;
    
    const dataPoints = timeseries.map((value, index) => {
        const x = padding + (index / (timeseries.length - 1)) * (width - 2 * padding);
        
        if (value === null || value === undefined) {
            return { x, y: null, isNull: true };
        } else {
            const y = height - padding - ((value - min) / range) * (height - 2 * padding);
            return { x, y, isNull: false };
        }
    });
    
    const pathElements = [];
    
    for (let i = 0; i < dataPoints.length - 1; i++) {
        const current = dataPoints[i];
        const next = dataPoints[i + 1];
        
        if (!current.isNull && !next.isNull) {
            pathElements.push(`
                <line 
                    x1="${current.x}" 
                    y1="${current.y}" 
                    x2="${next.x}" 
                    y2="${next.y}" 
                    stroke="${color}" 
                    stroke-width="1.5" 
                    stroke-linecap="round"
                />
            `);
        } else if (!current.isNull && next.isNull) {
            let nextValidIndex = i + 1;
            while (nextValidIndex < dataPoints.length && dataPoints[nextValidIndex].isNull) {
                nextValidIndex++;
            }
            
            if (nextValidIndex < dataPoints.length) {
                const nextValid = dataPoints[nextValidIndex];
                pathElements.push(`
                    <line 
                        x1="${current.x}" 
                        y1="${current.y}" 
                        x2="${nextValid.x}" 
                        y2="${nextValid.y}" 
                        stroke="#999" 
                        stroke-width="1" 
                        stroke-dasharray="2,2" 
                        stroke-linecap="round"
                    />
                `);
            }
        }
    }
    
    const dots = dataPoints
        .filter(p => !p.isNull)
        .map(p => `<circle cx="${p.x}" cy="${p.y}" r="1.5" fill="${color}" />`)
        .join('\n');
    
    return `
        <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            ${pathElements.join('\n')}
            ${dots}
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

/**
 * Calculate data completeness percentage for a country across all metrics
 */
function calculateDataCompleteness(country) {
    let totalDataPoints = 0;
    let availableDataPoints = 0;
    
    // Law in Books: always 100% (we have data for all countries)
    if (processedLawData[country]) {
        totalDataPoints += 1;
        availableDataPoints += 1;
    }
    
    // Prevalence: 21 years (2003-2023)
    if (processedPrevalenceData[country]) {
        const yearsWithData = processedPrevalenceData[country].yearsWithData;
        totalDataPoints += 21;
        availableDataPoints += yearsWithData;
    } else {
        totalDataPoints += 21;
    }
    
    // Incarceration: 15 years (2010-2024)
    if (processedPrisonersData[country]) {
        const yearsWithData = processedPrisonersData[country].yearsWithData;
        totalDataPoints += 15;
        availableDataPoints += yearsWithData;
    } else {
        totalDataPoints += 15;
    }
    
    // Seizures: 14 years (2010-2023)
    if (processedSeizureData[country]) {
        const yearsWithData = processedSeizureData[country].yearsWithData;
        totalDataPoints += 14;
        availableDataPoints += yearsWithData;
    } else {
        totalDataPoints += 14;
    }
    
    const overallPercentage = totalDataPoints > 0 ? 
        Math.round((availableDataPoints / totalDataPoints) * 100) : 0;
    
    return {
        overall: overallPercentage,
        law: processedLawData[country] ? 100 : 0,
        prevalence: processedPrevalenceData[country] ? 
            Math.round((processedPrevalenceData[country].yearsWithData / 21) * 100) : 0,
        incarceration: processedPrisonersData[country] ? 
            Math.round((processedPrisonersData[country].yearsWithData / 15) * 100) : 0,
        seizures: processedSeizureData[country] ? 
            Math.round((processedSeizureData[country].yearsWithData / 14) * 100) : 0
    };
}

function showTooltip(event, country) {
    const tooltip = document.getElementById('rankings-tooltip');
    if (!tooltip) return;
    
    const completeness = calculateDataCompleteness(country);
    
    // Compact header with overall completeness
    let tooltipHTML = `
        <div class="tooltip-header">
            <strong>${country}</strong>
            <span class="completeness-badge">${completeness.overall}% complete</span>
        </div>
    `;
    
    // Compact metrics display
    Object.keys(metricsConfig).forEach(metricKey => {
        const metric = metricsConfig[metricKey];
        const data = metric.getData();
        
        if (data[country]) {
            const rank = metric.getRank(country);
            const tooltipText = metric.getTooltipText ? metric.getTooltipText(country) : '';
            
            // Get completeness for this metric
            let metricCompleteness = 0;
            if (metricKey === 'law') metricCompleteness = completeness.law;
            else if (metricKey === 'prevalence') metricCompleteness = completeness.prevalence;
            else if (metricKey === 'incarceration') metricCompleteness = completeness.incarceration;
            else if (metricKey === 'seizure') metricCompleteness = completeness.seizures;
            
            tooltipHTML += `
                <div class="tooltip-row">
                    <span class="tooltip-metric-name">${metric.title}</span>
                    <span class="tooltip-rank">Rank #${rank}</span>
                    <span class="tooltip-completeness">${metricCompleteness}%</span>
                </div>`;
            
            if (tooltipText) {
                tooltipHTML += `
                    <div class="tooltip-detail">${tooltipText}</div>`;
            }
        }
    });
    
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
    
    const timeseriesSlider = document.getElementById('timeseries-range-slider');
    if (timeseriesSlider) {
        timeseriesSlider.addEventListener('input', (e) => {
            const range = parseInt(e.target.value);
            updateTimeSeriesSettings(range, timeSeriesCalculationMode);
        });
    }
    
    // Info button listeners
    initInfoButtonListeners();
}

// ============================================
// INFO BUTTON FUNCTIONS
// ============================================

function initInfoButtonListeners() {
    // Event delegation for dynamically created info buttons
    document.addEventListener('mouseenter', (e) => {
        // Safety check: ensure target exists and has classList
        if (!e.target || !e.target.classList) return;
        
        if (e.target.classList.contains('info-btn')) {
            showInfoTooltip(e.target);
        }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
        // Safety check: ensure target exists and has classList
        if (!e.target || !e.target.classList) return;
        
        if (e.target.classList.contains('info-btn')) {
            hideInfoTooltip();
        }
    }, true);
    
    // Static info buttons in sidebar
    const sidebarInfoButtons = document.querySelectorAll('.sidebar-info-btn');
    sidebarInfoButtons.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            showInfoTooltip(e.target);
        });
        btn.addEventListener('mouseleave', hideInfoTooltip);
    });
}

function showInfoTooltip(button) {
    const infoKey = button.dataset.info;
    let infoText = '';
    
    // Get info text from different sources
    if (metricsConfig[infoKey]) {
        infoText = metricsConfig[infoKey].infoText;
    } else if (infoKey === 'timeseries') {
        infoText = `<strong>Time Range Slider:</strong> Select how many years of data to include in ranking calculations (1-14 years)<br>
                    <strong>Effect:</strong> Changes which countries rank highest based on recent vs. historical performance<br>
                    <strong>Note:</strong> Sparklines always show all available years for visual context`;
    } else if (infoKey === 'weights') {
        infoText = `<strong>Purpose:</strong> Adjust the relative importance of different legal dimensions<br>
                    <strong>Criminalization Scope:</strong> What acts are criminalized (use, possession, exemptions)<br>
                    <strong>Penalty Severity:</strong> How harsh the punishments are (sentence lengths, mandatory minimums)<br>
                    <strong>Default:</strong> 50/50 weighting between both components`;
    }
    
    if (!infoText) return;
    
    let tooltip = document.getElementById('info-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'info-tooltip';
        tooltip.className = 'info-tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = infoText;
    tooltip.classList.add('visible');
    
    // Position tooltip
    const rect = button.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 8;
    
    // Keep tooltip on screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // If too close to bottom, show above
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 8;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideInfoTooltip() {
    const tooltip = document.getElementById('info-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function initRankings() {
    const container = document.querySelector('.strictness-rankings-container');
    if (!container) {
        console.warn('Rankings container not found. Skipping initialization.');
        return;
    }
    
    console.log('Initializing rankings visualization...');
    
    await loadSeizureData();
    await loadPrevalenceData();
    await loadPrisonersData();
    
    calculateLawInBooksIndex();
    
    updateWeightDisplays();
    updateTimeSeriesDisplay();
    
    renderAllColumns();
    
    initRankingsEventListeners();
    
    console.log('Rankings visualization initialized successfully.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRankings);
} else {
    initRankings();
}