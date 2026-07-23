// Interactive service-area map for the Homeowners page.
// Checks an entered address against a 50-mile radius around
// Brandau Home Services' home base in Channahon, IL.
//
// ANALYTICS / GOOGLE ADS NOTE:
// This fires a "address_checked" event via gtag()/dataLayer whenever someone
// submits an address, with whether they were in range. It's a no-op until a
// Google Analytics (GA4) or Google Tag Manager snippet is added to this page
// (see the commented example near the top of homeowners.html <head>). Once a
// GA4 Measurement ID or GTM container is in place, this event will show up in
// GA4's Events report and can be turned into a Google Ads conversion action.
(function () {
  var BASE_LAT = 41.4331;
  var BASE_LNG = -88.2276;
  var RADIUS_MILES = 50;

  var mapEl = document.getElementById('serviceMap');
  if (!mapEl || typeof L === 'undefined') return;

  var map = L.map('serviceMap', { scrollWheelZoom: false }).setView([BASE_LAT, BASE_LNG], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);

  var resultMarker = null;

  function milesBetween(lat1, lon1, lat2, lon2) {
    var R = 3958.8;
    function toRad(d) { return (d * Math.PI) / 180; }
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function trackAddressChecked(payload) {
    payload = payload || {};
    // Privacy: never send the typed address (PII) to analytics — coarse fields only.
    if (payload.address_entered) delete payload.address_entered;
    // Google Analytics 4 / Google Tag Manager hook.
    if (typeof gtag === 'function') {
      gtag('event', 'address_checked', payload);
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: 'address_checked' }, payload));
  }

  var form = document.getElementById('addressCheckForm');
  var input = document.getElementById('addressInput');
  var resultBox = document.getElementById('addressResult');
  if (!form || !input || !resultBox) return;

  // Easter egg: a specific address gets its own joke response instead of
  // going through the geocoder — no need for it to be a real, findable place.
  var JOKE_ADDRESSES = [
    {
      match: '11224 highland',
      response:
        "11224 Highland Dr — we know that address well. That's Danny's place, a man who does the work of three men, and the trim work of about half of one. We love him, but we're keeping this one in-house."
    }
  ];

  function findJokeAddress(address) {
    var lower = address.toLowerCase();
    for (var i = 0; i < JOKE_ADDRESSES.length; i++) {
      if (lower.indexOf(JOKE_ADDRESSES[i].match) !== -1) return JOKE_ADDRESSES[i];
    }
    return null;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var address = input.value.trim();
    if (!address) return;

    var joke = findJokeAddress(address);
    if (joke) {
      resultBox.className = 'address-result address-result--no';
      resultBox.textContent = joke.response;
      trackAddressChecked({ address_entered: address, result: 'joke_easter_egg' });
      return;
    }

    resultBox.className = 'address-result address-result--loading';
    resultBox.textContent = 'Checking your address…';

    var url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' +
      encodeURIComponent(address);

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.length) {
          resultBox.className = 'address-result address-result--warn';
          resultBox.textContent = "We couldn't find that address — try adding the city and state.";
          trackAddressChecked({ address_entered: address, result: 'not_found' });
          return;
        }

        var lat = parseFloat(data[0].lat);
        var lon = parseFloat(data[0].lon);
        var distance = milesBetween(BASE_LAT, BASE_LNG, lat, lon);
        var covered = distance <= RADIUS_MILES;

        if (resultMarker) map.removeLayer(resultMarker);

        var icon = L.divIcon({
          className: covered ? 'service-pin service-pin--covered' : 'service-pin service-pin--out',
          html: '<span class="service-pin-dot"></span>',
          iconSize: [22, 22]
        });
        resultMarker = L.marker([lat, lon], { icon: icon }).addTo(map);
        map.setView([lat, lon], 9);

        var state = (data[0].address && data[0].address.state) || '';

        var STATE_JOKES = {
          Montana:
            'Montana, huh? That\'s about {d} miles from Channahon — also where my brother John lives, a man who once "fixed" a leaky faucet with duct tape and prayer. Sadly, we don\'t service Montana, and neither should he.',
          Hawaii:
            "Hawaii? That's about {d} miles from Channahon — and about how far our ladder would have to float to reach you. We don't service Hawaii, but we hear the home repair guys out there mostly just fix sunburns.",
          Alaska:
            "Alaska is about {d} miles from Channahon, which is a little far even for us — though we hear everything freezes solid enough up there that leaky faucets fix themselves for half the year.",
          California:
            "California's about {d} miles from Channahon — a bit outside our service area, and honestly our trucks aren't built for that kind of traffic anyway.",
          Florida:
            "Florida's about {d} miles away — outside our range, but between the humidity and the alligators, we're not sure our tools would survive down there anyway.",
          Texas:
            "Texas is about {d} miles from Channahon — everything really is bigger down there, including the drive it'd take us to reach you."
        };

        var stateJoke = STATE_JOKES[state]
          ? STATE_JOKES[state].replace('{d}', Math.round(distance))
          : null;

        if (covered) {
          resultBox.className = 'address-result address-result--yes';
          resultBox.innerHTML =
            '✓ Good news — you\'re in our service area! <a href="contact.html">Get a free quote →</a>';
        } else if (stateJoke) {
          resultBox.className = 'address-result address-result--no';
          resultBox.textContent = stateJoke;
        } else {
          resultBox.className = 'address-result address-result--no';
          resultBox.textContent =
            "That's " +
            Math.round(distance) +
            " miles away, which is outside our service area and, more importantly, outside our fleet's capabilities — we're all trucks and ladders, no aircraft. Feel free to change that.";
        }

        trackAddressChecked({
          address_entered: address,
          result: covered ? 'covered' : 'out_of_range',
          distance_miles: Math.round(distance)
        });
      })
      .catch(function () {
        resultBox.className = 'address-result address-result--warn';
        resultBox.textContent = 'Something went wrong checking that address — please try again or just give us a call.';
        trackAddressChecked({ address_entered: address, result: 'error' });
      });
  });
})();
