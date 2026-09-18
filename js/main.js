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

// ---------- Позиция с задержками ----------
// Раскладывает прогресс 0..1 в дробную позицию 0..count-1 так, что каждый
// элемент задерживается в центре, а между задержками идёт прогон.
// Вес задержки к весу прогона — 1:2; из суммы весов считается высота обёртки
// в CSS, поэтому при изменении количества элементов её нужно пересчитать.
const HOLD_WEIGHT = 1;
const MOVE_WEIGHT = 2;

function makeHoldSteps(count) {
  const steps = count - 1;
  const total = count * HOLD_WEIGHT + steps * MOVE_WEIGHT;

  return function positionAt(progress) {
    let left = progress * total;

    for (let i = 0; i < count; i += 1) {
      if (left <= HOLD_WEIGHT || i === steps) return i;
      left -= HOLD_WEIGHT;
      if (left <= MOVE_WEIGHT) return i + left / MOVE_WEIGHT;
      left -= MOVE_WEIGHT;
    }

    return steps;
  };
}

// ---------- Параллакс фона ----------
// Слой выше экрана, поэтому за полную прокрутку страницы он проезжает
// только разницу своей высоты и экрана — отсюда и эффект отставания.
const pageBg = document.getElementById('pageBg');

if (pageBg) {
  let bgTicking = false;

  function updatePageBg() {
    bgTicking = false;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const travel = pageBg.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    pageBg.style.transform = `translate3d(0, ${-progress * travel}px, 0)`;
  }

  function onBgScroll() {
    if (bgTicking) return;
    bgTicking = true;
    requestAnimationFrame(updatePageBg);
  }

  window.addEventListener('scroll', onBgScroll, { passive: true });
  window.addEventListener('resize', onBgScroll);
  updatePageBg();
}

// ---------- Hero: scroll-driven "Он — {роль}" sequence ----------
const heroPin = document.getElementById('heroPin');
const heroPhotos = document.getElementById('heroPhotos');
const heroHeadline = document.getElementById('heroHeadline');
const heroRoleLine = document.getElementById('heroRoleLine');

if (heroPin && heroPhotos && heroHeadline && heroRoleLine && typeof HERO_SEQUENCE !== 'undefined') {
  const photos = Array.from(heroPhotos.querySelectorAll('.hero-slide'));
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

  // Кадр едет по эллиптической дуге: входит снизу-слева, замирает в центре, уходит вправо-вверх.
  // t = -1 (ещё не пришёл) .. 0 (в центре) .. 1 (уже улетел)
  const ARC_X = 135; // ход по горизонтали, % от размера кадра
  const ARC_LIFT = 75; // подъём к моменту вылета
  const ARC_BULGE = 30; // прогиб дуги, за счёт него траектория не прямая

  // Каждый кадр задерживается в центре, иначе лента пролистывается слишком
  // быстро и подпись не успеваешь прочитать
  const heroPosition = makeHoldSteps(totalSteps);

  function updateHero(progress01) {
    const progress = heroPosition(progress01);
    renderHeroStep(Math.round(progress));

    photos.forEach((el, i) => {
      const t = Math.max(-1, Math.min(1, progress - i));
      const angle = (t * Math.PI) / 2;
      const x = ARC_X * Math.sin(angle);
      const y = -ARC_LIFT * Math.sin(angle) + ARC_BULGE * (1 - Math.cos(angle));

      // Кадр целиком уезжает за пределы сцены, поэтому прозрачность нужна
      // только чтобы полностью убрать уже отыгравшие кадры.
      el.style.opacity = Math.abs(progress - i) >= 1 ? '0' : '1';
      el.style.transform = `translate(${x}%, ${y}%) rotate(${t * 16}deg) scale(${1 - Math.abs(t) * 0.12})`;
      el.style.zIndex = String(totalSteps - i);
    });
  }

  makeScrollProgress(heroPin, updateHero);
}

// ---------- Age counter ----------
const ageCounterEl = document.getElementById('ageCounter');
const counterStatus = document.getElementById('counterStatus');
const countBtn = document.getElementById('countBtn');
const sfxBadumtss = document.getElementById('sfxBadumtss');
const sfxBruh = document.getElementById('sfxBruh');
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

  // Прогон 5с -> остановка 3с -> прогон 3с -> остановка 3с -> прогон 2с -> 45
  const pauseHoldMs = 3000;
  const spinDurations = [5000, 3000, 2000];

  // Своя отбивка на каждую остановку
  const pauseSounds = [sfxBadumtss, sfxBruh];

  for (let i = 0; i < spinDurations.length; i += 1) {
    await spinDigitsFor(spinDurations[i]);
    if (i < spinDurations.length - 1) {
      ageCounterEl.textContent = String(randomFakeAge());
      playSfx(pauseSounds[i]);
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

// ---------- "Что говорит Стас": горизонтальная смена слайдов от прокрутки ----------
const mediaPin = document.getElementById('mediaPin');
const mediaStage = document.getElementById('mediaStage');
const mediaSubtitles = document.getElementById('mediaSubtitles');

if (mediaPin && mediaStage && mediaSubtitles) {
  const items = Array.from(mediaStage.querySelectorAll('.media-pin__item'));
  const subtitles = Array.from(mediaSubtitles.children);
  const steps = items.length - 1;

  const positionFromProgress = makeHoldSteps(items.length);

  makeScrollProgress(mediaPin, (progress) => {
    const position = positionFromProgress(progress);
    // Ширина сцены, а не экрана: страница ограничена колонкой, и слайд должен
    // уходить ровно за её край, иначе в середине перехода была бы пустая пауза
    const stageWidth = mediaStage.clientWidth;

    items.forEach((item, i) => {
      const shift = (i - position) * stageWidth;
      item.style.transform = `translateX(${shift}px)`;
      subtitles[i].style.transform = `translateX(${shift}px)`;
    });
  });
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

// ---------- "А так сможете?": видео фиксируется в центре, заголовок догоняет ----------
const takPin = document.getElementById('takPin');
const takHeading = document.getElementById('takHeading');
const takVideoWrap = document.getElementById('takVideoWrap');

if (takPin && takHeading && takVideoWrap) {
  // Доли прогона, за которые каждый элемент доезжает до своего места.
  // Видео проходит больший путь за меньшую долю прокрутки — то есть поднимается
  // заметно быстрее, а заголовок отстаёт и как бы тянется за ним.
  const VIDEO_ARRIVES_AT = 0.45;
  const HEADING_ARRIVES_AT = 0.75;
  const VIDEO_START_SHIFT = 0.45; // стартовое смещение вниз, в долях высоты экрана
  const HEADING_START_SHIFT = 0.28;
  const HEADING_TOP = 24; // совпадает с top у .tak-pin__heading
  const MIN_CLEARANCE = 16;

  makeScrollProgress(takPin, (progress) => {
    const vh = window.innerHeight;
    // Замеры делаем до записи стилей, чтобы не провоцировать лишний пересчёт лейаута
    const videoHeight = takVideoWrap.offsetHeight;
    const headingHeight = takHeading.offsetHeight;

    const videoProgress = Math.min(progress / VIDEO_ARRIVES_AT, 1);
    const headingProgress = Math.min(progress / HEADING_ARRIVES_AT, 1);

    const videoShift = (1 - videoProgress) * vh * VIDEO_START_SHIFT;

    // Заголовок не должен наезжать на видео: его смещение ограничено так, чтобы
    // низ заголовка оставался выше верхней кромки припаркованного видео.
    // На очень низких экранах это просто уменьшает ход заголовка.
    const videoTopWhenParked = vh / 2 - videoHeight / 2;
    const maxHeadingShift = Math.max(
      0,
      videoTopWhenParked - headingHeight - HEADING_TOP - MIN_CLEARANCE,
    );
    const headingShift = Math.min((1 - headingProgress) * vh * HEADING_START_SHIFT, maxHeadingShift);

    takVideoWrap.style.transform = `translateY(calc(-50% + ${videoShift}px))`;
    takHeading.style.transform = `translateY(${headingShift}px)`;
  });
}

// ---------- Personal greeting cards (Telegram-style bubbles) ----------
// Рендерится до обработчиков плееров и до сбора медиа со страницы, иначе
// голосовые в карточках остались бы без кнопки, без взаимной остановки
// и не приглушали бы фоновую музыку.
function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Высоты полосок повторяются по кругу — получается рисунок, похожий на речь.
// Задаём их здесь, потому что в стилях задержки прописаны лишь для первых десяти.
const WAVE_PATTERN = [40, 66, 30, 82, 52, 95, 44, 70, 34, 60, 88, 38, 56, 76, 28];

function voiceBubbleHtml(src) {
  const bars = Array.from({ length: 30 }, (_, i) => {
    const height = WAVE_PATTERN[i % WAVE_PATTERN.length];
    const delay = ((i % 10) * 0.07).toFixed(2);
    return `<span style="--h:${height}%;--d:${delay}s"></span>`;
  }).join('');
  return `
    <div class="people-card__bubble people-card__bubble--voice">
      <div class="tg-voice tg-voice--light">
        <button class="tg-voice__play" aria-label="Воспроизвести голосовое">▶</button>
        <div class="tg-voice__wave">${bars}</div>
        <span class="tg-voice__time">--:--</span>
        <audio preload="metadata" src="${src}"></audio>
      </div>
    </div>
  `;
}

const peopleList = document.getElementById('peopleList');
if (peopleList && typeof GREETINGS !== 'undefined') {
  GREETINGS.forEach(({ name, avatar, message, voice }) => {
    const card = document.createElement('div');
    // Аватарка одна на карточку; когда сообщений два, она встаёт у нижнего, текстового
    card.className = `people-card reveal${voice && message ? ' people-card--stacked' : ''}`;

    const avatarHtml = avatar
      ? `<img class="people-card__avatar" src="assets/img/people/${avatar}.jpg" alt="${name}" loading="lazy">`
      : `<span class="people-card__avatar people-card__avatar--initials">${getInitials(name)}</span>`;

    const textHtml = message
      ? `
      <div class="people-card__bubble">
        <p class="people-card__name">${name}</p>
        <p class="people-card__message">${message.replace(/\n/g, '<br>')}</p>
      </div>
    `
      : '';

    // У голосового без текста имя показываем над самим голосовым
    const voiceHtml = voice
      ? `${message ? '' : `<p class="people-card__name people-card__name--solo">${name}</p>`}${voiceBubbleHtml(voice)}`
      : '';

    card.innerHTML = `
      ${avatarHtml}
      <div class="people-card__stack">
        ${voiceHtml}
        ${textHtml}
      </div>
    `;
    peopleList.appendChild(card);
    revealObserver.observe(card);
  });
}

// Длительность голосовых подставляем из метаданных
document.querySelectorAll('.tg-voice__time').forEach((label) => {
  const audio = label.parentElement.querySelector('audio');
  if (!audio) return;

  function showDuration() {
    if (!Number.isFinite(audio.duration)) return;
    const total = Math.round(audio.duration);
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    label.textContent = `${mm}:${ss}`;
  }

  if (audio.readyState >= 1) showDuration(); // метаданные уже в кеше — события не будет
  audio.addEventListener('loadedmetadata', showDuration);
});

// ---------- Telegram-style voice messages ----------
// Скорость берётся из data-rate, по умолчанию обычная
document.querySelectorAll('.tg-voice').forEach((bubble) => {
  const audio = bubble.querySelector('audio');
  const btn = bubble.querySelector('.tg-voice__play');
  if (!audio || !btn) return;

  const rate = parseFloat(bubble.dataset.rate || '1');

  function showStopped() {
    btn.textContent = '▶';
    bubble.classList.remove('is-playing');
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.playbackRate = rate;
      audio.play();
      btn.textContent = '❚❚';
      bubble.classList.add('is-playing');
    } else {
      audio.pause();
    }
  });

  // pause, а не только ended: плеер может остановить и взаимная остановка,
  // когда запускают другое аудио или видео на странице
  audio.addEventListener('pause', showStopped);
  audio.addEventListener('ended', showStopped);
});

// ---------- Sound check ----------
const soundCheckBtn = document.getElementById('soundCheckBtn');
const soundCheckAudio = document.getElementById('soundCheckAudio');

soundCheckBtn?.addEventListener('click', () => {
  soundCheckAudio.currentTime = 0;
  soundCheckAudio.play().catch(() => {});
});

// ---------- Background music with ducking ----------
const bgMusic = document.getElementById('bgMusic');
const soundToggle = document.getElementById('soundToggle');

// Фоновая музыка не участвует во взаимной остановке — вместо паузы она приглушается
const mediaEls = Array.from(document.querySelectorAll('audio, video')).filter((el) => el !== bgMusic);

// Pause other audio/video when one starts playing
mediaEls.forEach((media) => {
  media.addEventListener('play', () => {
    mediaEls.forEach((other) => {
      if (other !== media) other.pause();
    });
  });
});

if (bgMusic && soundToggle) {
  const MUSIC_VOLUME = 0.45;
  const FADE_OUT_MS = 400;
  const FADE_IN_MS = 900;

  // Короткие эффекты счётчика играют поверх музыки и не приглушают её
  const sfxEls = [sfxBadumtss, sfxBruh, sfxAirhorn];
  const duckers = mediaEls.filter((el) => !sfxEls.includes(el));

  let musicOn = false;
  let fadeRaf = null;

  function fadeMusicTo(target, durationMs, onDone) {
    if (fadeRaf) cancelAnimationFrame(fadeRaf);
    const from = bgMusic.volume;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / durationMs, 1);
      bgMusic.volume = from + (target - from) * t;
      if (t < 1) {
        fadeRaf = requestAnimationFrame(step);
      } else {
        fadeRaf = null;
        onDone?.();
      }
    }

    fadeRaf = requestAnimationFrame(step);
  }

  const anyDuckerPlaying = () => duckers.some((el) => !el.paused && !el.ended);

  function setToggleState() {
    soundToggle.textContent = musicOn ? '🔊' : '🔇';
    soundToggle.setAttribute('aria-pressed', String(musicOn));
    soundToggle.setAttribute('aria-label', musicOn ? 'Выключить музыку' : 'Включить музыку');
  }

  // Кнопка появляется только когда трек реально доступен.
  // readyState проверяем сразу: если файл уже в кеше, canplay успевает
  // выстрелить до навешивания обработчика, и событие будет пропущено.
  const revealToggle = () => { soundToggle.hidden = false; };
  if (bgMusic.readyState >= 3) revealToggle(); // HAVE_FUTURE_DATA
  bgMusic.addEventListener('canplay', revealToggle);
  bgMusic.addEventListener('error', () => { soundToggle.hidden = true; });

  soundToggle.addEventListener('click', async () => {
    if (musicOn) {
      fadeMusicTo(0, FADE_OUT_MS, () => bgMusic.pause());
      musicOn = false;
      setToggleState();
      return;
    }

    bgMusic.volume = 0;
    try {
      await bgMusic.play();
    } catch {
      return; // браузер отказал в воспроизведении — состояние кнопки не меняем
    }
    musicOn = true;
    setToggleState();
    if (!anyDuckerPlaying()) fadeMusicTo(MUSIC_VOLUME, FADE_IN_MS);
  });

  duckers.forEach((media) => {
    media.addEventListener('play', () => {
      if (musicOn) fadeMusicTo(0, FADE_OUT_MS);
    });

    ['pause', 'ended'].forEach((evt) => {
      media.addEventListener(evt, () => {
        if (musicOn && !anyDuckerPlaying()) fadeMusicTo(MUSIC_VOLUME, FADE_IN_MS);
      });
    });
  });
}

// ---------- Final block: scroll-driven ТОП -> ЛЕС swap ----------
const finalPin = document.getElementById('finalPin');
const finalTop = document.getElementById('finalTop');
const finalLes = document.getElementById('finalLes');
const finalLesWord = document.getElementById('finalLesWord');
const finalCaption = document.getElementById('finalCaption');

if (finalPin && finalTop && finalLes && finalLesWord && finalCaption) {
  // Три такта: показ первого фото -> смена фото -> появление подписи.
  // Заголовок при этом не двигается.
  const phase = (progress, from, to) => Math.min(Math.max((progress - from) / (to - from), 0), 1);

  makeScrollProgress(finalPin, (progress) => {
    const swap = phase(progress, 0.3, 0.65);
    const caption = phase(progress, 0.78, 0.95);

    finalTop.style.opacity = String(1 - swap);
    finalTop.style.transform = `rotate(${-2 + swap * 12}deg) translate(${swap * 70}px, ${swap * -50}px) scale(${1 - swap * 0.15})`;

    finalLes.style.opacity = String(swap);
    finalLes.style.transform = `rotate(${4 - swap}deg) translate(${(1 - swap) * 40}px, ${(1 - swap) * 20}px) scale(${0.9 + swap * 0.1})`;

    finalLesWord.style.opacity = String(swap);
    finalLesWord.style.transform = `translateX(${(1 - swap) * -16}px)`;

    finalCaption.style.opacity = String(caption);
    finalCaption.style.transform = `translateY(${(1 - caption) * 24}px)`;
  });
}
