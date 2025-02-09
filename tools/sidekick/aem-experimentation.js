(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function forceRefresh() {
      console.log('[AEM Exp] Force refreshing page');
      // Clear all states
      isHandlingSimulation = false;
      isAEMExperimentationAppLoaded = false;
      scriptLoadPromise = null;
      sessionStorage.removeItem('experimentInitialized');
      // Force a hard refresh
      window.location.href = window.location.href;
  }

  function checkIframeStatus(maxWaitTime = 5000) {
      return new Promise((resolve, reject) => {
          const startTime = Date.now();
          
          const checkFrame = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              
              if (!iframe) {
                  if (Date.now() - startTime < maxWaitTime) {
                      setTimeout(checkFrame, 100);
                  } else {
                      forceRefresh();
                      reject('iframe not found');
                  }
                  return;
              }

              try {
                  // If we can't access contentDocument, auth is likely missing
                  if (iframe.contentDocument === null || !iframe.contentWindow) {
                      forceRefresh();
                      return;
                  }
                  resolve();
              } catch (e) {
                  // Cross-origin error means iframe loaded
                  resolve();
              }
          };

          checkFrame();
      });
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
              
              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      container.classList.remove('aemExperimentationHidden');
                      
                      // Check iframe status immediately
                      checkIframeStatus()
                          .then(resolve)
                          .catch(() => {
                              console.log('[AEM Exp] Container ready but iframe/auth issue detected');
                              forceRefresh();
                          });
                  } else if (retries < maxRetries) {
                      setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                  } else {
                      forceRefresh();
                  }
              };
              
              waitForContainer();
          };

          script.onerror = () => {
              forceRefresh();
              reject(new Error('Script load failed'));
          };
          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');

      // Always check for refresh first
      if (shouldRefreshForExperiment()) {
          console.log('[AEM Exp] Triggering refresh');
          // Clear any existing state before refresh
          isHandlingSimulation = false;
          isAEMExperimentationAppLoaded = false;
          scriptLoadPromise = null;
          window.location.reload();
          return;
      }

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
              console.log('[AEM Exp] Setting simulation state:', simulationState);

              // Set all states at once
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');
              sessionStorage.setItem('lastExperimentParam', experimentParam);

              loadAEMExperimentationApp()
                  .then(() => {
                      const container = document.getElementById('aemExperimentation');
                      if (container) {
                          container.classList.remove('aemExperimentationHidden');
                      }
                  })
                  .catch((error) => {
                      console.error('[AEM Exp] Error loading app:', error);
                      // If loading fails, try refreshing
                      window.location.reload();
                  });
          }
      }
  }

  function handleSidekickPluginButtonClick() {
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
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
      document.addEventListener('sidekick-ready', () => {
          const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
          if (sidekickElement) {
              sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
          }
      }, { once: true });
  }

  // Check for experiment parameters on load
  // if (document.readyState === 'loading') {
  //     document.addEventListener('DOMContentLoaded', checkExperimentParams);
  // } else {
  //     checkExperimentParams();
  // }
  checkExperimentParams();
})();