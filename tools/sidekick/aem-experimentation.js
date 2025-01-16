(function () {
  let isAEMExperimentationAppLoaded = false;

  function loadAEMExperimentationApp() {
    console.log('Loading AEM Experimentation App');
    const script = document.createElement('script');
    script.src = 'https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function() {
      console.log('AEM Experimentation App loaded');
      isAEMExperimentationAppLoaded = true;
    };
    document.head.appendChild(script);
  }

  function handlePluginButtonClick(event) {
    console.log('Handle plugin button click', event);
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp();
    }
  }

  // Wait for everything to be fully loaded
  function init() {
    console.log('Initializing AEM Experimentation');
    const sidekick = document.querySelector('aem-sidekick');
    if (sidekick && sidekick.shadowRoot) {
      console.log('Sidekick found and ready, adding listener');
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    } else {
      console.log('Sidekick not ready, retrying...');
      setTimeout(init, 500); // retry after 500ms
    }
  }

  // Try multiple initialization points
  // 1. When DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 2. When window is fully loaded
  window.addEventListener('load', init);

  // 3. When sidekick signals it's ready
  document.addEventListener('sidekick-ready', init);
}());
