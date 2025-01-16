(function () {
  console.log('Setting up debug listeners');

  // Global event listener to catch ALL events
  document.addEventListener('click', (e) => {
    console.log('Click event:', e.target);
    // Check if click is related to sidekick
    const sidekickElement = e.target.closest('aem-sidekick');
    if (sidekickElement) {
      console.log('Sidekick-related click detected');
    }
  }, true); // Use capture phase to ensure we catch it

  // Listen for the specific event globally
  document.addEventListener('aem-experimentation-sidekick', (e) => {
    console.log('Experimentation event caught at document level:', e);
  }, true);

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

  function handlePluginButtonClick(event) {
    console.log('handlePluginButtonClick called', event);
    if (!isAEMExperimentationAppLoaded) {
      console.log('Loading AEM Experimentation App');
      loadAEMExperimentationApp();
    }
  }

  // Initial load of the script
  loadAEMExperimentationApp();

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
    console.log('Sidekick found, adding listeners');
    
    // Listen for ALL events on sidekick
    sidekick.addEventListener('*', (e) => {
      console.log('Sidekick event:', e.type);
    }, true);

    // Original listener
    sidekick.addEventListener('aem-experimentation-sidekick', (e) => {
      console.log('Experimentation event caught:', e);
      handlePluginButtonClick(e);
    });

    // Try listening on the shadow root if it exists
    if (sidekick.shadowRoot) {
      console.log('Shadow root found, adding listener there');
      sidekick.shadowRoot.addEventListener('aem-experimentation-sidekick', (e) => {
        console.log('Event caught in shadow root:', e);
      }, true);
    }
  }
}());
