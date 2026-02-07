document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Typewriter / Reveal Animation ---
    const titleElement = document.querySelector('.article-title');
    if (titleElement) {
        const text = titleElement.innerText;
        titleElement.innerHTML = '';

        // Split text into characters/words for finer control (using simple span wrap)
        [...text].forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.opacity = '0';
            titleElement.appendChild(span);
        });

        // Animate them
        gsap.to('.article-title span', {
            opacity: 1,
            duration: 0.05,
            stagger: 0.05,
            ease: "power2.inOut",
            delay: 0.5
        });
    }

    // --- 2. Parallax Hero Effect ---
    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        gsap.to(heroImage, {
            yPercent: 30, // Move image down by 30% of its height
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-image",
                start: "top top", // Start when hero top hits viewport top
                end: "bottom top",
                scrub: true
            }
        });
    }

    // --- 3. Particle Background ---
    const canvas = document.getElementById('particles-js');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1; // Size between 1 and 4
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                this.color = `rgba(50, 50, 50, ${Math.random() * 0.2})`; // Grayish, semi-transparent
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Bounce off edges
                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle());
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        };

        initParticles();
        animateParticles();
    }

    // --- 4. Preloader ---
    const preloader = document.getElementById('preloader');
    let preloaderFaded = false;

    const fadeOutPreloader = () => {
        if (preloaderFaded || !preloader) return;
        preloaderFaded = true;
        gsap.to(preloader, {
            opacity: 0,
            duration: 1,
            onComplete: () => preloader.style.display = 'none'
        });
    };

    // We'll trigger fadeout from the scroll animation section after images load
    // Fallback timeout if images fail to load
    window.preloaderFadeOut = fadeOutPreloader;
    setTimeout(fadeOutPreloader, 8000); // Extended fallback for large image sequences

    // --- 5. Magnetic Buttons ---
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3, // Move button slightly
                y: y * 0.3,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // --- 6. Dark Mode with Ripple ---
    const themeToggle = document.getElementById('theme-toggle');
    const overlay = document.getElementById('transition-overlay');
    const body = document.body;
    let isDark = false;

    if (themeToggle && overlay) {
        themeToggle.addEventListener('click', (e) => {
            // Get click center
            const rect = themeToggle.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Set overlay position and color
            overlay.style.left = `${x}px`;
            overlay.style.top = `${y}px`;
            overlay.style.transform = 'translate(-50%, -50%) scale(0)';

            // Determine expanding color
            overlay.style.backgroundColor = isDark ? '#f3dddd' : '#1a1a1a';

            // Animate
            const timeline = gsap.timeline();

            // Animate using fromTo to ensure consistent start state
            // Animate using fromTo to ensure consistent start state
            timeline.fromTo(overlay,
                { scale: 0 },
                {
                    scale: 500, // Expand to cover screen
                    duration: 1.5, // Reduced duration for better UX
                    ease: "power2.inOut",
                    onComplete: () => {
                        // Reset overlay state for next click
                        gsap.set(overlay, { scale: 0 });
                    }
                }
            );

            // Toggle theme halfway
            setTimeout(() => {
                body.classList.toggle('dark-mode');
                isDark = !isDark;
            }, 750); // Half of duration (1.5s / 2)
        });
    }

    // --- Original Scroll Animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    // --- GSAP Stacking Cards Animation ---

    // Select all cards
    const cards = gsap.utils.toArray(".c-card");

    if (cards.length > 0) {
        const lastCardIndex = cards.length - 1;

        // Create ScrollTrigger for the first and last card
        // We actually want the stacking effect to cover the whole section
        // The reference code creates individual STs but logic relies on lastCardST.start

        const lastCardST = ScrollTrigger.create({
            trigger: cards[cards.length - 1],
            start: "center center"
        });

        cards.forEach((card, index) => {
            const scale = 0.8; // Scale down all cards including the last one
            const scaleDown = gsap.to(card, {
                scale: scale,
                transformOrigin: "center top",
                duration: 1,
                ease: "none"
            });

            ScrollTrigger.create({
                trigger: card,
                start: "top top+=100", // Start slightly offset from top
                end: () => lastCardST.start, // Pin until last card reaches center
                pin: true,
                pinSpacing: false,
                scrub: 0.5,
                // animation: scaleDown, // Only scale down if not the last one? 
                // The reference applies scaleDown to all, but logic says scale=1 for last index.
                // Actually reference says: const scale = index === lastCardIndex ? 1 : 0.5;
                animation: scaleDown,
                markers: false,
                id: `card-${index}`
            });
        });
    }


    // --- 8. Frame-by-Frame Scroll Animation (Vanilla JS) ---
    const scrollCanvas = document.getElementById("hero-lightpass");
    if (scrollCanvas) {
        const scrollContext = scrollCanvas.getContext("2d");
        const frameCount = 240;
        const currentFrame = index => (
            `public/ezgif-frame-${index.toString().padStart(3, '0')}.png`
        );

        const images = [];
        const airpods = {
            frame: 0
        };

        // Set Canvas Dimensions
        scrollCanvas.width = window.innerWidth;
        scrollCanvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            scrollCanvas.width = window.innerWidth;
            scrollCanvas.height = window.innerHeight;
            render(); // Re-render current frame on resize
        });

        // Preload Images
        let loadedCount = 0;
        const preloadImages = () => {
            for (let i = 1; i < frameCount; i++) {
                const img = new Image();
                img.src = currentFrame(i);
                img.onload = () => {
                    loadedCount++;
                    // Fade out preloader after first 10 frames are loaded
                    if (loadedCount === 10 && window.preloaderFadeOut) {
                        window.preloaderFadeOut();
                    }
                };
                images.push(img);
            }
        };

        const img = new Image();
        img.src = currentFrame(1);
        images[0] = img; // Ensure first frame is at index 0 (technically frame 1)
        img.onload = () => {
            loadedCount++;
            render();
            // If this is the first image and we don't have scroll animation frames, fade out
            if (frameCount <= 1 && window.preloaderFadeOut) {
                window.preloaderFadeOut();
            }
        };

        // Draw Image to Canvas (Cover fit)
        const render = () => {
            let frameIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(airpods.frame)));
            let loadedImg = images[frameIndex];

            if (loadedImg && loadedImg.complete) {
                const hRatio = scrollCanvas.width / loadedImg.width;
                const vRatio = scrollCanvas.height / loadedImg.height;
                const ratio = Math.max(hRatio, vRatio);

                const centerShift_x = (scrollCanvas.width - loadedImg.width * ratio) / 2;
                const centerShift_y = (scrollCanvas.height - loadedImg.height * ratio) / 2;

                scrollContext.clearRect(0, 0, scrollCanvas.width, scrollCanvas.height);
                scrollContext.drawImage(
                    loadedImg,
                    0, 0, loadedImg.width, loadedImg.height,
                    centerShift_x, centerShift_y,
                    loadedImg.width * ratio, loadedImg.height * ratio
                );
            }
        }

        img.onload = render;
        preloadImages();

        // Scroll Handler
        const scrollContainer = document.querySelector('.scroll-sequence-container');

        if (scrollContainer) {
            window.addEventListener('scroll', () => {
                const containerRect = scrollContainer.getBoundingClientRect();
                const containerTop = containerRect.top;
                const containerHeight = containerRect.height;
                const windowHeight = window.innerHeight;

                // Calculate progress
                let scrollY = -containerTop;
                let maxScroll = containerHeight - windowHeight;

                let progress = Math.max(0, Math.min(1, scrollY / maxScroll));

                // Map progress to frame index
                airpods.frame = progress * (frameCount - 1);

                requestAnimationFrame(render);
            });
        }
    }
});
