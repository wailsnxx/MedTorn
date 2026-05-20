// auth-guard.js — Inclòs a TOTES les pàgines protegides (index.html, medic.html)
// Ha d'anar com a PRIMER script a la pàgina per bloquejar el render si no hi ha sessió
(function () {
  'use strict';

  var token = localStorage.getItem('medtorn_token');
  if (!token) {
    window.location.replace('/login.html');
    return;
  }

  try {
    // Decode del payload JWT (sense verificar signatura — la verificació és al servidor)
    var parts = token.split('.');
    if (parts.length !== 3) throw new Error('token malformat');
    var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    var pad = (4 - base64.length % 4) % 4;
    if (pad > 0) base64 += "===".substring(0, pad);
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    var payload = JSON.parse(jsonPayload);

    // Comprovar expiració
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      localStorage.removeItem('medtorn_token');
      window.location.replace('/login.html');
      return;
    }

    // Exposar globalment per a la resta de scripts de la pàgina
    window.AUTH = payload; // { id, nom, rol, metge_id }

    // Redirigir al portal correcte si el rol no coincideix amb la pàgina actual
    var path = window.location.pathname;
    var isMetgePage = path.includes('medic.html');
    if (isMetgePage && payload.rol !== 'METGE') {
      window.location.replace('/index.html');
      return;
    }
    if (!isMetgePage && payload.rol !== 'CAP_TORN') {
      window.location.replace('/medic.html');
      return;
    }
  } catch (e) {
    localStorage.removeItem('medtorn_token');
    window.location.replace('/login.html');
  }
}());
