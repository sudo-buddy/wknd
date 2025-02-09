(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function refreshParentWindow() {
      console.log('[AEM Exp] Refreshing parent window');
      if (window.parent && window.parent !== window) {
          window.parent.location.reload();
      } else {
          window.location.reload();
      }
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
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              
              if (!iframe) {
                  if (Date.now() - startTime < maxWaitTime) {
                      setTimeout(checkFrame, 100);
                  } else {
                      refreshParentWindow();
                      reject('iframe not found');
                  }
                  return;
              }

              try {
                  if (iframe.contentDocument === null || !iframe.contentWindow) {
                      console.log('[AEM Exp] Auth issue detected');
                      refreshParentWindow();
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
                              console.log('[AEM Exp] Container ready but iframe/auth issue detected');
                              refreshParentWindow();
                          });
                  } else if (retries < maxRetries) {
                      setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                  } else {
                      refreshParentWindow();
                  }
              };
              
              waitForContainer();
          };

          script.onerror = () => {
              refreshParentWindow();
              reject(new Error('Script load failed'));
          };
          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');
      const lastExperiment = sessionStorage.getItem('lastExperimentParam');

      if (experimentParam && lastExperiment && experimentParam !== lastExperiment) {
          console.log('[AEM Exp] Experiment changed, refreshing parent');
          sessionStorage.setItem('lastExperimentParam', experimentParam);
          refreshParentWindow();
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
                      refreshParentWindow();
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

  checkExperimentParams();
})();