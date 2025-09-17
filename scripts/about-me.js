// About Me Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    function updateThemeIcon(theme) {
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'light' ? 
                '<i class="fas fa-moon"></i>' : 
                '<i class="fas fa-sun"></i>';
        }
    }
    
    // Animate experience cards when they come into view
    function animateExperienceCards() {
        const experienceCards = document.querySelectorAll('.experience-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        experienceCards.forEach(card => {
            card.style.animationPlayState = 'paused';
            observer.observe(card);
        });
    }
    
    // Animate skill bars
    function animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width') + '%';
            bar.style.width = width;
        });
    }
    
    // Animate stats
    function animateStats() {
        const stats = [
            { element: document.getElementById('project-count'), target: 8, suffix: '+' },
            { element: document.getElementById('github-repos'), target: 15, suffix: '+' },
            { element: document.getElementById('skills-count'), target: 12, suffix: '+' }
        ];
        
        stats.forEach(stat => {
            if (stat.element) {
                animateValue(stat.element, 0, stat.target, 2000, stat.suffix);
            }
        });
    }
    
    function animateValue(element, start, end, duration, suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('skills-section')) {
                    animateSkillBars();
                }
                if (entry.target.classList.contains('about-section')) {
                    animateStats();
                }
                if (entry.target.classList.contains('experience-section')) {
                    animateExperienceCards();
                }
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observe sections
    const sectionsToAnimate = document.querySelectorAll('.skills-section, .about-section, .experience-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});