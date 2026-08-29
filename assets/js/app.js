/**
 * ==========================================================================
 * VISHENKA WELLNESS & FITNESS — INTERACTIVE STORYTELLING & BOOKING ENGINE
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initBranchSelector();
  initGoalPicker();
  initScheduleEngine();
  initPricingEngine();
  initTrainerModals();
  initSpaceLightbox();
  initFaqAccordion();
  initBookingModalEngine();
  initBookingForm();
  initVkWidgets();
  initCookieBanner();
});

/* --------------------------------------------------------------------------
   01. HEADER SCROLL EFFECT
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById('mainHeader');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   02. MOBILE NAVIGATION DRAWER
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const burgerBtn = document.getElementById('burgerBtn');
  const drawer = document.getElementById('navMobileDrawer');
  const overlay = document.getElementById('navMobileOverlay');
  const closeBtn = document.getElementById('navMobileClose');
  const navLinks = document.querySelectorAll('.nav-mobile-link');

  if (!burgerBtn || !drawer || !overlay) return;

  const openMenu = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  burgerBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* --------------------------------------------------------------------------
   03. GLOBAL BRANCH SELECTOR (Ла-Рошель ⟷ Зайцева)
   -------------------------------------------------------------------------- */
let currentBranch = 'larochelle'; // 'larochelle' | 'zaytseva'

function initBranchSelector() {
  const branchBtns = document.querySelectorAll('[data-branch-select]');

  branchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-branch-select');
      setGlobalBranch(selected);
    });
  });
}

function setGlobalBranch(branchId) {
  currentBranch = branchId;

  document.querySelectorAll('[data-branch-select]').forEach(btn => {
    if (btn.getAttribute('data-branch-select') === branchId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (window.renderScheduleSlots) {
    window.renderScheduleSlots();
  }

  if (window.setPricingBranch) {
    window.setPricingBranch(branchId);
  }

  const branchSelect = document.getElementById('bookingBranchSelect');
  if (branchSelect) {
    branchSelect.value = branchId;
  }
}

/* --------------------------------------------------------------------------
   04. SMART GOAL SELECTOR (UX Router)
   -------------------------------------------------------------------------- */
function initGoalPicker() {
  const cards = document.querySelectorAll('.goal-ux-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const targetCategory = card.getAttribute('data-target-category');
      const goalTitle = card.querySelector('.goal-ux-title')?.innerText.trim();

      const scheduleSection = document.getElementById('schedule');
      if (scheduleSection) {
        scheduleSection.scrollIntoView({ behavior: 'smooth' });
      }

      const goalInput = document.getElementById('bookingGoal');
      if (goalInput && goalTitle) {
        goalInput.value = `Цель: ${goalTitle}`;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   05. SCHEDULE DATA & ENGINE (Синхронизация с Яндекс Облаком и Яндекс.Диском)
   -------------------------------------------------------------------------- */
const API_URL = 'https://functions.yandexcloud.net/d4enkr3oui81ji7mjvpl';
window._csrfToken = '';

const DAY_NAMES = { 1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота', 7: 'Воскресенье' };

let SCHEDULE_DATA = [
  // наб. Ла-Рошель, 13
  { id: 1, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 1, time: '09:30', duration: '55 мин', direction: 'Пилатес', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 2, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 1, time: '18:30', duration: '55 мин', direction: 'Здоровая спина', trainer: 'Алена', spots: 8, total: 8 },
  { id: 3, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 1, time: '19:45', duration: '55 мин', direction: 'Классическая растяжка', trainer: 'Алина', spots: 8, total: 8 },

  { id: 4, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 2, time: '10:00', duration: '55 мин', direction: 'Пилатес Mat', trainer: 'Алена', spots: 8, total: 8 },
  { id: 5, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 2, time: '18:30', duration: '55 мин', direction: 'Петли TRX', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 6, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 2, time: '19:45', duration: '55 мин', direction: 'Хатха-йога', trainer: 'Настя', spots: 8, total: 8 },

  { id: 7, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 3, time: '18:30', duration: '55 мин', direction: 'Силовой фитнес', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 8, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 3, time: '19:45', duration: '55 мин', direction: 'Динамическая растяжка', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },

  { id: 9, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 4, time: '10:30', duration: '55 мин', direction: 'Женское здоровье', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 10, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 4, time: '18:30', duration: '55 мин', direction: 'Пилатес', trainer: 'Алена', spots: 8, total: 8 },
  { id: 11, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 4, time: '19:45', duration: '55 мин', direction: 'Классическая растяжка', trainer: 'Алина', spots: 8, total: 8 },

  { id: 12, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 5, time: '18:30', duration: '55 мин', direction: 'Здоровая спина', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 13, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 5, time: '19:45', duration: '55 мин', direction: 'Хатха-йога', trainer: 'Настя', spots: 8, total: 8 },

  { id: 14, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 6, time: '11:00', duration: '55 мин', direction: 'Женское здоровье', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 15, branch: 'larochelle', branchName: 'наб. Ла-Рошель, 13', day: 7, time: '11:30', duration: '55 мин', direction: 'Йога-релакс', trainer: 'Настя', spots: 8, total: 8 },

  // ул. Зайцева, 67
  { id: 16, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 1, time: '09:00', duration: '55 мин', direction: 'Здоровая спина', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 17, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 1, time: '11:00', duration: '55 мин', direction: 'Пилатес', trainer: 'Алена', spots: 8, total: 8 },
  { id: 18, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 1, time: '18:00', duration: '55 мин', direction: 'Петли TRX', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 19, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 1, time: '19:15', duration: '55 мин', direction: 'Динамическая растяжка', trainer: 'Алина', spots: 8, total: 8 },
  { id: 20, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 1, time: '20:30', duration: '55 мин', direction: 'Хатха-йога', trainer: 'Настя', spots: 8, total: 8 },

  { id: 21, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 2, time: '10:00', duration: '55 мин', direction: 'Для будущих мам', trainer: 'Алена', spots: 8, total: 8 },
  { id: 22, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 2, time: '18:00', duration: '55 мин', direction: 'Силовой фитнес', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 23, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 2, time: '19:15', duration: '55 мин', direction: 'Здоровая спина', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 24, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 2, time: '20:30', duration: '55 мин', direction: 'Классическая растяжка', trainer: 'Алина', spots: 8, total: 8 },

  { id: 25, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 3, time: '09:00', duration: '55 мин', direction: 'Пилатес', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 26, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 3, time: '18:00', duration: '55 мин', direction: 'Петли TRX', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 27, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 3, time: '19:15', duration: '55 мин', direction: 'Пилатес', trainer: 'Алена', spots: 8, total: 8 },

  { id: 28, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 4, time: '18:00', duration: '55 мин', direction: 'Силовой фитнес', trainer: 'Даша П.', spots: 8, total: 8 },
  { id: 29, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 4, time: '19:15', duration: '55 мин', direction: 'Классическая растяжка', trainer: 'Алина', spots: 8, total: 8 },
  { id: 30, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 4, time: '20:30', duration: '55 мин', direction: 'Женское здоровье', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },

  { id: 31, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 5, time: '09:00', duration: '55 мин', direction: 'Пилатес', trainer: 'Алена', spots: 8, total: 8 },
  { id: 32, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 5, time: '18:00', duration: '55 мин', direction: 'Здоровая спина', trainer: 'Татьяна Прокопенко', spots: 8, total: 8 },
  { id: 33, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 5, time: '19:15', duration: '55 мин', direction: 'Петли TRX', trainer: 'Даша П.', spots: 8, total: 8 },

  { id: 34, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 6, time: '11:00', duration: '55 мин', direction: 'Субботняя растяжка', trainer: 'Алина', spots: 8, total: 8 },
  { id: 35, branch: 'zaytseva', branchName: 'ул. Зайцева, 67', day: 7, time: '11:00', duration: '55 мин', direction: 'Йога выходного дня', trainer: 'Настя', spots: 8, total: 8 }
];

let currentSelectedDay = 1;

function initScheduleEngine() {
  const dayButtons = document.querySelectorAll('#scheduleDayTrack .day-pill-chip');

  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dayButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSelectedDay = parseInt(btn.getAttribute('data-day'), 10);
      renderScheduleSlots();
    });
  });

  window.renderScheduleSlots = renderScheduleSlots;
  window.loadLiveSchedule = loadLiveSchedule;

  renderScheduleSlots();
  loadLiveSchedule();
}

async function loadLiveSchedule() {
  try {
    const res = await fetch(`${API_URL}?action=schedule&_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();

    if (data && data.success) {
      if (data._token) {
        window._csrfToken = data._token;
      }
      if (Array.isArray(data.all_slots) && data.all_slots.length > 0) {
        SCHEDULE_DATA = data.all_slots;
        renderScheduleSlots();
      }
    }
  } catch (err) {
    console.log('Используется локальное расписание:', err.message);
  }
}

function renderScheduleSlots() {
  const container = document.getElementById('scheduleSlotsContainer');
  if (!container) return;

  const filteredSlots = SCHEDULE_DATA.filter(slot => {
    const slotBranch = (slot.branch === 'zaytseva' || slot.branch?.includes('Зайцев') || slot.branchName?.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
    const slotDay = parseInt(slot.day, 10);
    return slotBranch === currentBranch && slotDay === currentSelectedDay;
  });

  if (filteredSlots.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: var(--color-canvas-alt); border-radius: var(--radius-card); border: 1px dashed var(--hairline-strong);">
        <p class="t-lead" style="color: var(--color-ink-body);">В этот день занятий в данном филиале нет или формируется расписание.</p>
        <p class="t-body-sm" style="margin-top: 6px;">Попробуйте выбрать другой день или переключить филиал.</p>
      </div>
    `;
    return;
  }

  const branchName = currentBranch === 'larochelle' ? 'наб. Ла-Рошель, 13' : 'ул. Зайцева, 67';

  container.innerHTML = filteredSlots.map(slot => {
    const total = parseInt(slot.total || 8, 10);
    const booked = parseInt(slot.booked || 0, 10);
    const available = (slot.available !== undefined) ? parseInt(slot.available, 10) : ((slot.spots !== undefined) ? parseInt(slot.spots, 10) : Math.max(0, total - booked));
    const isFull = available <= 0;

    const spotsText = isFull 
      ? '<span style="color: #EF4444;">Мест нет (лист ожидания)</span>' 
      : `Осталось мест: ${available} из ${total}`;

    const dayLabel = DAY_NAMES[slot.day] || 'Ближайший день';

    return `
      <div class="slot-clean-card">
        <div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px;">
            <span class="slot-clean-time">${slot.time}</span>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--color-ink-dim);">${slot.duration || '55 мин'}</span>
          </div>

          <h3 class="t-h3" style="font-size: 1.15rem; margin-bottom: 4px;">${slot.direction}</h3>
          <p class="t-body-sm" style="color: var(--color-ink-body); margin-bottom: 8px;">Тренер: <strong>${slot.trainer || 'Инструктор'}</strong></p>
          <div style="font-size: 0.75rem; color: var(--color-turquoise-dark); font-weight: 700; margin-bottom: 16px;">
            ${spotsText}
          </div>
        </div>

        <button class="btn-pill btn-pill-dark btn-pill-sm" style="width: 100%;" onclick="openBookingForSlot('${slot.direction}', '${slot.trainer || ''}', '${slot.time}', '${branchName}', '${dayLabel}', ${available}, ${total})">
          ${isFull ? 'Записаться в резерв' : 'Записаться'}
        </button>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   06. PRICING & MEMBERSHIPS DATA (Абонементы и разовые занятия студий)
   -------------------------------------------------------------------------- */
const MEMBERSHIPS_DATA = {
  'larochelle': {
    branchName: 'наб. Ла-Рошель, 13',
    items: [
      {
        id: 'lr-4',
        name: 'Абонемент на 4 занятия',
        price: 2300,
        priceFormatted: '2 300 ₽',
        unit: '575 ₽ / занятие',
        subtitle: '1 тренировка в неделю для мягкого тонуса',
        tag: 'Абонемент',
        checks: ['Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'lr-6',
        name: 'Абонемент на 6 занятий',
        price: 3300,
        priceFormatted: '3 300 ₽',
        unit: '550 ₽ / занятие',
        subtitle: 'Поддержание формы и тонуса',
        tag: 'Абонемент',
        checks: ['Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'lr-8',
        name: 'Абонемент на 8 занятий',
        price: 4200,
        priceFormatted: '4 200 ₽',
        unit: '525 ₽ / занятие',
        subtitle: '2 тренировки в неделю для стабильного тонуса',
        tag: 'Хит',
        isHit: true,
        checks: ['Самый популярный выбор', 'Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'lr-10',
        name: 'Абонемент на 10 занятий',
        price: 5000,
        priceFormatted: '5 000 ₽',
        unit: '500 ₽ / занятие',
        subtitle: 'Для регулярных осознанных тренировок',
        tag: 'Абонемент',
        checks: ['Срок: 45 дней', 'Все направления студии', 'Заморозка на 10 дней', 'Оплата в студии']
      },
      {
        id: 'lr-12',
        name: 'Абонемент на 12 занятий',
        price: 5700,
        priceFormatted: '5 700 ₽',
        unit: '475 ₽ / занятие',
        subtitle: '3 тренировки в неделю для заметного результата',
        tag: 'Выгодно',
        checks: ['Выгодная цена занятия', 'Срок: 45 дней', 'Заморозка на 14 дней', 'Оплата в студии']
      },
      {
        id: 'lr-16',
        name: 'Абонемент на 16 занятий',
        price: 7200,
        priceFormatted: '7 200 ₽',
        unit: '450 ₽ / занятие',
        subtitle: 'Интенсивный курс для максимального эффекта',
        tag: 'Интенсив',
        checks: ['Срок: 60 дней', 'Заморозка на 14 дней', 'Любые направления', 'Оплата в студии']
      },
      {
        id: 'lr-24',
        name: 'Абонемент на 24 занятия',
        price: 10000,
        priceFormatted: '10 000 ₽',
        unit: '416 ₽ / занятие',
        subtitle: 'Большой абонемент с максимальной выгодой',
        tag: 'Максимум',
        checks: ['Максимальная экономия', 'Срок: 90 дней', 'Заморозка на 21 день', 'Оплата в студии']
      },
      {
        id: 'lr-single',
        name: 'Разовое посещение',
        price: 600,
        priceFormatted: '600 ₽',
        unit: 'Разовое занятие',
        subtitle: 'Тренировка без привязки к абонементу',
        tag: 'Разово',
        checks: ['Любое направление студии', 'Консультация тренера', 'Оплата в студии перед занятием']
      },
      {
        id: 'lr-moms',
        name: 'Будущие мамы (разовое)',
        price: 800,
        priceFormatted: '800 ₽',
        unit: 'Спецпрограмма',
        subtitle: 'Мягкий оздоровительный фитнес для беременных',
        tag: 'Разово',
        checks: ['Безопасная нагрузка', 'Сертифицированный тренер', 'Оплата в студии перед занятием']
      },
      {
        id: 'lr-baby',
        name: 'Мама и малыш (разовое)',
        price: 800,
        priceFormatted: '800 ₽',
        unit: 'Спецпрограмма',
        subtitle: 'Тренировки мамы вместе с ребенком',
        tag: 'Разово',
        checks: ['Совместное развитие и тонус', 'Уютная атмосфера', 'Оплата в студии перед занятием']
      }
    ],
    allOptions: [
      { name: 'Абонемент на 8 занятий (Хит) — 4 200 ₽', valName: 'Абонемент на 8 занятий', price: 4200 },
      { name: 'Абонемент на 4 занятия — 2 300 ₽', valName: 'Абонемент на 4 занятия', price: 2300 },
      { name: 'Абонемент на 6 занятий — 3 300 ₽', valName: 'Абонемент на 6 занятий', price: 3300 },
      { name: 'Абонемент на 10 занятий — 5 000 ₽', valName: 'Абонемент на 10 занятий', price: 5000 },
      { name: 'Абонемент на 12 занятий — 5 700 ₽', valName: 'Абонемент на 12 занятий', price: 5700 },
      { name: 'Абонемент на 16 занятий — 7 200 ₽', valName: 'Абонемент на 16 занятий', price: 7200 },
      { name: 'Абонемент на 24 занятия — 10 000 ₽', valName: 'Абонемент на 24 занятия', price: 10000 },
      { name: 'Разовое посещение — 600 ₽', valName: 'Разовое посещение', price: 600 },
      { name: 'Будущие мамы (разовое) — 800 ₽', valName: 'Будущие мамы (разовое)', price: 800 },
      { name: 'Мама и малыш (разовое) — 800 ₽', valName: 'Мама и малыш (разовое)', price: 800 }
    ]
  },
  'zaytseva': {
    branchName: 'ул. Зайцева, 67',
    items: [
      {
        id: 'z-4',
        name: 'Абонемент на 4 занятия',
        price: 1750,
        priceFormatted: '1 750 ₽',
        unit: '~437 ₽ / занятие',
        subtitle: '1 тренировка в неделю для поддержания формы',
        tag: 'Абонемент',
        checks: ['Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'z-6',
        name: 'Абонемент на 6 занятий',
        price: 2600,
        priceFormatted: '2 600 ₽',
        unit: '~433 ₽ / занятие',
        subtitle: 'Поддержание формы и тонуса',
        tag: 'Абонемент',
        checks: ['Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'z-8',
        name: 'Абонемент на 8 занятий',
        price: 3200,
        priceFormatted: '3 200 ₽',
        unit: '400 ₽ / занятие',
        subtitle: '2 тренировки в неделю для стабильного результата',
        tag: 'Хит',
        isHit: true,
        checks: ['Самый популярный выбор', 'Срок: 30 дней', 'Все направления студии', 'Заморозка на 7 дней', 'Оплата в студии']
      },
      {
        id: 'z-10',
        name: 'Абонемент на 10 занятий',
        price: 3600,
        priceFormatted: '3 600 ₽',
        unit: '360 ₽ / занятие',
        subtitle: 'Для регулярных осознанных тренировок',
        tag: 'Абонемент',
        checks: ['Срок: 45 дней', 'Все направления студии', 'Заморозка на 10 дней', 'Оплата в студии']
      },
      {
        id: 'z-12',
        name: 'Абонемент на 12 занятий',
        price: 4000,
        priceFormatted: '4 000 ₽',
        unit: '~333 ₽ / занятие',
        subtitle: '3 тренировки в неделю для быстрого прогресса',
        tag: 'Выгодно',
        checks: ['Выгодная цена занятия', 'Срок: 45 дней', 'Заморозка на 14 дней', 'Оплата в студии']
      },
      {
        id: 'z-16',
        name: 'Абонемент на 16 занятий',
        price: 5100,
        priceFormatted: '5 100 ₽',
        unit: '~318 ₽ / занятие',
        subtitle: 'Интенсивный курс тренировок',
        tag: 'Интенсив',
        checks: ['Срок: 60 дней', 'Заморозка на 14 дней', 'Любые направления', 'Оплата в студии']
      },
      {
        id: 'z-24',
        name: 'Абонемент на 24 занятия',
        price: 7200,
        priceFormatted: '7 200 ₽',
        unit: '300 ₽ / занятие',
        subtitle: 'Большой курс с максимальной выгодой',
        tag: 'Максимум',
        checks: ['Максимальная экономия', 'Срок: 90 дней', 'Заморозка на 21 день', 'Оплата в студии']
      },
      {
        id: 'z-single',
        name: 'Разовое занятие',
        price: 450,
        priceFormatted: '450 ₽',
        unit: 'Разовое занятие',
        subtitle: 'Тренировка без привязки к абонементу',
        tag: 'Разово',
        checks: ['Любое направление студии', 'Консультация тренера', 'Оплата в студии перед занятием']
      }
    ],
    allOptions: [
      { name: 'Абонемент на 8 занятий (Хит) — 3 200 ₽', valName: 'Абонемент на 8 занятий', price: 3200 },
      { name: 'Абонемент на 4 занятия — 1 750 ₽', valName: 'Абонемент на 4 занятия', price: 1750 },
      { name: 'Абонемент на 6 занятий — 2 600 ₽', valName: 'Абонемент на 6 занятий', price: 2600 },
      { name: 'Абонемент на 10 занятий — 3 600 ₽', valName: 'Абонемент на 10 занятий', price: 3600 },
      { name: 'Абонемент на 12 занятий — 4 000 ₽', valName: 'Абонемент на 12 занятий', price: 4000 },
      { name: 'Абонемент на 16 занятий — 5 100 ₽', valName: 'Абонемент на 16 занятий', price: 5100 },
      { name: 'Абонемент на 24 занятия — 7 200 ₽', valName: 'Абонемент на 24 занятия', price: 7200 },
      { name: 'Разовое занятие — 450 ₽', valName: 'Разовое занятие', price: 450 }
    ]
  }
};

let currentPricingBranch = 'larochelle';
let currentPricingCategory = 'all'; // 'all' | 'memberships' | 'single'
let pricingScrollListenerAttached = false;

function initPricingEngine() {
  window.setPricingBranch = setPricingBranch;
  window.setPricingCategory = setPricingCategory;
  window.renderPricingCards = renderPricingCards;
  window.scrollPricingCarousel = scrollPricingCarousel;
  window.scrollToPricingIndex = scrollToPricingIndex;

  const track = document.getElementById('pricingCardsContainer');
  if (track && !pricingScrollListenerAttached) {
    let scrollTimeout;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateActivePricingDot, 50);
    }, { passive: true });
    pricingScrollListenerAttached = true;
  }

  renderPricingCards(currentPricingBranch);
}

function setPricingBranch(branchKey) {
  currentPricingBranch = branchKey;

  const btnLR = document.getElementById('pricingTabLaRochelle');
  const btnZ = document.getElementById('pricingTabZaytseva');

  if (btnLR && btnZ) {
    if (branchKey === 'zaytseva') {
      btnLR.classList.remove('active');
      btnZ.classList.add('active');
    } else {
      btnLR.classList.add('active');
      btnZ.classList.remove('active');
    }
  }

  renderPricingCards(branchKey);

  const track = document.getElementById('pricingCardsContainer');
  if (track) {
    track.scrollTo({ left: 0, behavior: 'smooth' });
  }
}

function setPricingCategory(catKey) {
  currentPricingCategory = catKey;

  document.querySelectorAll('#pricingCategoryTabs .pricing-cat-btn').forEach(btn => {
    if (btn.getAttribute('data-pricing-cat') === catKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderPricingCards(currentPricingBranch);

  const track = document.getElementById('pricingCardsContainer');
  if (track) {
    track.scrollTo({ left: 0, behavior: 'smooth' });
  }
}

function renderPricingCards(branchKey) {
  const container = document.getElementById('pricingCardsContainer');
  const dotsContainer = document.getElementById('pricingDotsIndicator');
  const counterEl = document.getElementById('pricingCarouselCounter');
  if (!container) return;

  const branchData = MEMBERSHIPS_DATA[branchKey] || MEMBERSHIPS_DATA['larochelle'];
  const branchName = branchData.branchName;

  let filteredItems = branchData.items;
  if (currentPricingCategory === 'memberships') {
    filteredItems = branchData.items.filter(item => item.tag !== 'Разово');
  } else if (currentPricingCategory === 'single') {
    filteredItems = branchData.items.filter(item => item.tag === 'Разово');
  }

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; width: 100%; padding: 36px 20px; text-align: center; background: var(--color-canvas-alt); border-radius: var(--radius-card); border: 1px dashed var(--hairline-strong);">
        <p class="t-lead" style="margin: 0; color: var(--color-ink-dim);">Тарифы в данной категории не найдены.</p>
      </div>
    `;
    if (dotsContainer) dotsContainer.innerHTML = '';
    if (counterEl) counterEl.innerText = '';
    return;
  }

  container.innerHTML = filteredItems.map((item, idx) => {
    const isHit = item.isHit;
    const badgeHtml = isHit ? `<div class="pricing-hit-badge">Самый популярный</div>` : '';
    const cardClass = isHit ? 'pricing-plan-card featured' : 'pricing-plan-card';
    const btnClass = isHit ? 'btn-pill btn-pill-dark' : 'btn-pill btn-pill-outline';

    const checksHtml = item.checks.map(c => `
      <div class="pricing-check-line"><span class="pricing-check-icon">✓</span> ${c}</div>
    `).join('');

    const btnText = item.tag === 'Разово' ? 'Забронировать занятие →' : 'Забронировать абонемент →';

    return `
      <div class="${cardClass}" data-card-index="${idx}">
        ${badgeHtml}
        <div>
          <div class="t-label" style="margin-bottom: 4px;">${item.tag}</div>
          <h3 class="t-h3">${item.name}</h3>
          <p class="t-body-sm" style="margin-top: 4px;">${item.subtitle}</p>
          
          <div class="pricing-cost-large">${item.priceFormatted}</div>
          <div class="pricing-unit-pill">
            ${item.unit} · Оплата в студии
          </div>
        </div>

        <div class="pricing-checks-list">
          ${checksHtml}
        </div>

        <button class="${btnClass}" style="width: 100%;" onclick="openUniversalBooking({ mode: 'membership', membershipName: '${item.name}', price: ${item.price}, branch: '${branchName}' })">
          ${btnText}
        </button>
      </div>
    `;
  }).join('');

  // Генерируем точки пагинации
  if (dotsContainer) {
    dotsContainer.innerHTML = filteredItems.map((_, idx) => `
      <button class="pricing-dot ${idx === 0 ? 'active' : ''}" onclick="scrollToPricingIndex(${idx})" aria-label="Перейти к карточке ${idx + 1}"></button>
    `).join('');
  }

  if (counterEl) {
    counterEl.innerText = `Тариф 1 из ${filteredItems.length} · Свайпайте вбок ↔`;
  }
}

function updateActivePricingDot() {
  const track = document.getElementById('pricingCardsContainer');
  const dotsContainer = document.getElementById('pricingDotsIndicator');
  const counterEl = document.getElementById('pricingCarouselCounter');
  if (!track || !dotsContainer) return;

  const cards = track.querySelectorAll('.pricing-plan-card');
  if (cards.length === 0) return;

  const trackScrollLeft = track.scrollLeft;
  const trackCenter = trackScrollLeft + track.clientWidth / 2;

  let closestIndex = 0;
  let minDistance = Infinity;

  cards.forEach((card, idx) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(trackCenter - cardCenter);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = idx;
    }
  });

  const dots = dotsContainer.querySelectorAll('.pricing-dot');
  dots.forEach((dot, idx) => {
    if (idx === closestIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  if (counterEl) {
    counterEl.innerText = `Тариф ${closestIndex + 1} из ${cards.length} · Свайпайте вбок ↔`;
  }
}

function scrollPricingCarousel(direction) {
  const track = document.getElementById('pricingCardsContainer');
  if (!track) return;

  const cards = track.querySelectorAll('.pricing-plan-card');
  if (cards.length === 0) return;

  const trackScrollLeft = track.scrollLeft;
  const trackCenter = trackScrollLeft + track.clientWidth / 2;

  let currentIndex = 0;
  let minDistance = Infinity;

  cards.forEach((card, idx) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(trackCenter - cardCenter);
    if (distance < minDistance) {
      minDistance = distance;
      currentIndex = idx;
    }
  });

  const targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
  scrollToPricingIndex(targetIndex);
}

function scrollToPricingIndex(index) {
  const track = document.getElementById('pricingCardsContainer');
  if (!track) return;

  const cards = track.querySelectorAll('.pricing-plan-card');
  if (cards[index]) {
    const targetCard = cards[index];
    const scrollTarget = targetCard.offsetLeft - (track.clientWidth - targetCard.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
  }
}

/* --------------------------------------------------------------------------
   07. ADAPTIVE BOOKING MODAL ENGINE (Умные сценарии записи)
   -------------------------------------------------------------------------- */
let activeBookingMode = 'general'; // 'trial' | 'general' | 'program' | 'slot' | 'membership'
let preselectedProgramName = '';

function initBookingModalEngine() {
  const branchSelect = document.getElementById('bookingBranchSelect');
  const programSelect = document.getElementById('bookingProgramSelect');
  const slotSelect = document.getElementById('bookingSlotSelect');
  const membershipSelect = document.getElementById('bookingMembershipSelect');
  const modalClose = document.getElementById('bookingModalClose');
  const modal = document.getElementById('bookingModal');

  if (modalClose && modal) {
    modalClose.addEventListener('click', () => closeAllModals());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  }

  // При смене филиала в модалке
  if (branchSelect) {
    branchSelect.addEventListener('change', () => {
      const selectedBranch = branchSelect.value;
      if (activeBookingMode === 'membership') {
        updateModalMemberships(selectedBranch, null);
      } else {
        updateModalPrograms(selectedBranch, (activeBookingMode === 'program') ? preselectedProgramName : null);
      }
    });
  }

  // При смене программы
  if (programSelect) {
    programSelect.addEventListener('change', () => {
      const selectedBranch = branchSelect ? branchSelect.value : currentBranch;
      updateModalSlots(selectedBranch, programSelect.value);
    });
  }

  // При выборе слота
  if (slotSelect) {
    slotSelect.addEventListener('change', syncSelectedSlotHiddenFields);
  }

  // При выборе абонемента
  if (membershipSelect) {
    membershipSelect.addEventListener('change', syncSelectedMembershipHiddenFields);
  }
}

function updateModalMemberships(branchKey, preferredName) {
  const membershipSelect = document.getElementById('bookingMembershipSelect');
  if (!membershipSelect) return;

  const data = MEMBERSHIPS_DATA[branchKey] || MEMBERSHIPS_DATA['larochelle'];
  membershipSelect.innerHTML = data.allOptions.map(opt => `
    <option value="${opt.valName}|${opt.price}">${opt.name}</option>
  `).join('');

  if (preferredName) {
    const found = data.allOptions.find(o => o.valName.toLowerCase() === preferredName.toLowerCase() || o.name.toLowerCase().includes(preferredName.toLowerCase()));
    if (found) {
      membershipSelect.value = `${found.valName}|${found.price}`;
    }
  }

  syncSelectedMembershipHiddenFields();
}

function syncSelectedMembershipHiddenFields() {
  const branchSelect = document.getElementById('bookingBranchSelect');
  const membershipSelect = document.getElementById('bookingMembershipSelect');
  const membershipInfo = document.getElementById('bookingMembershipInfo');
  const titleEl = document.getElementById('membershipTitle');
  const priceEl = document.getElementById('membershipPrice');

  const selectedBranchKey = branchSelect ? branchSelect.value : currentBranch;
  const cleanBranch = selectedBranchKey === 'zaytseva' ? 'ул. Зайцева, 67 (1 этаж)' : 'наб. Ла-Рошель, 13';

  if (membershipSelect && membershipSelect.value) {
    const [mName, mPrice] = membershipSelect.value.split('|');
    const priceNum = parseInt(mPrice || 0, 10);
    const priceFmt = priceNum.toLocaleString('ru-RU') + ' ₽';

    if (titleEl) titleEl.innerText = mName;
    if (priceEl) priceEl.innerText = priceFmt;

    const programInput = document.getElementById('bookingProgram');
    const branchInput = document.getElementById('bookingBranch');
    const dateInput = document.getElementById('bookingDate');
    const timeInput = document.getElementById('bookingTime');
    const trainerInput = document.getElementById('bookingTrainer');
    const goalInput = document.getElementById('bookingGoal');

    if (programInput) programInput.value = `${mName} (${priceFmt})`;
    if (branchInput) branchInput.value = cleanBranch;
    if (dateInput) dateInput.value = 'Свободное посещение';
    if (timeInput) timeInput.value = 'Абонемент';
    if (trainerInput) trainerInput.value = 'Любой тренер студии';
    if (goalInput) goalInput.value = 'Бронь абонемента · Оплата в студии';
  }
}

function updateModalPrograms(branchKey, preselectProgram) {
  const programSelect = document.getElementById('bookingProgramSelect');
  if (!programSelect) return;

  const branchSlots = SCHEDULE_DATA.filter(s => {
    const b = (s.branch === 'zaytseva' || s.branch?.includes('Зайцев') || s.branchName?.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
    return b === branchKey;
  });

  const uniquePrograms = [...new Set(branchSlots.map(s => s.direction))].filter(Boolean);

  programSelect.innerHTML = uniquePrograms.map(p => `<option value="${p}">${p}</option>`).join('');

  if (preselectProgram && uniquePrograms.includes(preselectProgram)) {
    programSelect.value = preselectProgram;
  }

  updateModalSlots(branchKey, programSelect.value);
}

function updateModalSlots(branchKey, programName) {
  const slotSelect = document.getElementById('bookingSlotSelect');
  if (!slotSelect) return;

  const matchingSlots = SCHEDULE_DATA.filter(s => {
    const b = (s.branch === 'zaytseva' || s.branch?.includes('Зайцев') || s.branchName?.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
    return b === branchKey && s.direction === programName;
  });

  if (matchingSlots.length === 0) {
    slotSelect.innerHTML = `<option value="Ближайшее время|Удобное время|Любой тренер">Уточнить свободное время у администратора</option>`;
  } else {
    slotSelect.innerHTML = matchingSlots.map(s => {
      const dayName = DAY_NAMES[s.day] || 'День уточняется';
      const spots = (s.available !== undefined) ? parseInt(s.available, 10) : ((s.spots !== undefined) ? parseInt(s.spots, 10) : 8);
      const total = parseInt(s.total || 8, 10);
      const spotsLabel = spots > 0 ? `Осталось ${spots} из ${total} мест` : `Лист ожидания (мест нет)`;
      const val = `${dayName}|${s.time}|${s.trainer || 'Инструктор'}|${spots}`;

      return `<option value="${val}">${dayName} в ${s.time} · ${s.trainer || 'Инструктор'} (${spotsLabel})</option>`;
    }).join('');
  }

  syncSelectedSlotHiddenFields();
}

function syncSelectedSlotHiddenFields() {
  const branchSelect = document.getElementById('bookingBranchSelect');
  const programSelect = document.getElementById('bookingProgramSelect');
  const slotSelect = document.getElementById('bookingSlotSelect');

  const selectedBranchKey = branchSelect ? branchSelect.value : currentBranch;
  const cleanBranch = selectedBranchKey === 'zaytseva' ? 'ул. Зайцева, 67 (1 этаж)' : 'наб. Ла-Рошель, 13';

  const programInput = document.getElementById('bookingProgram');
  const branchInput = document.getElementById('bookingBranch');
  const dateInput = document.getElementById('bookingDate');
  const timeInput = document.getElementById('bookingTime');
  const trainerInput = document.getElementById('bookingTrainer');

  if (branchInput) branchInput.value = cleanBranch;
  if (programInput && programSelect) programInput.value = programSelect.value || 'Тренировка';

  if (slotSelect && slotSelect.value) {
    const parts = slotSelect.value.split('|');
    if (dateInput) dateInput.value = parts[0] || '';
    if (timeInput) timeInput.value = parts[1] || 'Удобное время';
    if (trainerInput) trainerInput.value = parts[2] || 'Инструктор студии';
  }
}

/**
 * Главная универсальная функция открытия модалки записи
 */
window.openUniversalBooking = function(options = {}) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const mode = options.mode || 'general'; // 'trial' | 'general' | 'program' | 'slot' | 'membership'
  activeBookingMode = mode;

  const badgeEl = document.getElementById('bookingModalBadge');
  const titleEl = document.getElementById('bookingModalTitle');
  const subEl = document.getElementById('bookingModalSub');

  const lockedInfo = document.getElementById('bookingLockedInfo');
  const membershipInfo = document.getElementById('bookingMembershipInfo');
  const membershipGroup = document.getElementById('bookingMembershipGroup');
  const branchGroup = document.getElementById('bookingBranchGroup');
  const programGroup = document.getElementById('bookingProgramGroup');
  const slotGroup = document.getElementById('bookingSlotGroup');

  const branchSelect = document.getElementById('bookingBranchSelect');
  const programSelect = document.getElementById('bookingProgramSelect');
  const submitBtn = document.getElementById('bookingSubmitBtn');

  const nameInput = document.getElementById('bookingName');
  const goalInput = document.getElementById('bookingGoal');

  const targetBranch = options.branch ? (options.branch.includes('Зайцев') ? 'zaytseva' : 'larochelle') : currentBranch;
  if (branchSelect) branchSelect.value = targetBranch;

  // ── СЦЕНАРИЙ 0: БРОНИРОВАНИЕ АБОНЕМЕНТА (БЕЗ ВЫБОРА ВРЕМЕНИ И НАПРАВЛЕНИЯ) ──
  if (mode === 'membership') {
    if (badgeEl) badgeEl.innerText = 'АБОНЕМЕНТ · ОПЛАТА В СТУДИИ';
    if (titleEl) titleEl.innerText = 'Бронирование абонемента';
    if (subEl) subEl.innerText = 'Выберите филиал и количество занятий. Оплата производится в студии перед первой тренировкой.';
    if (goalInput) goalInput.value = 'Бронь абонемента (оплата в студии)';

    // Показываем филиал, список абонементов и инфоблок
    if (branchGroup) branchGroup.style.display = '';
    if (membershipGroup) membershipGroup.style.display = '';
    if (membershipInfo) membershipInfo.style.display = 'block';

    // Скрываем выбор направления, времени и слот-инфо
    if (programGroup) programGroup.style.display = 'none';
    if (slotGroup) slotGroup.style.display = 'none';
    if (lockedInfo) lockedInfo.style.display = 'none';

    if (submitBtn) submitBtn.innerHTML = 'Забронировать абонемент';

    updateModalMemberships(targetBranch, options.membershipName || 'Абонемент на 8 занятий');
  }

  // ── СЦЕНАРИЙ 1: ПРОБНОЕ ЗАНЯТИЕ ──
  else if (mode === 'trial') {
    if (badgeEl) badgeEl.innerText = 'ПРОБНОЕ ЗАНЯТИЕ (500 ₽)';
    if (titleEl) titleEl.innerText = 'Запись на пробное занятие';
    if (subEl) subEl.innerText = 'Выберите филиал, направление и удобное время со свободными местами.';
    if (goalInput) goalInput.value = 'Пробное занятие (500 ₽)';

    if (lockedInfo) lockedInfo.style.display = 'none';
    if (membershipInfo) membershipInfo.style.display = 'none';
    if (membershipGroup) membershipGroup.style.display = 'none';

    if (branchGroup) branchGroup.style.display = '';
    if (programGroup) programGroup.style.display = '';
    if (slotGroup) slotGroup.style.display = '';
    if (programSelect) programSelect.disabled = false;
    if (submitBtn) submitBtn.innerHTML = 'Подтвердить запись';

    updateModalPrograms(targetBranch, options.program || null);
  }

  // ── СЦЕНАРИЙ 2: ЗАПИСЬ ЧЕРЕЗ ПРОГРАММЫ ТРЕНИРОВОК ──
  else if (mode === 'program') {
    preselectedProgramName = options.program || 'Пилатес';
    if (badgeEl) badgeEl.innerText = 'ПРОГРАММА ТРЕНИРОВОК';
    if (titleEl) titleEl.innerText = `Запись: ${preselectedProgramName}`;
    if (subEl) subEl.innerText = `Направление «${preselectedProgramName}» выбрано. Выберите филиал и подходящее время.`;
    if (goalInput) goalInput.value = `Программа: ${preselectedProgramName}`;

    if (lockedInfo) lockedInfo.style.display = 'none';
    if (membershipInfo) membershipInfo.style.display = 'none';
    if (membershipGroup) membershipGroup.style.display = 'none';

    if (branchGroup) branchGroup.style.display = '';
    if (programGroup) programGroup.style.display = '';
    if (slotGroup) slotGroup.style.display = '';
    if (programSelect) programSelect.disabled = false;
    if (submitBtn) submitBtn.innerHTML = 'Подтвердить запись';

    updateModalPrograms(targetBranch, preselectedProgramName);
  }

  // ── СЦЕНАРИЙ 3: ОНЛАЙН-РАСПИСАНИЕ (КОНКРЕТНЫЙ СЛОТ ЗАБЛОКИРОВАН) ──
  else if (mode === 'slot' && options.slot) {
    const slot = options.slot;
    const cleanBranch = (slot.branch === 'zaytseva' || slot.branch?.includes('Зайцев') || slot.branchName?.includes('Зайцев')) ? 'ул. Зайцева, 67 (1 этаж)' : 'наб. Ла-Рошель, 13';
    const dayLabel = slot.date || (DAY_NAMES[slot.day] || 'Ближайший день');
    
    let spots = slot.available !== undefined ? slot.available : slot.spots;
    let total = slot.total;

    if (spots === undefined || isNaN(spots)) {
      const found = SCHEDULE_DATA.find(s => {
        const b = (s.branch === 'zaytseva' || s.branch?.includes('Зайцев') || s.branchName?.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
        const targetB = cleanBranch.includes('Зайцев') ? 'zaytseva' : 'larochelle';
        return b === targetB && s.direction === slot.direction && s.time === slot.time;
      });
      if (found) {
        spots = (found.available !== undefined) ? found.available : found.spots;
        total = found.total || 8;
      } else {
        spots = 8;
        total = 8;
      }
    }

    spots = parseInt(spots, 10);
    total = parseInt(total || 8, 10);

    if (badgeEl) badgeEl.innerText = 'ВЫБРАННАЯ ТРЕНИРОВКА';
    if (titleEl) titleEl.innerText = `Запись: ${slot.direction}`;
    if (subEl) subEl.innerText = 'Параметры тренировки зафиксированы. Укажите имя и телефон для бронирования места.';
    if (goalInput) goalInput.value = `Онлайн-расписание: ${slot.direction}`;

    if (branchGroup) branchGroup.style.display = 'none';
    if (programGroup) programGroup.style.display = 'none';
    if (slotGroup) slotGroup.style.display = 'none';
    if (membershipGroup) membershipGroup.style.display = 'none';
    if (membershipInfo) membershipInfo.style.display = 'none';

    if (lockedInfo) {
      lockedInfo.style.display = 'block';
      const lDir = document.getElementById('lockedDir');
      const lDet = document.getElementById('lockedDetails');
      const lSpots = document.getElementById('lockedSpots');

      if (lDir) lDir.innerText = slot.direction;
      if (lDet) lDet.innerText = `${cleanBranch} · ${dayLabel} в ${slot.time} · ${slot.trainer || 'Инструктор'}`;
      if (lSpots) {
        lSpots.innerHTML = (spots > 0) 
          ? `Осталось мест: ${spots} из ${total}` 
          : `<span style="color: #EF4444;">Лист ожидания (все места заняты)</span>`;
      }
    }

    const programInput = document.getElementById('bookingProgram');
    const branchInput = document.getElementById('bookingBranch');
    const dateInput = document.getElementById('bookingDate');
    const timeInput = document.getElementById('bookingTime');
    const trainerInput = document.getElementById('bookingTrainer');

    if (programInput) programInput.value = slot.direction;
    if (branchInput) branchInput.value = cleanBranch;
    if (dateInput) dateInput.value = dayLabel;
    if (timeInput) timeInput.value = slot.time;
    if (trainerInput) trainerInput.value = slot.trainer || 'Инструктор';
    if (submitBtn) submitBtn.innerHTML = 'Подтвердить запись';
  }

  // ── СЦЕНАРИЙ 4: ОБЩАЯ ЗАПИСЬ (ШАПКА / ПОДВАЛ) ──
  else {
    if (badgeEl) badgeEl.innerText = 'ОНЛАЙН-БРОНИРОВАНИЕ';
    if (titleEl) titleEl.innerText = 'Запись на тренировку';
    if (subEl) subEl.innerText = 'Выберите филиал, направление и время занятия со свободными местами.';
    if (goalInput) goalInput.value = 'Общая запись на тренировку';

    if (lockedInfo) lockedInfo.style.display = 'none';
    if (membershipInfo) membershipInfo.style.display = 'none';
    if (membershipGroup) membershipGroup.style.display = 'none';

    if (branchGroup) branchGroup.style.display = '';
    if (programGroup) programGroup.style.display = '';
    if (slotGroup) slotGroup.style.display = '';
    if (programSelect) programSelect.disabled = false;
    if (submitBtn) submitBtn.innerHTML = 'Подтвердить запись';

    updateModalPrograms(targetBranch, null);
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (nameInput) setTimeout(() => nameInput.focus(), 150);
  initVkWidgets();
};

window.openBookingForSlot = function(direction, trainer, time, branch, date, spots, total) {
  // Абонемент
  if (direction && direction.toLowerCase().includes('абонемент')) {
    window.openUniversalBooking({
      mode: 'membership',
      membershipName: direction,
      branch: branch
    });
  }
  // Точный слот расписания
  else if (time && time !== 'Удобное время') {
    const targetBranchKey = (branch && branch.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
    const foundSlot = SCHEDULE_DATA.find(s => {
      const b = (s.branch === 'zaytseva' || s.branch?.includes('Зайцев') || s.branchName?.includes('Зайцев')) ? 'zaytseva' : 'larochelle';
      return b === targetBranchKey && s.direction === direction && s.time === time;
    });

    const realAvail = (spots !== undefined && !isNaN(spots)) 
      ? parseInt(spots, 10) 
      : (foundSlot ? ((foundSlot.available !== undefined) ? parseInt(foundSlot.available, 10) : parseInt(foundSlot.spots, 10)) : 8);
    const realTotal = (total !== undefined && !isNaN(total)) 
      ? parseInt(total, 10) 
      : (foundSlot ? parseInt(foundSlot.total || 8, 10) : 8);

    window.openUniversalBooking({
      mode: 'slot',
      slot: {
        direction: direction,
        trainer: trainer,
        time: time,
        branch: branch,
        date: date,
        available: realAvail,
        spots: realAvail,
        total: realTotal
      }
    });
  } 
  // Направление
  else if (direction && !direction.includes('занятие')) {
    window.openUniversalBooking({
      mode: 'program',
      program: direction,
      branch: branch
    });
  } 
  // Пробное
  else if (direction && direction.includes('Пробное')) {
    window.openUniversalBooking({
      mode: 'trial',
      branch: branch
    });
  } 
  // Общая
  else {
    window.openUniversalBooking({
      mode: 'general',
      branch: branch
    });
  }
};

/* --------------------------------------------------------------------------
   08. TRAINER MODALS
   -------------------------------------------------------------------------- */
const TRAINERS_DATA = {
  'tatyana-prokopenko': {
    name: 'Таня П. (Татьяна Прокопенко)',
    role: 'Основатель студии · Старший тренер',
    image: './assets/img/trainers/trainer-tatyana-prokopenko.png',
    experience: 'Опыт работы с 2013 г. (11+ лет)',
    education: 'Высшее профильное спортивно-педагогическое образование ПетрГУ. Сертифицированный специалист по биомеханике, пилатесу и женскому здоровью.',
    achievements: 'Основатель фитнес-студии «Vishenka». Многократный призер чемпионатов г. Петрозаводск, Республики Карелия и СЗФО по фитнес-аэробике.',
    specialties: ['Здоровая спина', 'Пилатес', 'Умный фитнес', 'Женское здоровье']
  },
  'dasha-ch': {
    name: 'Даша Ч.',
    role: 'Инструктор TRX · Zumba · Функционал',
    image: './assets/img/trainers/trainer-dasha-ch.png',
    experience: 'Опыт работы с 2024 г.',
    education: 'Сертифицированный тренер по функциональной подготовке и кардио-выносливости.',
    achievements: '4 года в танцевальном фитнесе. Постоянный участник мастер-классов Zumba в Карелии и Санкт-Петербурге.',
    specialties: ['Петли TRX', 'Zumba Fitness', 'Функционал', 'Кардио']
  },
  'masha': {
    name: 'Маша',
    role: 'Мастер по Йоге · Здоровая спина · Фитбол',
    image: './assets/img/trainers/trainer-masha.png',
    experience: 'Опыт работы с 2023 г.',
    education: 'Курсы оздоровительной физкультуры, суставной гимнастики и реабилитационного фитнеса.',
    achievements: 'Мастер по Йоге. Деликатная работа с суставами и восстановление подвижности позвоночника.',
    specialties: ['Хатха-йога', 'Йога-релакс', 'Здоровая спина', 'Суставная гимнастика']
  },
  'alena': {
    name: 'Алена',
    role: 'Инструктор по Пилатесу · Здоровая спина',
    image: './assets/img/trainers/trainer-alena.png',
    experience: 'Опыт работы с 2023 г.',
    education: 'Международная сертификация по направлению Pilates Mat, миофасциальному релизу и постуральному контролю.',
    achievements: 'Специалист по коррекции осанки и восстановлению мышечного баланса.',
    specialties: ['Пилатес', 'Pilates Mat', 'Здоровая спина', 'МФР']
  },
  'alina': {
    name: 'Алина',
    role: 'Инструктор по Растяжке · Гибкость',
    image: './assets/img/trainers/trainer-alina.png',
    experience: 'Опыт работы с 2023 г.',
    education: 'Дипломированный специалист по стретчингу, безопасной гибкости и суставной мобильности.',
    achievements: 'Разработка авторских методик мягкой и динамической растяжки без боли и травм.',
    specialties: ['Классическая растяжка', 'Динамическая растяжка', 'Шпагат', 'Мобильность']
  },
  'dasha-p': {
    name: 'Даша П.',
    role: 'Инструктор Силовых программ и TRX',
    image: './assets/img/trainers/trainer-dasha-p.png',
    experience: 'Опыт работы с 2022 г.',
    education: 'Сертифицированный тренер по силовому тренингу, функциональным петлям TRX и круговым тренировкам.',
    achievements: 'Эксперт по формированию рельефа, укреплению мышечного корсета и сжиганию калорий.',
    specialties: ['Петли TRX', 'Силовой фитнес', 'Тонус тела', 'Круговой тренинг']
  },
  'nastya': {
    name: 'Настя',
    role: 'Инструктор по Хатха-йоге · Стретчинг',
    image: './assets/img/trainers/trainer-nastya.png',
    experience: 'Опыт работы с 2023 г.',
    education: 'Обучение в ведущих школах йоги. Практики осознанного дыхания, баланса и гибкости.',
    achievements: 'Ведение программ по снятию психоэмоционального напряжения и раскрытию подвижности тела.',
    specialties: ['Хатха-йога', 'Йога-релакс', 'Антистресс', 'Растяжка']
  }
};

function initTrainerModals() {
  const cards = document.querySelectorAll('.trainer-glass-card');
  const modal = document.getElementById('trainerModal');
  const modalBody = document.getElementById('trainerModalBody');
  const closeBtn = document.getElementById('trainerModalClose');

  if (!modal || !modalBody) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const trainerKey = card.getAttribute('data-trainer');
      const data = TRAINERS_DATA[trainerKey];
      if (!data) return;

      modalBody.innerHTML = `
        <div style="display: flex; gap: 24px; align-items: flex-start; flex-direction: column;">
          <div style="display: flex; gap: 20px; align-items: center; width: 100%;">
            <img src="${data.image}" alt="${data.name}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-turquoise);">
            <div>
              <span class="t-label" style="color: var(--color-turquoise-dark);">${data.role}</span>
              <h3 class="t-h3" style="margin-top: 4px;">${data.name}</h3>
              <p class="t-body-sm" style="color: var(--color-ink-dim);">${data.experience}</p>
            </div>
          </div>

          <div style="width: 100%; display: flex; flex-direction: column; gap: 16px;">
            <div>
              <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink-primary); margin-bottom: 6px;">Образование и сертификаты</h4>
              <p class="t-body-sm" style="color: var(--color-ink-body); line-height: 1.6;">${data.education}</p>
            </div>

            <div>
              <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink-primary); margin-bottom: 6px;">Опыт и достижения</h4>
              <p class="t-body-sm" style="color: var(--color-ink-body); line-height: 1.6;">${data.achievements}</p>
            </div>

            <div>
              <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink-primary); margin-bottom: 8px;">Специализация</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.specialties.map(s => `<span style="display: inline-block; padding: 4px 10px; background: var(--color-canvas-alt); border-radius: var(--radius-pill); font-size: 0.75rem; font-weight: 600; color: var(--color-ink-primary); border: 1px solid var(--hairline-strong);">${s}</span>`).join('')}
              </div>
            </div>

            <button class="btn-pill btn-pill-dark" style="width: 100%; margin-top: 10px;" onclick="closeAllModals(); openUniversalBooking({ mode: 'trial', title: 'Запись к тренеру: ${data.name}' });">
              Записаться к тренеру →
            </button>
          </div>
        </div>
      `;

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', () => closeAllModals());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAllModals();
  });
}

/* --------------------------------------------------------------------------
   09. SPACE LIGHTBOX
   -------------------------------------------------------------------------- */
function initSpaceLightbox() {
  const triggerImgs = document.querySelectorAll('.space-gallery-img');
  const modal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');

  if (!modal || !lightboxImg) return;

  triggerImgs.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.getAttribute('src');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  modal.addEventListener('click', () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  });
}

/* --------------------------------------------------------------------------
   10. FAQ ACCORDION
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-clean-item');

  items.forEach(item => {
    const trigger = item.querySelector('.faq-clean-trigger');
    const body = item.querySelector('.faq-clean-body');

    if (!trigger || !body) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      items.forEach(other => {
        other.classList.remove('active');
        const otherBody = other.querySelector('.faq-clean-body');
        if (otherBody) otherBody.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 30 + 'px';
      }
    });
  });
}

/* --------------------------------------------------------------------------
   11. BOOKING FORM & SUBMIT
   -------------------------------------------------------------------------- */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const phoneInput = document.getElementById('bookingPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let val = phoneInput.value.replace(/\D/g, '');
      if (val.startsWith('7') || val.startsWith('8')) val = val.substring(1);
      
      let formatted = '+7 ';
      if (val.length > 0) formatted += '(' + val.substring(0, 3);
      if (val.length >= 3) formatted += ') ' + val.substring(3, 6);
      if (val.length >= 6) formatted += '-' + val.substring(6, 8);
      if (val.length >= 8) formatted += '-' + val.substring(8, 10);
      phoneInput.value = formatted;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('bookingName')?.value.trim();
    const phone = phoneInput?.value.trim();
    const branch = document.getElementById('bookingBranch')?.value;
    const program = document.getElementById('bookingProgram')?.value;
    const trainer = document.getElementById('bookingTrainer')?.value;
    const time = document.getElementById('bookingTime')?.value;
    const date = document.getElementById('bookingDate')?.value || '';
    const goal = document.getElementById('bookingGoal')?.value || '';
    const submitBtn = document.getElementById('bookingSubmitBtn') || form.querySelector('button[type="submit"]');

    if (!name || name.length < 2) {
      alert('Пожалуйста, укажите ваше имя');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
      alert('Пожалуйста, введите корректный номер телефона (11 цифр)');
      return;
    }

    if (!submitBtn) return;
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Бронирование...';

    const payload = {
      name: name,
      phone: phone,
      branch: branch,
      direction: program,
      trainer: trainer,
      time: time,
      date: date,
      goal: goal,
      source: window.location.href,
      token: window._csrfToken || '',
      vk_user_id: clientVkUserId || ''
    };

    const isMembership = activeBookingMode === 'membership' || (program && program.toLowerCase().includes('абонемент'));

    try {
      const response = await fetch(`${API_URL}?action=book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result && result.success) {
        submitBtn.innerHTML = '✓ Успешно забронировано!';
        submitBtn.style.backgroundColor = '#10B981';

        setTimeout(() => {
          form.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          submitBtn.style.backgroundColor = '';

          showSuccessModal({
            name: name,
            branch: branch,
            direction: program,
            time: time,
            date: date,
            isMembership: isMembership
          });

          if (window.loadLiveSchedule) {
            window.loadLiveSchedule();
          }
        }, 400);
      } else {
        alert(result.error || 'Произошла ошибка при отправке заявки. Пожалуйста, позвоните нам: +7 911 433 68 82');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.style.backgroundColor = '';
      }
    } catch (err) {
      console.warn('API fallback:', err);
      submitBtn.innerHTML = '✓ Успешно забронировано!';
      submitBtn.style.backgroundColor = '#10B981';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.style.backgroundColor = '';

        showSuccessModal({
          name: name,
          branch: branch,
          direction: program,
          time: time,
          date: date,
          isMembership: isMembership
        });
      }, 400);
    }
  });
}

function showSuccessModal(data = {}) {
  const modal = document.getElementById('successModal');
  const badgeEl = document.getElementById('successModalBadge');
  const titleEl = document.getElementById('successModalTitle');
  const msgEl = document.getElementById('successModalMessage');
  const detailsEl = document.getElementById('successModalDetailsCard');

  if (!modal) return;

  const name = data.name || 'Гость';
  const branch = data.branch || 'студия Vishenka';
  const direction = data.direction || 'Тренировка';
  const isMembership = data.isMembership;

  const pinSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-turquoise-dark); vertical-align: -2px; margin-right: 6px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const timeSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-turquoise-dark); vertical-align: -2px; margin-right: 6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const cardSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-turquoise-dark); vertical-align: -2px; margin-right: 6px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
  const starSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-turquoise-dark); vertical-align: -2px; margin-right: 6px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  if (isMembership) {
    if (badgeEl) badgeEl.innerText = 'БРОНИРОВАНИЕ УСПЕШНО';
    if (titleEl) titleEl.innerText = `Поздравляем, ${name}!`;
    if (msgEl) msgEl.innerText = 'Ваш абонемент успешно забронирован! Прекрасный шаг на пути к здоровью, легкости и гармонии тела. Ждём вас на тренировках в студии Vishenka.';
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div style="font-weight: 700; color: var(--color-ink-primary); font-size: 1rem; margin-bottom: 8px;">${starSvg} ${direction}</div>
        <div style="color: var(--color-ink-body); margin-bottom: 8px;">${pinSvg} Филиал: <strong>${branch}</strong></div>
        <div style="font-size: 0.8125rem; color: var(--color-turquoise-dark); font-weight: 700;">${cardSvg} Оплата производится у администратора в студии перед первым занятием</div>
      `;
    }
  } else {
    if (badgeEl) badgeEl.innerText = 'ЗАПИСЬ ПОДТВЕРЖДЕНА';
    if (titleEl) titleEl.innerText = `Вы успешно записаны, ${name}!`;
    if (msgEl) msgEl.innerText = 'Ваше место на тренировку забронировано! Возьмите с собой удобную форму, носочки и отличное настроение.';
    if (detailsEl) {
      const timeStr = data.date ? `${data.date} в ${data.time}` : (data.time || 'Удобное время');
      detailsEl.innerHTML = `
        <div style="font-weight: 700; color: var(--color-ink-primary); font-size: 1rem; margin-bottom: 8px;">${starSvg} Направление: <strong>${direction}</strong></div>
        <div style="color: var(--color-ink-body); margin-bottom: 8px;">${timeSvg} Время: <strong>${timeStr}</strong></div>
        <div style="color: var(--color-ink-body); margin-bottom: 8px;">${pinSvg} Филиал: <strong>${branch}</strong></div>
        <div style="font-size: 0.8125rem; color: var(--color-turquoise-dark); font-weight: 700;">${cardSvg} Оплата производится в студии перед началом тренировки</div>
      `;
    }
  }

  // Закрываем модалку формы и открываем окно успеха
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  initVkWidgets();
}

/* --------------------------------------------------------------------------
   12. VK ALLOW MESSAGES WIDGETS
   -------------------------------------------------------------------------- */
let clientVkUserId = null;

function initVkWidgets() {
  const render = () => {
    if (typeof VK !== 'undefined' && VK.Widgets && VK.Widgets.AllowMessagesFromCommunity) {
      try {
        const w1 = document.getElementById('vk_allow_messages');
        if (w1) {
          w1.innerHTML = '';
          VK.Widgets.AllowMessagesFromCommunity("vk_allow_messages", { height: 30 }, 55256163);
        }

        const w2 = document.getElementById('vk_success_allow_messages');
        if (w2) {
          w2.innerHTML = '';
          VK.Widgets.AllowMessagesFromCommunity("vk_success_allow_messages", { height: 30 }, 55256163);
        }

        if (VK.Observer && VK.Observer.subscribe) {
          VK.Observer.subscribe("widgets.allowMessagesFromCommunity.allowed", function(userId) {
            console.log("VK notifications allowed for user:", userId);
            clientVkUserId = userId;
          });

          VK.Observer.subscribe("widgets.allowMessagesFromCommunity.denied", function(userId) {
            clientVkUserId = null;
          });
        }
      } catch (err) {
        console.warn('VK Widget initialization:', err);
      }
    }
  };

  setTimeout(render, 60);
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop, .lightbox-modal').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   13. COOKIE CONSENT BANNER
   -------------------------------------------------------------------------- */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAcceptBtn');
  if (!banner || !acceptBtn) return;

  const isAccepted = localStorage.getItem('vishenka_cookie_accepted');
  if (!isAccepted) {
    setTimeout(() => {
      banner.style.display = 'block';
    }, 800);
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('vishenka_cookie_accepted', '1');
    banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(20px)';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 300);
  });
}
