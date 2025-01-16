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

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
    console.log('Sidekick found, adding listener');
    // Listen for the event WITH the custom: prefix
    sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
    document.addEventListener('sidekick-ready', () => {
      const sk = document.querySelector('aem-sidekick');
      sk.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
    });
  }
}());
