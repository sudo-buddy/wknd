(function () {
  let isAEMExperimentationAppLoaded = false;
  function loadAEMExperimentationApp() {
    const script = document.createElement('script');
    script.src = 'https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function () {
      isAEMExperimentationAppLoaded = true;
    };
    script.onerror = function () {
      console.error('Error loading Experimentation.');
    };
    document.head.appendChild(script);
  }
 
  function handlePluginButtonClick() {
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp();
    }
  }
 
  // The code snippet for the Sidekick V1 extension, https://chromewebstore.google.com/detail/aem-sidekick/ccfggkjabjahcjoljmgmklhpaccedipo?hl=en
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
 
  // The code snippet for the Sidekick V2 extension, https://chromewebstore.google.com/detail/aem-sidekick/igkmdomcgoebiipaifhmpfjhbjccggml?hl=en
  const sidekickV2 = document.querySelector('aem-sidekick');
  if (sidekickV2) {
    // sidekick already loaded
    sidekickV2.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      document.querySelector('aem-sidekick')
        .addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    }, { once: true });
  }
}());
