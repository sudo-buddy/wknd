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

  function handlePluginButtonClick(event) {
    console.log('handlePluginButtonClick called', event);
    if (!isAEMExperimentationAppLoaded) {
      console.log('Loading AEM Experimentation App');
      loadAEMExperimentationApp();
    }
  }

  const sidekick = document.querySelector('aem-sidekick');
  if (sidekick) {
    console.log('sidekick already loaded');
    
    // Listen for ALL events to debug
    sidekick.addEventListener('*', (e) => {
        console.log('Any event received:', e.type);
    });

    // Our specific listener
    sidekick.addEventListener('aem-experimentation-sidekick', (e) => {
        console.log('Event received:', e);
        handlePluginButtonClick(e);
    });

    // Test dispatch - remove this after debugging
    console.log('Testing manual event dispatch');
    setTimeout(() => {
        const testEvent = new CustomEvent('aem-experimentation-sidekick', {
            bubbles: true,
            composed: true
        });
        console.log('Dispatching test event');
        sidekick.dispatchEvent(testEvent);
    }, 2000);

    console.log('sidekick event listener added');
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      console.log('sidekick-ready');
      document.querySelector('aem-sidekick')
        .addEventListener('aem-experimentation-sidekick', handlePluginButtonClick);
    }, { once: true });
  }
}());