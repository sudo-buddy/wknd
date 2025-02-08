(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;
  let simulationActive = false; // prevents duplicate simulation runs

  // Returns the full URL for the experimentation iframe.
  function getAEMExperimentationUrl() {
    // Here we hardcode 'qa' for simulation. You might later pick the env from your client.js logic.
    return (
      'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick.html?env=qa' +
      '&pageUrl=' +
      encodeURIComponent(window.location.href) +
      '&source=plugin'
    );
  }

  // Removes any existing iframe and creates a fresh one
  function createExperimentPanel() {
    let container = document.getElementById('aemExperimentation');
    if (!container) {
      container = document.createElement('div');
      container.id = 'aemExperimentation';
      // Start hidden; CSS class 'aemExperimentationHidden' controls display.
      container.classList.add('aemExperimentationHidden');
      document.body.appendChild(container);
    }
    // Remove any previous iframe to force a fresh load.
    const existingIframe = document.getElementById('aemExperimentationIFrameContent');
    if (existingIframe) {
      existingIframe.parentElement.removeChild(existingIframe);
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'aemExperimentationIFrameContent';
    // Append a timestamp to bypass any caching
    iframe.src = getAEMExperimentationUrl() + '&t=' + Date.now();
    container.appendChild(iframe);
    return container;
  }

  // Simple toggle of the panel's hidden class.
  function toggleExperimentPanel(forceShow = false) {
    const container = document.getElementById('aemExperimentation');
    if (!container) return;
    if (forceShow) {
      container.classList.remove('aemExperimentationHidden');
    } else {
      container.classList.toggle('aemExperimentationHidden');
    }
  }

  // Poll every 100ms until the iframe's URL shows that the expected auth page is loaded.
  function waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        const iframe = document.getElementById('aemExperimentationIFrameContent');
        try {
          // IMPORTANT: This works only if the remote page allows accessing location.href.
          if (
            iframe &&
            iframe.contentWindow &&
            iframe.contentWindow.location &&
            iframe.contentWindow.location.href &&
            iframe.contentWindow.location.href.includes('experience-qa.adobe.com')
          ) {
            console.log('[AEM Exp] Auth ready');
            resolve();
          } else {
            console.log('[AEM Exp] Waiting for auth...');
            setTimeout(checkAuth, 100);
          }
        } catch (e) {
          // If cross-domain security prevents access, assume auth is ready after a delay.
          console.log('[AEM Exp] Possibly cross-domain, assuming auth ready after delay');
          setTimeout(resolve, 1000);
        }
      };
      checkAuth();
    });
  }

  // Loads the Sidekick client script if not already loaded.
  function loadAEMExperimentationApp() {
    if (!isAEMExperimentationAppLoaded) {
      scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src =
          'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
        script.onload = function () {
          isAEMExperimentationAppLoaded = true;
          console.log('[AEM Exp] Sidekick client.js loaded');
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
      return scriptLoadPromise;
    }
    return Promise.resolve();
  }

  // The simulation branch: triggered when the URL has a “simulate” parameter.
  // This branch forces a fresh panel/iframe load and then waits until the auth state is reached.
  function handleSimulation() {
    if (simulationActive || isHandlingSimulation) {
      return;
    }
    console.log('[AEM Exp] Starting simulation mode (auto open and refresh)');
    isHandlingSimulation = true;
    simulationActive = true;
    createExperimentPanel();
    waitForAuth()
      .then(() => {
        toggleExperimentPanel(true); // show the panel when auth is complete
        console.log('[AEM Exp] Simulation auth completed, panel shown.');
        isHandlingSimulation = false;
      })
      .catch((err) => {
        console.error('[AEM Exp] Error waiting for auth in simulation:', err);
        isHandlingSimulation = false;
      });
  }

  // Manual sidekick click handler.
  // This is used when no simulation param is present.
  function handleSidekickPluginButtonClick() {
    if (simulationActive) {
      console.log('[AEM Exp] Simulation mode active, ignoring manual click.');
      return;
    }
    createExperimentPanel();
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp()
        .then(() => {
          console.log('[AEM Exp] First manual load – showing panel');
          toggleExperimentPanel(true);
        })
        .catch((error) => {
          console.error('[AEM Exp] Failed to load sidekick client on manual click:', error);
        });
    } else {
      toggleExperimentPanel(true);
      console.log('[AEM Exp] Toggled panel on manual click.');
    }
  }

  // Check the URL for a "simulate" parameter.
  function checkExperimentParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('simulate')) {
      handleSimulation();
    }
  }

  // Listen for manual sidekick events (if any).
  function setupSidekickListener() {
    const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
    if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
    } else {
      document.addEventListener(
        'sidekick-ready',
        () => {
          const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
          if (sidekickElement) {
            sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
          }
        },
        { once: true }
      );
    }
  }

  // Initialization: on page load, check for simulation & set up sidekick event listeners.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkExperimentParams();
      setupSidekickListener();
    });
  } else {
    checkExperimentParams();
    setupSidekickListener();
  }
})();