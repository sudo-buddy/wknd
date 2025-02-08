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
    console.log('loadAEMExperimentationApp called with simulation:', isSimulation);

    // For simulation, we want to force a complete reset
    if (isSimulation) {
        console.log('Simulation mode - forcing complete reset');
        
        // Remove existing script tag
        const existingScript = document.querySelector('script[src*="client.js"]');
        if (existingScript) {
            existingScript.remove();
        }

        // Remove existing container
        const existingContainer = document.getElementById('aemExperimentation');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Reset all states
        isAEMExperimentationAppLoaded = false;
        scriptLoadPromise = null;

        // Force a fresh load
        console.log('Creating fresh instance for simulation');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Add timestamp to prevent caching
            script.src = `https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin&t=${Date.now()}`;

            script.onload = function() {
                console.log('Script loaded for simulation');
                isAEMExperimentationAppLoaded = true;
                const waitForContainer = (retries = 0, maxRetries = 20) => {
                    const container = document.getElementById('aemExperimentation');
                    if (container) {
                        console.log('Container ready for simulation');
                        toggleExperimentPanel(true);
                        resolve();
                    } else if (retries < maxRetries) {
                        setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                    } else {
                        reject(new Error('Container creation timeout'));
                    }
                };
                waitForContainer();
            };

            script.onerror = (error) => {
                console.error('Script load error:', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    // Normal non-simulation flow
    if (scriptLoadPromise) {
        console.log('Using existing promise');
        return scriptLoadPromise;
    }

    console.log('Creating new panel instance');
    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

        script.onload = function() {
            isAEMExperimentationAppLoaded = true;
            const waitForContainer = (retries = 0, maxRetries = 20) => {
                const container = document.getElementById('aemExperimentation');
                if (container) {
                    console.log('Container ready');
                    toggleExperimentPanel(true);
                    resolve();
                } else if (retries < maxRetries) {
                    setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                } else {
                    reject(new Error('Container creation timeout'));
                }
            };
            waitForContainer();
        };

        script.onerror = reject;
        document.head.appendChild(script);
    });

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