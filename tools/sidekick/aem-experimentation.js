(function () {
  console.log('Script starting...');

  // Store the working code as a string to inject later
  const workingCode = `
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
        sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
      }
    }())`;

  // Function to inject the working code
  function injectWorkingCode() {
    console.log('Injecting working code...');
    const script = document.createElement('script');
    script.textContent = workingCode;
    document.head.appendChild(script);
  }

  // Try multiple initialization points
  if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', injectWorkingCode);
  } else {
    console.log('Document already loaded, injecting now');
    injectWorkingCode();
  }

  // Also try on load
  window.addEventListener('load', () => {
    console.log('Window load event fired');
    injectWorkingCode();
  });

  // And when sidekick is ready
  document.addEventListener('sidekick-ready', () => {
    console.log('Sidekick ready event fired');
    injectWorkingCode();
  });
}());
