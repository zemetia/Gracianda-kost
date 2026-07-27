# Example: Hero Scroll Animation Research

## Overview
Research for a high-impact hero section that uses scroll-based scaling and opacity transitions to create a cinematic entrance.

## Inspiration & Sources (Mandatory)
- **CodePen (Ahmad El-Dardiry)**: [https://codepen.io/ahmadatwork/pen/vYEYYpE](https://codepen.io/ahmadatwork/pen/vYEYYpE) - Great example of image scaling on scroll.
- **GSAP ScrollTrigger Docs**: [https://gsap.com/docs/v3/Plugins/ScrollTrigger/](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) - Reference for pinning elements and scrub functionality.
- **Awwwards (Refokus)**: [https://www.refokus.com/](https://www.refokus.com/) - Visual inspiration for clean, typography-heavy hero sections.

## Design Implementation
- **Visual Style**: Minimalist with large, bold typography (Inter/Outfit).
- **Color Palette**: Dark mode background (`#0a0a0a`) with vibrant accent highlights (`#00f2ff`).
- **Typography**: Display font for the heading, monospace for sub-details.

## Animation Implementation
- **Trigger**: GSAP `ScrollTrigger` with `scrub: true`.
- **Logic**: 
  - The hero image starts at `scale: 1.2`.
  - As the user scrolls, the image scales down to `1.0` and moves to the navbar position.
  - Heading text fades out (`opacity: 0`) and moves upwards.
- **Performance**: Use `will-change: transform` on the animated image.

## Code Snippet (Core Logic)
```javascript
gsap.to(".hero-image", {
  scrollTrigger: {
    trigger: ".hero-section",
    start: "top top",
    end: "bottom top",
    scrub: true,
    pin: true
  },
  scale: 1,
  y: -50,
  ease: "none"
});
```

## Considerations
- Ensure the image has a low-res placeholder for faster initial paint.
- Disable heavy animations on mobile devices if performance drops below 60fps.
