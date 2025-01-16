(function () {
  let isAEMExperimentationAppLoaded = false;
  function loadAEMExperimentationApp() {
    console.log('loadAEMExperimentationApp');
    const script = document.createElement('script');
    script.src = 'https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function () {
      isAEMExperimentationAppLoaded = true;
    };
    script.onerror = function () {
      console.error('Error loading AEMExperimentationApp.');
    };
    document.head.appendChild(script);
  }

  function handlePluginButtonClick() {
    console.log('handlePluginButtonClick');
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp();
    }
  }

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
    console.log('sidekick already loaded');
    // sidekick already loaded
    sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      console.log('sidekick-ready');
      document.querySelector('aem-sidekick')
        .addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    }, { once: true });
  }
}());