(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  // Force creation (or refresh) of the experiment panel and its iframe.
  function createExperimentPanel() {
    let container = document.getElementById('aemExperimentation');
    if (!container) {
      container = document.createElement('div');
      container.id = 'aemExperimentation';
      document.body.appendChild(container);
    }
    // Remove any existing iframe so we force a reload.
    const oldIframe = document.getElementById('aemExperimentationIFrameContent');
    if (oldIframe) {
      oldIframe.remove();
    }

    // Create a new iframe with a timestamp to bypass any caching.
    const iframe = document.createElement('iframe');
    iframe.id = 'aemExperimentationIFrameContent';
    iframe.src =
      'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick.html?env=qa&pageUrl=' +
      encodeURIComponent(window.location.href) +
      '&source=plugin&t=' +
      new Date().getTime();
    container.appendChild(iframe);
    return container;
  }

  function toggleExperimentPanel(forceShow = false) {
    const container = document.getElementById('aemExperimentation');
    if (container) {
      if (forceShow) {
        container.classList.remove('aemExperimentationHidden');
      } else {
        container.classList.toggle('aemExperimentationHidden');
      }
    }
  }

  // Keep checking until the iframe's URL indicates that authentication is ready.
  function waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        const iframe = document.getElementById('aemExperimentationIFrameContent');
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
      };
      checkAuth();
    });
  }

  // Load the experimentation app. In simulation mode we force a refresh by re-creating the panel.
  function loadAEMExperimentationApp(isSimulation = false) {
    if (isSimulation && !isHandlingSimulation) {
      console.log('[AEM Exp] Starting simulation');
      isHandlingSimulation = true;
      // Instead of just triggering the sidekick click, re-create the experiment panel to refresh the iframe.
      createExperimentPanel();
      return waitForAuth().then(() => {
        const container = document.getElementById('aemExperimentation');
        if (container) {
          container.classList.remove('aemExperimentationHidden');
          console.log('[AEM Exp] Container shown after auth ready');
        }
        isHandlingSimulation = false;
      });
    }

    // Original first-load logic (loads client.js only once).
    if (!isAEMExperimentationAppLoaded) {
      scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src =
          'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
        script.onload = function () {
          isAEMExperimentationAppLoaded = true;
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return scriptLoadPromise;
  }

  // When a manual sidekick click is detected, also re-creates the panel.
  function handleSidekickPluginButtonClick() {
    createExperimentPanel();
    if (!isAEMExperimentationAppLoaded) {
      loadAEMExperimentationApp()
        .then(() => {
          console.log('[AEM Exp] First load - showing panel');
          toggleExperimentPanel(true);
        })
        .catch((error) => {
          console.error('[AEM Exp] Failed to load:', error);
        });
    } else {
      toggleExperimentPanel(false);
    }
  }

  // Listen for the sidekick event.
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

  // This function checks for a URL parameter (e.g., ?simulate) and triggers simulation mode.
  function checkExperimentParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('simulate')) {
      loadAEMExperimentationApp(true)
        .then(() => {
          console.log('[AEM Exp] Simulation branch completed.');
        })
        .catch((err) => {
          console.error('[AEM Exp] Simulation branch error:', err);
        });
    }
  }

  // Kick off the experiment params check on page load.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
    checkExperimentParams();
  }
})();