// Lips Finder - Main JavaScript

// Modal functions
function showModal() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('signupModal').style.display = 'none';
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    
    // For MVP, just show success message
    // Later, this will send to backend
    alert('Thank you! We\'ll notify you when Lips Finder launches.');
    
    // Save to localStorage for now
    let waitlist = JSON.parse(localStorage.getItem('lipsfinder_waitlist') || '[]');
    waitlist.push({
        email: email,
        date: new Date().toISOString()
    });
    localStorage.setItem('lipsfinder_waitlist', JSON.stringify(waitlist));
    
    closeModal();
    event.target.reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('signupModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add animation on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .step');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Initial setup for animations
document.addEventListener('DOMContentLoaded', function() {
    // Set initial state for animated elements
    document.querySelectorAll('.feature-card, .step').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease-out';
    });
    
    // Trigger animations
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);
});

// Valuation Tool
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('lipPhoto');
    const uploadBox = document.querySelector('.upload-box');
    
    if (fileInput) {
        fileInput.addEventListener('change', handlePhotoUpload);
        
        // Drag and drop functionality
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#d81557';
            uploadBox.style.background = '#fce4ec';
        });
        
        uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#e91e63';
            uploadBox.style.background = 'transparent';
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handlePhotoFile(files[0]);
            }
        });
    }
});

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handlePhotoFile(file);
    }
}

function handlePhotoFile(file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Simulate valuation (in real app, this would go to backend)
    setTimeout(() => {
        const randomValue = Math.floor(Math.random() * (500 - 50) + 50);
        const messages = [
            `Amazing! Your lips could earn ${randomValue}/month! 💋`,
            `Wow! Buyers would pay up to ${randomValue} for your lip photos!`,
            `Your unique lips are valued at ${randomValue}+ monthly!`
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        alert(randomMessage + '\n\nJoin our waitlist to start earning when we launch!');
        
        // Show the email signup modal
        showModal();
    }, 2000);
}