(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

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

  function loadAEMExperimentationApp(isSimulation = false) {
    if (isSimulation) {
        // Remove everything to force a fresh start
        const existingScript = document.querySelector('script[src*="client.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        const existingContainer = document.getElementById('aemExperimentation');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Reset all states to mimic first load
        isAEMExperimentationAppLoaded = false;
        scriptLoadPromise = null;
    }

    // Now let it follow the exact same path as first click
    if (!isAEMExperimentationAppLoaded) {
        scriptLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
            script.onload = function() {
                isAEMExperimentationAppLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    return scriptLoadPromise;
}
  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');

      if (experimentParam && !isHandlingSimulation) {
          const decodedParam = decodeURIComponent(experimentParam);
          const [experimentId, variantId] = decodedParam.split('/');
          
          if (experimentId) {
              isHandlingSimulation = true;
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };

              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Always create fresh instance for simulation
              loadAEMExperimentationApp(true)
                  .catch((error) => {
                      console.error('[AEM Exp] Error loading app:', error);
                  });
          }
      }
  }

  function handleSidekickPluginButtonClick() {
    const panel = document.getElementById('aemExperimentation');

    if (!isAEMExperimentationAppLoaded) {
        loadAEMExperimentationApp()
            .then(() => {
                if (panel) {
                    console.log('[AEM Exp] First load - showing panel');
                    toggleExperimentPanel(true); 
                }
            })
            .catch(error => {
                console.error('[AEM Exp] Failed to load:', error);
            });
    } else {
        toggleExperimentPanel(false);
    }
  }

  // Initialize Sidekick
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

  // Check for experiment parameters on load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }
})();