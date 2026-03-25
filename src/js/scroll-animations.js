// Initialize Intersection Observer for scroll-based animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Get the animation type from data attribute
      const animationType = entry.target.getAttribute('data-scroll-animation');
      const animationDelay = entry.target.getAttribute('data-delay') || '0s';
      
      // Add the animation class
      entry.target.classList.add(animationType);
      entry.target.style.animationDelay = animationDelay;
      entry.target.style.animationFillMode = 'both';
      
      // Stop observing this element once animated
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all elements with data-scroll-animation attribute
document.addEventListener('DOMContentLoaded', function() {
  const scrollAnimatedElements = document.querySelectorAll('[data-scroll-animation]');
  scrollAnimatedElements.forEach(element => {
    observer.observe(element);
  });
});
