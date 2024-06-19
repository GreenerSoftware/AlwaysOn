window.addEventListener('load', (_event) => {
  document.body.className = document.body.className ? document.body.className + ' js-enabled' : 'js-enabled';

  if (window.GOVUKFrontend) {
    window.GOVUKFrontend.initAll();
  }
});
