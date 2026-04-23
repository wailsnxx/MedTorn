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
    var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

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
