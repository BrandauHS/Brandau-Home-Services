// Seasonal maintenance checklist — Homeowners page.
// Chicagoland-specific maintenance items grouped by season, with a live
// "you're in good shape" / "get ahead of this" result as items are checked.
(function () {
  var tool = document.getElementById('maintTool');
  if (!tool) return;

  var SEASONS = {
    winter: {
      label: 'Winter',
      months: [11, 0, 1], // Dec, Jan, Feb
      items: [
        'Insulate exposed pipes to keep them from freezing',
        'Check the furnace filter and get the furnace serviced',
        'Test smoke and carbon monoxide detectors',
        'Clear snow and ice buildup away from the foundation',
        'Seal drafts around doors and windows',
        'Watch for ice dams forming on the roofline'
      ]
    },
    spring: {
      label: 'Spring',
      months: [2, 3, 4], // Mar, Apr, May
      items: [
        'Inspect the roof for winter damage or missing shingles',
        'Check the foundation and basement for water intrusion after snowmelt',
        'Clean out gutters and downspouts',
        'Test that the sump pump is working before spring rains',
        'Look for cracking in siding, concrete, or the driveway',
        'Get the AC serviced before it heats up'
      ]
    },
    summer: {
      label: 'Summer',
      months: [5, 6, 7], // Jun, Jul, Aug
      items: [
        'Inspect and re-caulk exterior trim, windows, and doors',
        'Check the deck or porch for rot or loose boards',
        'Clean the dryer vent and exhaust line',
        'Check attic ventilation as temperatures peak',
        'Power wash siding and walkways',
        'Look for pest or critter entry points around the exterior'
      ]
    },
    fall: {
      label: 'Fall',
      months: [8, 9, 10], // Sep, Oct, Nov
      items: [
        'Clean gutters after the leaves come down',
        'Schedule a furnace tune-up before heating season',
        'Seal cracks in the driveway and walkways before the freeze-thaw cycle',
        'Check weatherstripping and caulk around doors and windows',
        'Disconnect and drain outdoor hoses and spigots',
        'Inspect the roof and flashing before winter'
      ]
    }
  };

  var order = ['winter', 'spring', 'summer', 'fall'];
  var checked = {}; // { season: Set of indices }
  order.forEach(function (s) { checked[s] = new Set(); });

  var now = new Date();
  var month = now.getMonth();
  var currentSeason = order.find(function (s) {
    return SEASONS[s].months.indexOf(month) !== -1;
  }) || 'winter';

  var activeSeason = currentSeason;

  var tabsEl = tool.querySelector('.maint-tabs');
  var listEl = tool.querySelector('.maint-list');
  var resultEl = tool.querySelector('.maint-result');

  function renderTabs() {
    tabsEl.innerHTML = '';
    order.forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'maint-tab' + (s === activeSeason ? ' is-active' : '');
      btn.textContent = SEASONS[s].label + (s === currentSeason ? ' (Now)' : '');
      btn.addEventListener('click', function () {
        activeSeason = s;
        renderTabs();
        renderList();
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderList() {
    listEl.innerHTML = '';
    SEASONS[activeSeason].items.forEach(function (text, i) {
      var li = document.createElement('li');
      var isChecked = checked[activeSeason].has(i);
      li.className = 'maint-item' + (isChecked ? ' is-checked' : '');
      var label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'flex-start';
      label.style.gap = '12px';
      label.style.width = '100%';
      label.style.cursor = 'pointer';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isChecked;
      cb.addEventListener('change', function () {
        if (cb.checked) { checked[activeSeason].add(i); } else { checked[activeSeason].delete(i); }
        li.classList.toggle('is-checked', cb.checked);
        renderResult();
      });

      var span = document.createElement('span');
      span.textContent = text;

      label.appendChild(cb);
      label.appendChild(span);
      li.appendChild(label);
      listEl.appendChild(li);
    });
    renderResult();
  }

  function renderResult() {
    var total = SEASONS[activeSeason].items.length;
    var done = checked[activeSeason].size;
    var pct = done / total;
    resultEl.classList.remove('maint-result--good', 'maint-result--warn');
    var msg, sub;
    if (done === 0) {
      msg = "Let's see where you stand.";
      sub = 'Check off what you\'ve already handled for ' + SEASONS[activeSeason].label.toLowerCase() + '.';
    } else if (pct >= 0.7) {
      resultEl.classList.add('maint-result--good');
      msg = "You're in good shape!";
      sub = 'Looks like you\'re on top of ' + SEASONS[activeSeason].label.toLowerCase() + ' maintenance. Keep it up.';
    } else {
      resultEl.classList.add('maint-result--warn');
      msg = 'You might want to get ahead of this.';
      sub = 'A few ' + SEASONS[activeSeason].label.toLowerCase() + ' items are still open — happy to help knock them out.';
    }
    resultEl.innerHTML =
      '<div><strong>' + msg + '</strong><span>' + sub + '</span></div>' +
      '<div class="maint-result-count">' + done + ' of ' + total + ' done</div>';
  }

  renderTabs();
  renderList();
})();
