(function () {
  let isAEMExperimentationAppLoaded = false;
  function loadAEMExperimentationApp() {
    const script = document.createElement('script');
    script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function () {
      isAEMExperimentationAppLoaded = true;
    };
    script.onerror = function () {
      console.error('Error loading AEMExperimentationApp.');
    };
    document.head.appendChild(script);
  }

  function handlePluginButtonClick() {
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp();
    }
  }

  const sidekick = document.querySelector('helix-sidekick');
  if (sidekick) {
    // sidekick already loaded
    sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      document.querySelector('helix-sidekick')
        .addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    }, { once: true });
  }
}());