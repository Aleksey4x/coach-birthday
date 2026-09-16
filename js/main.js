// Scroll-reveal animation for elements marked with .reveal
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => observer.observe(el));

// Scroll-down button in hero
const scrollDownBtn = document.getElementById('scrollDown');
if (scrollDownBtn) {
  scrollDownBtn.addEventListener('click', () => {
    document.getElementById('message')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// Pause other audio players when one starts playing
const audios = document.querySelectorAll('audio');
audios.forEach((audio) => {
  audio.addEventListener('play', () => {
    audios.forEach((other) => {
      if (other !== audio) other.pause();
    });
  });
});
