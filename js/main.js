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

// ---------- Hero: cycle "Он — {роль}" photo + word, then reveal "Это Стас!" ----------
const heroPhoto = document.getElementById('heroPhoto');
const heroRoleWord = document.getElementById('heroRoleWord');
const heroHeadline = document.getElementById('heroHeadline');

if (heroPhoto && heroRoleWord && heroHeadline && typeof HERO_SEQUENCE !== 'undefined') {
  let heroIndex = 0;

  function showHeroStep(step, isFinal) {
    heroRoleWord.style.opacity = '0';
    heroPhoto.style.opacity = '0';

    setTimeout(() => {
      heroPhoto.src = step.img;

      if (isFinal) {
        heroHeadline.innerHTML = `<p class="hero__lead">${HERO_FINAL.text}</p>`;
        heroHeadline.classList.add('is-final');
      } else {
        heroRoleWord.textContent = step.role;
      }

      heroPhoto.style.opacity = '1';
      heroRoleWord.style.opacity = '1';
    }, 250);
  }

  const heroTimer = setInterval(() => {
    heroIndex += 1;

    if (heroIndex >= HERO_SEQUENCE.length) {
      showHeroStep(HERO_FINAL, true);
      clearInterval(heroTimer);
      return;
    }

    showHeroStep(HERO_SEQUENCE[heroIndex]);
  }, 1400);
}

// ---------- Age counter ----------
const ageCounterEl = document.getElementById('ageCounter');
const counterStatus = document.getElementById('counterStatus');
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
  counterStatus.textContent = '';
  playSfx(sfxAirhorn);

  const totalDurationMs = 4200;
  const pauseHoldMs = 500;
  const startTime = performance.now();
  const pauses = [0.35, 0.6, 0.8].map((p) => p * totalDurationMs);
  let nextPauseIdx = 0;

  function tick() {
    const elapsed = performance.now() - startTime;

    if (nextPauseIdx < pauses.length && elapsed >= pauses[nextPauseIdx]) {
      nextPauseIdx += 1;
      ageCounterEl.textContent = randomFakeAge();
      playSfx(sfxBadumtss);
      setTimeout(tick, pauseHoldMs);
      return;
    }

    if (elapsed >= totalDurationMs) {
      ageCounterEl.textContent = '45';
      counterStatus.textContent = 'Посчитано!';
      countBtn.disabled = false;
      return;
    }

    ageCounterEl.textContent = Math.floor(Math.random() * 100);
    const speed = 40 + (elapsed / totalDurationMs) * 80; // slows down over time
    setTimeout(tick, speed);
  }

  tick();
});

// ---------- Gallery: scroll-driven pinned photo stack ----------
const galleryPin = document.getElementById('galleryPin');
const galleryStage = document.getElementById('galleryStage');

if (galleryPin && galleryStage) {
  const photos = Array.from(galleryStage.querySelectorAll('.polaroid'));
  const total = photos.length;

  function updateGalleryStage(progress01) {
    const progress = Math.min(Math.max(progress01, 0), 1) * total;

    photos.forEach((el, i) => {
      const diff = progress - i;
      let x;
      let opacity;
      let scale;
      let z;

      if (diff <= 0) {
        // waiting in the messy pile, to the left
        const pileDepth = Math.min(-diff, 1);
        x = -70 - pileDepth * 12;
        opacity = 1;
        scale = 0.88;
        z = total - i;
      } else if (diff < 1) {
        // sliding into the center position
        x = -70 + diff * 70;
        opacity = 1;
        scale = 0.88 + diff * 0.12;
        z = total + 10;
      } else {
        // already shown, swipes further right and fades
        const t = Math.min(diff - 1, 1);
        x = t * 130;
        opacity = 1 - t * 0.8;
        scale = 1;
        z = total - i;
      }

      el.style.transform = `translateX(${x}%) rotate(var(--r)) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(z);
    });
  }

  let ticking = false;

  function onGalleryScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const rect = galleryPin.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollableDistance = galleryPin.offsetHeight - viewportHeight;
      const scrolled = -rect.top;
      const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;
      updateGalleryStage(progress);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onGalleryScroll, { passive: true });
  window.addEventListener('resize', onGalleryScroll);
  onGalleryScroll();
}

// ---------- Video with center play button ----------
function setupPlayButtonVideo(video, btn) {
  if (!video || !btn) return;
  btn.addEventListener('click', () => {
    video.play();
    btn.classList.add('is-hidden');
  });
  video.addEventListener('pause', () => btn.classList.remove('is-hidden'));
  video.addEventListener('ended', () => btn.classList.remove('is-hidden'));
}

setupPlayButtonVideo(document.getElementById('povVideo'), document.getElementById('povPlayBtn'));
setupPlayButtonVideo(document.getElementById('rotatedVideo'), document.getElementById('rotatedPlayBtn'));

// ---------- Rotated video: size it to cover its landscape frame after a -90deg turn ----------
const rotatedVideo = document.getElementById('rotatedVideo');
const rotatedWrap = document.getElementById('rotatedVideoWrap');

function fitRotatedVideo() {
  if (!rotatedVideo || !rotatedWrap) return;
  const vw = rotatedVideo.videoWidth;
  const vh = rotatedVideo.videoHeight;
  if (!vw || !vh) return;

  const cw = rotatedWrap.clientWidth;
  const ch = rotatedWrap.clientHeight;
  // After rotate(-90deg), the video's rendered box (rw x rh) occupies (rh x rw) on screen.
  // Scale so that box covers the container: rh >= cw and rw >= ch.
  const scale = Math.max(cw / vh, ch / vw);

  rotatedVideo.style.width = `${vw * scale}px`;
  rotatedVideo.style.height = `${vh * scale}px`;
}

if (rotatedVideo && rotatedWrap) {
  rotatedVideo.addEventListener('loadedmetadata', fitRotatedVideo);
  window.addEventListener('resize', fitRotatedVideo);
}

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

// ---------- Personal greeting cards (Telegram-style bubbles) ----------
function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

const peopleList = document.getElementById('peopleList');
if (peopleList && typeof GREETINGS !== 'undefined') {
  GREETINGS.forEach(({ name, avatar, message }) => {
    const card = document.createElement('div');
    card.className = 'people-card reveal';

    const avatarHtml = avatar
      ? `<img class="people-card__avatar" src="assets/img/people/${avatar}.jpg" alt="${name}" loading="lazy">`
      : `<span class="people-card__avatar people-card__avatar--initials">${getInitials(name)}</span>`;

    const messageHtml = message.replace(/\n/g, '<br>');

    card.innerHTML = `
      ${avatarHtml}
      <div class="people-card__bubble">
        <p class="people-card__name">${name}</p>
        <p class="people-card__message">${messageHtml}</p>
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
