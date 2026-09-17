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

// ---------- Generic scroll-progress helper ----------
// Maps how far the viewport has scrolled through a tall "pin" wrapper to a 0..1 progress value.
function makeScrollProgress(wrapperEl, onProgress) {
  let ticking = false;

  function update() {
    ticking = false;
    const rect = wrapperEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollableDistance = wrapperEl.offsetHeight - viewportHeight;
    const scrolled = -rect.top;
    const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;
    onProgress(Math.min(Math.max(progress, 0), 1));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

// ---------- Hero: scroll-driven "Он — {роль}" sequence ----------
const heroPin = document.getElementById('heroPin');
const heroPhotos = document.getElementById('heroPhotos');
const heroHeadline = document.getElementById('heroHeadline');
const heroRoleLine = document.getElementById('heroRoleLine');

if (heroPin && heroPhotos && heroHeadline && heroRoleLine && typeof HERO_SEQUENCE !== 'undefined') {
  const photos = Array.from(heroPhotos.querySelectorAll('.hero__photo'));
  const totalSteps = photos.length; // 8 roles + 1 final
  let renderedIndex = -1;

  function renderHeroStep(index) {
    if (index === renderedIndex) return;
    renderedIndex = index;

    if (index >= HERO_SEQUENCE.length) {
      heroHeadline.innerHTML = `<p class="hero__lead">${HERO_FINAL.text}</p>`;
      heroHeadline.classList.add('is-final');
    } else {
      if (heroHeadline.classList.contains('is-final')) {
        heroHeadline.innerHTML = `
          <p class="hero__lead">Есть такой человек.</p>
          <p class="hero__lead hero__role" id="heroRoleLine"></p>
        `;
        heroHeadline.classList.remove('is-final');
      }
      const roleLine = document.getElementById('heroRoleLine');
      roleLine.textContent = HERO_SEQUENCE[index].role;
    }
  }

  function updateHero(progress01) {
    const progress = progress01 * (totalSteps - 1);
    const nearest = Math.round(progress);
    renderHeroStep(nearest);

    photos.forEach((el, i) => {
      const diff = progress - i;
      const opacity = Math.max(0, 1 - Math.abs(diff));
      const y = diff * 35; // % vertical swipe
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${y}%)`;
      el.style.zIndex = String(100 - Math.round(Math.abs(diff) * 10));
    });
  }

  makeScrollProgress(heroPin, updateHero);
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spinDigitsFor(ms) {
  return new Promise((resolve) => {
    const iv = setInterval(() => {
      ageCounterEl.textContent = String(Math.floor(Math.random() * 100));
    }, 40);
    setTimeout(() => {
      clearInterval(iv);
      resolve();
    }, ms);
  });
}

async function runAgeCounter() {
  countBtn.disabled = true;
  counterStatus.textContent = '';
  playSfx(sfxAirhorn);

  const pauseHoldMs = 1200;
  const spinDurations = [1500, 900, 900, 900]; // time spinning before each pause + final landing

  for (let i = 0; i < spinDurations.length; i += 1) {
    await spinDigitsFor(spinDurations[i]);
    if (i < spinDurations.length - 1) {
      ageCounterEl.textContent = String(randomFakeAge());
      playSfx(sfxBadumtss);
      await wait(pauseHoldMs);
    }
  }

  ageCounterEl.textContent = '45';
  counterStatus.textContent = 'Посчитано!';
  countBtn.disabled = false;
}

countBtn?.addEventListener('click', () => {
  if (countBtn.disabled) return;
  runAgeCounter();
});

// ---------- Gallery: scroll-driven pinned photo stack ----------
const galleryPin = document.getElementById('galleryPin');
const galleryStage = document.getElementById('galleryStage');

if (galleryPin && galleryStage) {
  const photos = Array.from(galleryStage.querySelectorAll('.polaroid'));
  const total = photos.length;

  function updateGalleryStage(progress01) {
    const progress = progress01 * total;

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

  makeScrollProgress(galleryPin, updateGalleryStage);
}

// ---------- Video with center play button + click/tap to pause ----------
function setupPlayButtonVideo(video, btn) {
  if (!video || !btn) return;
  btn.addEventListener('click', () => {
    video.play();
    btn.classList.add('is-hidden');
  });
  video.addEventListener('click', () => {
    if (!video.paused) video.pause();
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

// ---------- Final block: scroll-driven ТОП -> ЛЕС swap ----------
const finalPin = document.getElementById('finalPin');
const finalTop = document.getElementById('finalTop');
const finalLes = document.getElementById('finalLes');
const finalLesWord = document.getElementById('finalLesWord');

if (finalPin && finalTop && finalLes && finalLesWord) {
  function updateFinal(progress) {
    finalTop.style.opacity = String(1 - progress);
    finalTop.style.transform = `rotate(${-2 + progress * 12}deg) translate(${progress * 70}px, ${progress * -50}px) scale(${1 - progress * 0.15})`;

    finalLes.style.opacity = String(progress);
    finalLes.style.transform = `rotate(${4 - progress * 1}deg) translate(${(1 - progress) * 40}px, ${(1 - progress) * 20}px) scale(${0.9 + progress * 0.1})`;

    finalLesWord.style.opacity = String(progress);
    finalLesWord.style.transform = `translateX(${(1 - progress) * -16}px)`;
  }

  makeScrollProgress(finalPin, updateFinal);
}
