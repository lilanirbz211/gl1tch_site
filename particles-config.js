document.addEventListener('DOMContentLoaded', function () {
  if (typeof particlesJS === 'undefined') return;

  particlesJS('particles-js', {
    particles: {
      number: {
        value: 70,
        density: { enable: true, value_area: 800 }
      },
      color: {
        value: ['#8a2be2', '#a020f0', '#9b30ff', '#b039ff', '#7b1fa2', '#c060ff', '#6a0dad']
      },
      shape: {
        type: 'edge',
        stroke: { width: 0, color: '#000' }
      },
      opacity: {
        value: 0.78,
        random: true,
        anim: { enable: false }
      },
      size: {
        value: 8,
        random: true,
        anim: { enable: false }
      },
      line_linked: {
        enable: false
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: 'bottom',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: { enable: false }
      }
    },
    interactivity: {
      detect_on: 'window',
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        repulse: { distance: 120, duration: 0.4 },
        push: { particles_nb: 5 }
      }
    },
    retina_detect: true
  });
});
