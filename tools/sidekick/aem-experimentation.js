(function () {
  let isAEMExperimentationAppLoaded = false;
  
  function loadAEMExperimentationApp() {
      const script = document.createElement('script');
      script.src = 'https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
      script.onload = function () {
          isAEMExperimentationAppLoaded = true;
          // Trigger initial show
          const event = new CustomEvent('custom:aem-experimentation-sidekick');
          document.querySelector('aem-sidekick').dispatchEvent(event);
      };
      script.onerror = function () {
          console.error('Error loading AEMExperimentationApp.');
          isAEMExperimentationAppLoaded = false;
      };
      document.head.appendChild(script);
  }

  function handlePluginButtonClick() {
      console.log('handlePluginButtonClick');
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp();
      } else {
          // For subsequent clicks, dispatch event to toggle visibility
          const event = new CustomEvent('custom:aem-experimentation-sidekick');
          document.querySelector('aem-sidekick').dispatchEvent(event);
      }
  }

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
      document.addEventListener('sidekick-ready', () => {
          document.querySelector('aem-sidekick')
              .addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
      }, { once: true });
  }
}());