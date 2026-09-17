// ---------- Scroll-reveal ----------
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => revealObserver.observe(el));

// ---------- Hero scroll-down button ----------
document.getElementById('scrollDown')?.addEventListener('click', () => {
  document.getElementById('counter')?.scrollIntoView({ behavior: 'smooth' });
});

// ---------- Hero reel: cycle role cards ----------
const heroReel = document.getElementById('heroReel');
if (heroReel) {
  const cards = Array.from(heroReel.querySelectorAll('.reel-card'));
  let activeIndex = 0;

  setInterval(() => {
    if (activeIndex >= cards.length - 1) return; // stop on "Это Стас!"
    cards[activeIndex].classList.remove('is-active');
    activeIndex += 1;
    cards[activeIndex].classList.add('is-active');
  }, 1400);
}

// ---------- Age counter ----------
const ageCounterEl = document.getElementById('ageCounter');
const countBtn = document.getElementById('countBtn');
const sfxBadumtss = document.getElementById('sfxBadumtss');
const sfxAirhorn = document.getElementById('sfxAirhorn');

function playSfx(el) {
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}

function randomFakeAge() {
  return 50 + Math.floor(Math.random() * 40); // 50-89
}

countBtn?.addEventListener('click', () => {
  if (countBtn.disabled) return;
  countBtn.disabled = true;
  playSfx(sfxAirhorn);

  const totalDurationMs = 3200;
  const startTime = performance.now();
  const pauses = [0.35, 0.6, 0.8].map((p) => p * totalDurationMs);
  let nextPauseIdx = 0;
  let tickTimeout;

  function tick() {
    const elapsed = performance.now() - startTime;

    if (nextPauseIdx < pauses.length && elapsed >= pauses[nextPauseIdx]) {
      nextPauseIdx += 1;
      ageCounterEl.textContent = randomFakeAge();
      playSfx(sfxBadumtss);
      tickTimeout = setTimeout(tick, 260);
      return;
    }

    if (elapsed >= totalDurationMs) {
      ageCounterEl.textContent = '45';
      countBtn.textContent = 'Посчитано!';
      return;
    }

    ageCounterEl.textContent = Math.floor(Math.random() * 100);
    const speed = 40 + (elapsed / totalDurationMs) * 80; // slows down over time
    tickTimeout = setTimeout(tick, speed);
  }

  tick();
});

// ---------- Gallery: pause background parallax not needed yet (phase 2) ----------

// ---------- Video with center play button ----------
const povVideo = document.getElementById('povVideo');
const povPlayBtn = document.getElementById('povPlayBtn');

povPlayBtn?.addEventListener('click', () => {
  povVideo.play();
  povPlayBtn.classList.add('is-hidden');
});

povVideo?.addEventListener('pause', () => {
  povPlayBtn.classList.remove('is-hidden');
});

povVideo?.addEventListener('ended', () => {
  povPlayBtn.classList.remove('is-hidden');
});

// ---------- Telegram-style voice message at 1.5x ----------
const voiceAudio = document.getElementById('voiceAudio');
const voicePlayBtn = document.getElementById('voicePlayBtn');
const tgVoice = document.querySelector('.tg-voice');

voicePlayBtn?.addEventListener('click', () => {
  if (voiceAudio.paused) {
    voiceAudio.playbackRate = 1.5;
    voiceAudio.play();
    voicePlayBtn.textContent = '❚❚';
    tgVoice.classList.add('is-playing');
  } else {
    voiceAudio.pause();
    voicePlayBtn.textContent = '▶';
    tgVoice.classList.remove('is-playing');
  }
});

voiceAudio?.addEventListener('ended', () => {
  voicePlayBtn.textContent = '▶';
  tgVoice.classList.remove('is-playing');
});

// Pause other audio/video when one starts playing
const mediaEls = document.querySelectorAll('audio, video');
mediaEls.forEach((media) => {
  media.addEventListener('play', () => {
    mediaEls.forEach((other) => {
      if (other !== media) other.pause();
    });
  });
});

// ---------- Personal greeting cards ----------
const peopleList = document.getElementById('peopleList');
if (peopleList && typeof GREETINGS !== 'undefined') {
  GREETINGS.forEach(({ name, avatar, message }) => {
    const card = document.createElement('div');
    card.className = 'people-card reveal';
    card.innerHTML = `
      <img class="people-card__avatar" src="assets/img/people/${avatar}.jpg" alt="${name}" loading="lazy">
      <div class="people-card__body">
        <p class="people-card__name">${name}</p>
        <p class="people-card__message">${message}</p>
      </div>
    `;
    peopleList.appendChild(card);
    revealObserver.observe(card);
  });
}

// ---------- Final ТОП / ЛЕС reveal ----------
const finalSection = document.getElementById('final');
if (finalSection) {
  const finalObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        finalSection.classList.add('is-revealed');
        finalObserver.unobserve(finalSection);
      }
    });
  }, { threshold: 0.5 });

  finalObserver.observe(finalSection);
}
