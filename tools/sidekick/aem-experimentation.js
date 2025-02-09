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

  function checkIframeStatus(maxWaitTime = 5000) {
      return new Promise((resolve, reject) => {
          const startTime = Date.now();
          
          const checkFrame = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              
              if (!iframe) {
                  if (Date.now() - startTime < maxWaitTime) {
                      setTimeout(checkFrame, 100);
                  } else {
                      reject('iframe not found');
                  }
                  return;
              }

              try {
                  // If we can't access contentDocument, auth is likely missing
                  if (iframe.contentDocument === null || !iframe.contentWindow) {
                      console.log('[AEM Exp] Auth issue detected, refreshing...');
                      window.location.href = window.location.href;
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
              resolve();
          };

          script.onerror = reject;
          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');
      const hasRefreshed = sessionStorage.getItem('hasRefreshed');

      if (experimentParam && !hasRefreshed) {
          // First time with experiment param - set state and refresh
          sessionStorage.setItem('hasRefreshed', 'true');
          const [experimentId, variantId] = decodeURIComponent(experimentParam).split('/');
          
          if (experimentId) {
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };
              console.log('[AEM Exp] Setting initial state and refreshing:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');
              
              // Force a hard refresh
              window.location.href = window.location.href;
              return;
          }
      }

      if (experimentParam && !isHandlingSimulation) {
          isHandlingSimulation = true;
          loadAEMExperimentationApp()
              .then(() => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      container.classList.remove('aemExperimentationHidden');
                      return checkIframeStatus();
                  }
              })
              .catch((error) => {
                  console.error('[AEM Exp] Error:', error);
                  // Clear refresh flag and try again
                  sessionStorage.removeItem('hasRefreshed');
                  window.location.href = window.location.href;
              });
      }
  }

  function handleSidekickPluginButtonClick() {
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => {
                  toggleExperimentPanel(true);
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
      document.addEventListener('sidekick-ready', () => {
          const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
          if (sidekickElement) {
              sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
          }
      }, { once: true });
  }

  // Initialize immediately
  checkExperimentParams();
})();