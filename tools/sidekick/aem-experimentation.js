(function () {
  let isAEMExperimentationAppLoaded = false;
  function loadAEMExperimentationApp() {
    const script = document.createElement('script');
    script.src = 'https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function () {
      isAEMExperimentationAppLoaded = true;
      handlePluginButtonClick();
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
      return;
    }
    
    // Dispatch the event that client.js is listening for
    const event = new CustomEvent('custom:aem-experimentation-sidekick');
    const sidekick = document.querySelector('aem-sidekick') || document.querySelector('helix-sidekick');
    if (sidekick) {
        sidekick.dispatchEvent(event);
    }
  }

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
    // sidekick already loaded
    sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      document.querySelector('aem-sidekick')
        .addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    }, { once: true });
  }
}());