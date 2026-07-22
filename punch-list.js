// Room-by-room punch list builder — Homeowners page (premium edition).
// Lets someone click through rooms, check off things they want done, watch
// a "project scope" meter build, then send the whole list into a quote
// request with a clean review summary.
(function () {
  var tool = document.getElementById('punchTool');
  if (!tool) return;

  var ICONS = {
    kitchen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 9h1M21 9h1"/></svg>',
    bathroom: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>',
    bedroom: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18"/><path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/></svg>',
    basement: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7l10-5 10 5-10 5-10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></svg>',
    exterior: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 7 8 3 3 3c0 5 4 9 9 9z"/><path d="M12 12c0-5 4-9 9-9 0 5-4 9-9 9z"/></svg>',
    general: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V19a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>'
  };

  var CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';

  var ROOMS = {
    kitchen: {
      label: 'Kitchen',
      items: [
        'Fix or replace a leaky kitchen faucet',
        'Garbage disposal install or repair',
        'Dishwasher or range/stove install',
        'Cabinet repair or new cabinet install',
        'Backsplash or countertop install',
        'Patch and repaint walls'
      ]
    },
    bathroom: {
      label: 'Bathroom',
      items: [
        'Fix a running or leaking toilet',
        'Vanity or sink install',
        'Tile repair or regrout',
        'Exhaust fan replacement',
        'Grab bar install for added safety',
        'Recaulk the tub or shower'
      ]
    },
    bedroom: {
      label: 'Bedroom',
      items: [
        'Patch and repaint walls',
        'Ceiling fan or light fixture install',
        'Closet or bifold door repair',
        'Squeaky floor fix or flooring repair',
        'Trim, molding, or hardware fixes',
        'Curtain rod or blinds install'
      ]
    },
    basement: {
      label: 'Basement',
      items: [
        'Water damage assessment or moisture check',
        'Insulation replacement',
        'Drain unclog or plumbing check',
        'Shelving or storage install',
        'GFCI outlet install or lighting update',
        'Smoke/CO detector install'
      ]
    },
    exterior: {
      label: 'Exterior & Yard',
      items: [
        'Siding repair',
        'Deck board or fence picket replacement',
        'Gutter, shingle, or roof inspection',
        'House wash or driveway pressure washing',
        'Yard cleanup, mowing, or mulch',
        'Junk haul or debris pickup'
      ]
    },
    general: {
      label: 'Whole House',
      items: [
        'Entry door, storm door, or lock install',
        'Doorbell or camera install',
        'Window re-glaze or shutter install',
        'TV mount, furniture assembly, or mirror hanging',
        'Seasonal turnover (AC units, winterization)',
        'Full punch-list repairs, big or small'
      ]
    }
  };

  var order = ['kitchen', 'bathroom', 'bedroom', 'basement', 'exterior', 'general'];
  var activeRoom = order[0];
  var selections = {}; // "kitchen::0" -> item text, or "kitchen::custom::3" -> custom item text
  var customCounter = 0;

  var tabsEl = document.getElementById('punchTabs');
  var listEl = document.getElementById('punchList');
  var summaryEl = document.getElementById('punchSummaryBody');
  var tierEl = document.getElementById('punchTier');
  var scopeFillEl = document.getElementById('punchScopeFill');
  var scopeLabelEl = document.getElementById('punchScopeLabel');
  var ctaBtn = document.getElementById('punchCtaBtn');
  var formWrap = document.getElementById('punchFormWrap');
  var reviewEl = document.getElementById('punchReview');
  var listField = document.getElementById('punchListField');
  var step1El = document.getElementById('punchStep1');
  var step2El = document.getElementById('punchStep2');

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function keyFor(room, i) { return room + '::' + i; }
  function customKeyFor(room, n) { return room + '::custom::' + n; }
  function isCustomKey(k, room) { return k.indexOf(room + '::custom::') === 0; }

  function tierFor(total) {
    if (total === 0) return { label: 'No items yet', pct: 0 };
    if (total <= 3) return { label: 'Quick Refresh', pct: 33 };
    if (total <= 7) return { label: 'Standard Project', pct: 66 };
    return { label: 'Full Renovation', pct: 100 };
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    order.forEach(function (r) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'punch-tab-premium' + (r === activeRoom ? ' is-active' : '');
      btn.innerHTML = ICONS[r] + '<span>' + ROOMS[r].label + '</span>';
      btn.addEventListener('click', function () {
        activeRoom = r;
        renderTabs();
        renderList();
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderList() {
    listEl.innerHTML = '';
    ROOMS[activeRoom].items.forEach(function (text, i) {
      var k = keyFor(activeRoom, i);
      var isChecked = !!selections[k];
      var item = document.createElement('div');
      item.className = 'punch-item-premium' + (isChecked ? ' is-checked' : '');
      item.setAttribute('role', 'checkbox');
      item.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      item.setAttribute('tabindex', '0');
      item.innerHTML =
        '<span class="punch-check-icon">' + CHECK_SVG + '</span>' +
        '<span>' + text + '</span>';

      function toggle() {
        var nowChecked = !item.classList.contains('is-checked');
        item.classList.toggle('is-checked', nowChecked);
        item.setAttribute('aria-checked', nowChecked ? 'true' : 'false');
        if (nowChecked) { selections[k] = text; } else { delete selections[k]; }
        renderSummary();
      }
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });

      listEl.appendChild(item);
    });

    // Any custom ("something else") items already added for this room
    Object.keys(selections).forEach(function (k) {
      if (!isCustomKey(k, activeRoom)) return;
      var text = selections[k];
      var item = document.createElement('div');
      item.className = 'punch-item-premium is-checked punch-item-custom';
      item.setAttribute('role', 'checkbox');
      item.setAttribute('aria-checked', 'true');
      item.setAttribute('tabindex', '0');
      item.innerHTML =
        '<span class="punch-check-icon">' + CHECK_SVG + '</span>' +
        '<span>' + escapeHtml(text) + '</span>' +
        '<button type="button" class="punch-item-custom-remove" aria-label="Remove this item">&times;</button>';
      item.querySelector('.punch-item-custom-remove').addEventListener('click', function (e) {
        e.stopPropagation();
        delete selections[k];
        renderList();
        renderSummary();
      });
      listEl.appendChild(item);
    });

    // Free-text "add your own" row — lets someone add something not on the list
    var addRow = document.createElement('div');
    addRow.className = 'punch-custom-add';
    addRow.innerHTML =
      '<input type="text" placeholder="Something else? Type it here..." aria-label="Add a custom item for this room" maxlength="120">' +
      '<button type="button">Add</button>';
    var customInput = addRow.querySelector('input');
    var customBtn = addRow.querySelector('button');
    function addCustomItem() {
      var val = customInput.value.trim();
      if (!val) { customInput.focus(); return; }
      customCounter++;
      selections[customKeyFor(activeRoom, customCounter)] = val;
      customInput.value = '';
      renderList();
      renderSummary();
    }
    customBtn.addEventListener('click', addCustomItem);
    customInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCustomItem(); }
    });
    listEl.appendChild(addRow);
  }

  function compileList() {
    var byRoom = {};
    var total = 0;
    order.forEach(function (r) {
      ROOMS[r].items.forEach(function (text, i) {
        var k = keyFor(r, i);
        if (selections[k]) {
          byRoom[r] = byRoom[r] || [];
          byRoom[r].push({ key: k, text: text });
          total++;
        }
      });
      Object.keys(selections).forEach(function (k) {
        if (!isCustomKey(k, r)) return;
        byRoom[r] = byRoom[r] || [];
        byRoom[r].push({ key: k, text: selections[k] });
        total++;
      });
    });
    return { byRoom: byRoom, total: total };
  }

  function renderSummary() {
    var compiled = compileList();
    var tier = tierFor(compiled.total);

    if (tierEl) tierEl.innerHTML = CHECK_SVG.replace('14" height="14"', '11" height="11"') + ' ' + tier.label;
    if (scopeFillEl) scopeFillEl.style.width = tier.pct + '%';
    if (scopeLabelEl) {
      scopeLabelEl.innerHTML = compiled.total === 0
        ? 'Start checking things off to build your scope'
        : '<strong>' + tier.label + '</strong> · ' + compiled.total + (compiled.total === 1 ? ' item selected' : ' items selected');
    }

    summaryEl.innerHTML = '';
    if (compiled.total === 0) {
      var empty = document.createElement('p');
      empty.className = 'punch-empty';
      empty.textContent = "Nothing added yet — check off anything you'd like done and it'll show up here.";
      summaryEl.appendChild(empty);
      ctaBtn.disabled = true;
    } else {
      order.forEach(function (r) {
        if (!compiled.byRoom[r]) return;
        var group = document.createElement('div');
        group.className = 'punch-room-group';
        var h4 = document.createElement('h4');
        h4.textContent = ROOMS[r].label;
        var ul = document.createElement('ul');
        compiled.byRoom[r].forEach(function (entry) {
          var li = document.createElement('li');
          var span = document.createElement('span');
          span.textContent = entry.text;
          var removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'punch-remove';
          removeBtn.setAttribute('aria-label', 'Remove');
          removeBtn.innerHTML = '&times;';
          removeBtn.addEventListener('click', function () {
            delete selections[entry.key];
            renderSummary();
            if (activeRoom === r) renderList();
          });
          li.appendChild(span);
          li.appendChild(removeBtn);
          ul.appendChild(li);
        });
        group.appendChild(h4);
        group.appendChild(ul);
        summaryEl.appendChild(group);
      });
      var count = document.createElement('span');
      count.className = 'punch-count';
      count.textContent = compiled.total + (compiled.total === 1 ? ' item' : ' items') + ' on your list';
      summaryEl.appendChild(count);
      ctaBtn.disabled = false;
    }

    if (listField) {
      var lines = [];
      order.forEach(function (r) {
        if (compiled.byRoom[r]) {
          lines.push(ROOMS[r].label + ':');
          compiled.byRoom[r].forEach(function (entry) { lines.push('- ' + entry.text); });
        }
      });
      listField.value = lines.join('\n');
    }

    if (reviewEl) {
      reviewEl.innerHTML = '';
      order.forEach(function (r) {
        if (!compiled.byRoom[r]) return;
        var room = document.createElement('div');
        room.className = 'punch-review-room';
        var strong = document.createElement('strong');
        strong.textContent = ROOMS[r].label;
        var ul = document.createElement('ul');
        compiled.byRoom[r].forEach(function (entry) {
          var li = document.createElement('li');
          li.innerHTML = CHECK_SVG + '<span>' + escapeHtml(entry.text) + '</span>';
          ul.appendChild(li);
        });
        room.appendChild(strong);
        room.appendChild(ul);
        reviewEl.appendChild(room);
      });
    }
  }

  ctaBtn.addEventListener('click', function () {
    if (!formWrap) return;
    formWrap.style.display = '';
    if (step1El) step1El.classList.remove('is-active');
    if (step2El) step2El.classList.add('is-active');
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderTabs();
  renderList();
  renderSummary();
})();
