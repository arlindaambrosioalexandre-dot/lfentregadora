const $ = id => document.getElementById(id);

let promos = [];
try {
  promos = JSON.parse(localStorage.getItem('promocoes') || '[]');
  if (!Array.isArray(promos)) promos = [];
} catch { promos = []; }

let current = new Date();
current = new Date(current.getFullYear(), current.getMonth(), 1);
let selectedDate = '';

const pad = n => String(n).padStart(2, '0');
const dateKey = d =>
  `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPromos();
}

function changeMonth(delta) {
  current.setMonth(current.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const year = current.getFullYear();
  const month = current.getMonth();
  $('monthTitle').textContent = new Intl.DateTimeFormat('pt-PT', {
    month: 'long', year: 'numeric'
  }).format(current);

  const cal = $('calendar');
  cal.replaceChildren();

  ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach(name => {
    const el = document.createElement('div');
    el.className = 'weekday';
    el.textContent = name;
    cal.appendChild(el);
  });

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day empty';
    cal.appendChild(empty);
  }

  for (let n = 1; n <= total; n++) {
    const date = dateKey(new Date(year, month, n));
    const day = document.createElement('div');
    day.className = 'day';
    if (date === dateKey(new Date())) day.classList.add('today');
    if (date === selectedDate) day.classList.add('selected');

    const number = document.createElement('strong');
    number.textContent = n;
    day.appendChild(number);

    promos.filter(p => p.startDate <= date && p.endDate >= date)
      .forEach(p => {
        const tag = document.createElement('span');
        tag.className = 'event';
        tag.textContent = p.title;
        day.appendChild(tag);
      });

    day.addEventListener('click', () => {
      selectedDate = date;
      $('startDate').value = date;
      if (!$('endDate').value || $('endDate').value < date) {
        $('endDate').value = date;
      }
      renderCalendar();
      showPage('newPage', document.querySelectorAll('nav button')[1]);
    });

    cal.appendChild(day);
  }
}

function statusOf(p) {
  const today = dateKey(new Date());
  if (today < p.startDate) return 'Agendada';
  if (today > p.endDate) return 'Terminada';
  return 'Ativa';
}

function formatDate(value) {
  if (!value) return '';
  const [y,m,d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function renderPromos() {
  const sorted = [...promos].sort((a,b) => a.startDate.localeCompare(b.startDate));

  $('calendarPromos').replaceChildren();
  $('notifications').replaceChildren();

  if (!sorted.length) {
    $('calendarPromos').textContent = 'Ainda não existem promoções registadas.';
    $('notifications').textContent = 'Não existem notificações por enquanto.';
    return;
  }

  sorted.forEach(p => {
    const card = document.createElement('article');
    card.className = 'promo';

    const heading = document.createElement('h3');
    heading.textContent = p.title;
    card.appendChild(heading);

    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = statusOf(p);
    card.appendChild(status);

    const dates = document.createElement('p');
    dates.textContent = `${formatDate(p.startDate)} – ${formatDate(p.endDate)} | Desconto: ${p.discount}%`;
    card.appendChild(dates);

    if (p.description) {
      const desc = document.createElement('p');
      desc.textContent = p.description;
      card.appendChild(desc);
    }

    if (p.link) {
      const link = document.createElement('a');
      link.href = p.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Ver promoção';
      card.appendChild(link);
    }

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = 'Eliminar';
    del.addEventListener('click', () => {
      if (confirm('Deseja eliminar esta promoção?')) {
        promos = promos.filter(item => item.id !== p.id);
        save();
      }
    });
    card.appendChild(del);

    $('calendarPromos').appendChild(card.cloneNode(true));
    $('notifications').appendChild(card);
  });
}

function save() {
  localStorage.setItem('promocoes', JSON.stringify(promos));
  renderCalendar();
  renderPromos();
}

$('promoForm').addEventListener('submit', event => {
  event.preventDefault();

  const startDate = $('startDate').value;
  const endDate = $('endDate').value;

  if (endDate < startDate) {
    alert('A data de fim não pode ser anterior à data de início.');
    return;
  }

  promos.push({
    id: Date.now().toString(),
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    startDate,
    endDate,
    discount: Number($('discount').value || 0),
    link: $('promoLink').value.trim()
  });

  save();
  $('promoForm').reset();
  $('discount').value = 10;
  alert('Promoção guardada e adicionada às notificações!');
  showPage('notificationsPage', document.querySelectorAll('nav button')[2]);
});

renderCalendar();
renderPromos();