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
    if (section.id === 'treaties') return;
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Special observer for treaties h2 and h3
const treatiesHeaders = document.querySelectorAll('#treaties > h2, #treaties > h3');
treatiesHeaders.forEach((header, index) => {
    header.style.opacity = '0';
    header.style.transform = 'translateY(50px)';
    header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    
    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });
    
    headerObserver.observe(header);
});