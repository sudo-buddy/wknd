(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function shouldRefreshForExperiment() {
      const currentExperiment = new URLSearchParams(window.location.search).get('experiment');
      const lastExperiment = sessionStorage.getItem('lastExperimentParam');
      const currentSimState = sessionStorage.getItem('simulationState');

      // Force refresh if:
      // 1. Experiment param changed
      // 2. Have experiment param but no simulation state
      // 3. Have experiment param but no last experiment record
      if (currentExperiment && (
          (lastExperiment && currentExperiment !== lastExperiment) ||
          !currentSimState ||
          !lastExperiment
      )) {
          console.log('[AEM Exp] Need refresh:', {
              current: currentExperiment,
              last: lastExperiment,
              hasSimState: !!currentSimState
          });
          sessionStorage.setItem('lastExperimentParam', currentExperiment);
          return true;
      }

      if (currentExperiment) {
          sessionStorage.setItem('lastExperimentParam', currentExperiment);
      }
      
      return false;
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

  function checkIframeStatus(maxWaitTime = 5000) {
      return new Promise((resolve, reject) => {
          const startTime = Date.now();
          
          const checkFrame = () => {
              const container = document.getElementById('aemExperimentation');
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              
              if (container) {
                  container.classList.remove('aemExperimentationHidden');
              }

              if (!iframe) {
                  if (Date.now() - startTime < maxWaitTime) {
                      setTimeout(checkFrame, 100);
                  } else {
                      reject('iframe not found');
                  }
                  return;
              }

              try {
                  if (iframe.contentDocument === null) {
                      console.log('[AEM Exp] Auth issue detected, refreshing...');
                      window.location.reload();
                      return;
                  }
                  resolve();
              } catch (e) {
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
                      
                      checkIframeStatus()
                          .then(resolve)
                          .catch(() => {
                              console.log('[AEM Exp] Container ready but iframe issue detected');
                              window.location.reload();
                          });
                  } else if (retries < maxRetries) {
                      setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                  } else {
                      resolve();
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
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }
})();