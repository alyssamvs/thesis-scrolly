// Show/hide header on scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    const coverHeight = document.querySelector('.cover').offsetHeight;
    
    if (window.scrollY > coverHeight * 0.8) { // Show when 80% down the hero
        header.classList.add('visible');
    } else {
        header.classList.remove('visible');
    }
});



// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
});

// Navigation Functions
function startStoryMode() {
    document.getElementById('supply-chain').scrollIntoView({ behavior: 'smooth' });
}

function goToDashboard() {
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}

function goToSection(section) {
    if (section === 'story') {
        startStoryMode();
    } else if (section === 'dashboard') {
        goToDashboard();
    }
}

// Dashboard Interactions
function updateVisualization() {
    const dataLayer = document.getElementById('dataLayer').value;
    const timeValue = document.getElementById('timeSlider').value;
    const country1 = document.getElementById('country1').value;
    const country2 = document.getElementById('country2').value;
    
    console.log('Updating visualization:', { dataLayer, timeValue, country1, country2 });
    
    // Here you would integrate your D3.js visualizations
    // Based on your previous network visualization patterns
}

// Time slider interaction
document.getElementById('timeSlider').addEventListener('input', function() {
    document.getElementById('timeDisplay').textContent = this.value;
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.querySelectorAll('.story-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Initialize dashboard controls
window.addEventListener('load', () => {
    updateVisualization();
});

// Example D3.js integration point (based on your previous work)
function initializeNetworkVisualization() {
    // This would use your D3.js patterns from networkviz.html
    // const svg = d3.select("#network-container").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);
    
    // Implementation would follow your force simulation patterns
    console.log('Network visualization initialized');
}
