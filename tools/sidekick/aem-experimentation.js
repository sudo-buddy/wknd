(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;

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

  function waitForAuth() {
      console.log('[AEM Exp] Starting auth check');
      return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds total

          const checkAuth = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              attempts++;

              try {
                  // First check if iframe exists
                  if (!iframe) {
                      if (attempts < maxAttempts) {
                          setTimeout(checkAuth, 100);
                      }
                      return;
                  }

                  // Then check if we can access the contentWindow
                  if (!iframe.contentWindow) {
                      if (attempts < maxAttempts) {
                          setTimeout(checkAuth, 100);
                      }
                      return;
                  }

                  // Finally check the location
                  const iframeLocation = iframe.contentWindow.location.href;
                  if (iframeLocation.includes('experience-qa.adobe.com')) {
                      console.log('[AEM Exp] Auth ready');
                      resolve();
                  } else if (attempts < maxAttempts) {
                      setTimeout(checkAuth, 100);
                  }
              } catch (e) {
                  // If we get a cross-origin error, keep waiting
                  if (attempts < maxAttempts) {
                      setTimeout(checkAuth, 100);
                  }
              }
          };
          
          // Start checking
          checkAuth();
      });
  }

  function loadAEMExperimentationApp() {
      console.log('[AEM Exp] Starting app load');
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
              console.log('[AEM Exp] Script loaded');
              isAEMExperimentationAppLoaded = true;
              resolve();
          };

          script.onerror = (error) => {
              console.error('[AEM Exp] Script load error:', error);
              reject(error);
          };
          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  function handleSidekickPluginButtonClick() {
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => waitForAuth())
              .then(() => {
                  const panel = document.getElementById('aemExperimentation');
                  if (panel) {
                      console.log('[AEM Exp] First load - showing panel');
                      toggleExperimentPanel(true);
                  }
              })
              .catch(error => {
                  console.error('[AEM Exp] Failed to load:', error);
              });
      } else {
          toggleExperimentPanel();
      }
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');

      if (experimentParam) {
          const [experimentId, variantId] = decodeURIComponent(experimentParam).split('/');
          if (experimentId) {
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId,
                  variantId: variantId || 'control'
              };
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              
              // Trigger the same flow as clicking the button
              handleSidekickPluginButtonClick();
          }
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