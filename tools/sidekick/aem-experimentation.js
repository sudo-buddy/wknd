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

  function loadAEMExperimentationApp() {
    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise((resolve, reject) => {
        if (isAEMExperimentationAppLoaded) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

        script.onload = function () {
            isAEMExperimentationAppLoaded = true;
            
            // Wait for iframe to fully load
            const waitForIframeLoad = (retries = 0, maxRetries = 50) => {
                const container = document.getElementById('aemExperimentation');
                const iframe = container?.querySelector('#aemExperimentationIFrameContent');
                
                if (container && iframe) {
                    console.log('[AEM Exp] Found iframe, waiting for load');
                    
                    // Add load listener to iframe
                    iframe.addEventListener('load', () => {
                        console.log('[AEM Exp] Iframe loaded');
                        toggleExperimentPanel(true);
                        resolve();
                    });

                    // Add error listener
                    iframe.addEventListener('error', (error) => {
                        console.error('[AEM Exp] Iframe load error:', error);
                        reject(error);
                    });
                } else if (retries < maxRetries) {
                    console.log('[AEM Exp] Waiting for iframe creation...', retries);
                    setTimeout(() => waitForIframeLoad(retries + 1, maxRetries), 200);
                } else {
                    console.error('[AEM Exp] Max retries reached waiting for iframe');
                    reject(new Error('Timeout waiting for iframe'));
                }
            };
            
            waitForIframeLoad();
        };

        script.onerror = (error) => {
            console.error('[AEM Exp] Script load error:', error);
            reject(error);
        };
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
              // Set simulation state
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };
              console.log('[AEM Exp] Setting simulation state:', simulationState);

              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Load app and force show
              loadAEMExperimentationApp()
                  .then(() => {
                      const panel = document.getElementById('aemExperimentation');
                      if (panel) {
                          panel.classList.remove('aemExperimentationHidden');
                      }
                  })
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