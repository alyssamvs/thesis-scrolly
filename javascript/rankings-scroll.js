// ============================================
// STRICTNESS INDEX SCROLL INTERACTIONS
// Handles caption-triggered visualization states
// ============================================

let rankingsScrollState = {
    currentCaption: -1,
    demoCountry: 'SE', // Sweden for demonstrations
    incompletDataCountry: 'GR' // Greece has data gaps
};

/**
 * Setup scroll observer for rankings captions
 */
function setupRankingsScrollObserver() {
    const captions = document.querySelectorAll('.rankings-captions .caption');
    
    if (captions.length === 0) {
        console.warn('No rankings captions found for scroll observer');
        return;
    }
    
    console.log(`Setting up rankings scroll observer for ${captions.length} captions`);
    
    // Observer for caption changes
    const captionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.dataset.index);
                handleRankingsCaptionChange(index);
                
                // Add active class for fade-in effect
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, { 
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
    });
    
    captions.forEach(caption => captionObserver.observe(caption));
    
    console.log('Rankings scroll observer setup complete');
}

/**
 * Handle caption change and trigger appropriate visualization state
 */
function handleRankingsCaptionChange(index) {
    if (rankingsScrollState.currentCaption === index) return;
    
    console.log(`Rankings caption changed to: ${index}`);
    rankingsScrollState.currentCaption = index;
    
    // Clear previous states
    clearRankingsHighlights();
    
    // Trigger state based on caption index
    switch(index) {
        case 0:
            // Caption 0: Introduction - default state
            triggerRankingsIntroState();
            break;
        case 1:
            // Caption 1: Calculations - show tooltip and connections
            triggerRankingsCalculationsState();
            break;
        case 2:
            // Caption 2: Controls - highlight sidebar
            triggerRankingsControlsState();
            break;
        case 3:
            // Caption 3: Limitations - show incomplete data
            triggerRankingsLimitationsState();
            break;
    }
}

/**
 * Clear all highlights and demo states
 */
function clearRankingsHighlights() {
    // Remove all highlighted classes
    document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
    
    document.querySelectorAll('.demo-highlighted').forEach(el => {
        el.classList.remove('demo-highlighted');
    });
    
    // Hide tooltip
    const tooltip = document.getElementById('rankings-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible', 'demo-active');
    }
    
    // Remove canvas highlight
    const canvas = document.getElementById('rankings-canvas');
    if (canvas) {
        canvas.classList.remove('demo-active');
    }
    
    // Collapse any expanded components
    document.querySelectorAll('.component-header.expanded').forEach(header => {
        const componentId = header.parentElement.querySelector('.variable-controls')?.id;
        if (componentId) {
            const component = componentId.replace('rankings-variables-', '');
            // Only collapse if it was auto-expanded
            if (header.dataset.autoExpanded === 'true') {
                toggleComponent(component);
                delete header.dataset.autoExpanded;
            }
        }
    });
}

/**
 * Caption 0: Introduction state
 */
function triggerRankingsIntroState() {
    console.log('Triggering intro state - default view');
    // Default state - everything visible, nothing highlighted
}

/**
 * Caption 1: Calculations state
 * Shows tooltip on demo country and highlights connections
 */
function triggerRankingsCalculationsState() {
    console.log('Triggering calculations state');
    
    // Find Sweden's row in first column (Law in Books)
    const countryRows = document.querySelectorAll('.country-row');
    let swedenRow = null;
    
    countryRows.forEach(row => {
        const countryName = row.querySelector('.country-name');
        if (countryName && countryName.textContent.includes('Sweden')) {
            swedenRow = row;
        }
    });
    
    if (swedenRow) {
        // Highlight the row
        swedenRow.classList.add('demo-highlighted');
        
        // Show tooltip with a delay
        setTimeout(() => {
            // Simulate mouseover to show tooltip
            const event = new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            swedenRow.dispatchEvent(event);
            
            // Add demo-active class to tooltip after it appears
            setTimeout(() => {
                const tooltip = document.getElementById('rankings-tooltip');
                if (tooltip && tooltip.classList.contains('visible')) {
                    tooltip.classList.add('demo-active');
                }
            }, 300);
        }, 500);
    }
    
    // Highlight canvas connections
    const canvas = document.getElementById('rankings-canvas');
    if (canvas) {
        canvas.classList.add('demo-active');
    }
}

/**
 * Caption 2: Controls state
 * Highlights sidebar controls
 */
function triggerRankingsControlsState() {
    console.log('Triggering controls state');
    
    // Highlight time-series controls
    const timeseriesControls = document.querySelector('.timeseries-controls-section');
    if (timeseriesControls) {
        timeseriesControls.classList.add('highlighted');
    }
    
    // Highlight component weights section
    const weightsControls = document.querySelector('.controls-section');
    if (weightsControls) {
        weightsControls.classList.add('highlighted');
    }
    
    // Expand the first component (Criminalization Scope) as example
    setTimeout(() => {
        const criminalizationHeader = document.querySelector('.component-header');
        if (criminalizationHeader && !criminalizationHeader.classList.contains('expanded')) {
            criminalizationHeader.dataset.autoExpanded = 'true';
            toggleComponent('criminalization');
        }
    }, 800);
}

/**
 * Caption 3: Limitations state
 * Shows country with incomplete data
 */
function triggerRankingsLimitationsState() {
    console.log('Triggering limitations state');
    
    // Find Greece's row (has data gaps)
    const countryRows = document.querySelectorAll('.country-row');
    let greeceRow = null;
    
    countryRows.forEach(row => {
        const countryName = row.querySelector('.country-name');
        if (countryName && countryName.textContent.includes('Greece')) {
            greeceRow = row;
        }
    });
    
    if (greeceRow) {
        // Highlight the row
        greeceRow.classList.add('demo-highlighted');
        
        // Show tooltip with a delay
        setTimeout(() => {
            const event = new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            greeceRow.dispatchEvent(event);
            
            // Add demo-active class to tooltip
            setTimeout(() => {
                const tooltip = document.getElementById('rankings-tooltip');
                if (tooltip && tooltip.classList.contains('visible')) {
                    tooltip.classList.add('demo-active');
                }
            }, 300);
        }, 500);
    }
    
    // Could also highlight sparklines that show gaps
    const sparklines = document.querySelectorAll('.sparkline-container');
    sparklines.forEach((sparkline, index) => {
        if (index < 3) { // Highlight first few as examples
            setTimeout(() => {
                sparkline.style.outline = '2px dashed #ff0000';
                sparkline.style.outlineOffset = '2px';
            }, 1000 + (index * 200));
        }
    });
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for rankings to initialize
        setTimeout(setupRankingsScrollObserver, 1000);
    });
} else {
    setTimeout(setupRankingsScrollObserver, 1000);
}

console.log('Rankings scroll interactions loaded');