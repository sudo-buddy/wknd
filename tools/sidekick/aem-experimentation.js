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
          const checkAuth = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              if (iframe?.contentWindow?.location?.href?.includes('experience-qa.adobe.com')) {
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
          script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet';
          
          script.onload = function () {
              console.log('[AEM Exp] Script loaded');
              isAEMExperimentationAppLoaded = true;
              // Wait for container to be created
              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      toggleExperimentPanel(true);
                      resolve();
                  } else if (retries < maxRetries) {
                      setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                  } else {
                      reject(new Error('Container not found after max retries'));
                  }
              };
              waitForContainer();
          };

          script.onerror = (error) => {
              console.error('[AEM Exp] Script load error:', error);
              reject(error);
          };
          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  async function handleExperimentInitiation(experimentId, variantId = 'control') {
      console.log('[AEM Exp] Initiating experiment:', { experimentId, variantId });
      
      // Set simulation state
      const simulationState = {
          isSimulation: true,
          source: 'plugin',
          experimentId,
          variantId
      };
      sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
      
      try {
          // Load the app
          await loadAEMExperimentationApp();
          console.log('[AEM Exp] App loaded, waiting for auth');
          
          // Wait for auth to complete
          await waitForAuth();
          console.log('[AEM Exp] Auth complete, showing panel');
          
          // Show the panel
          toggleExperimentPanel(true);
      } catch (error) {
          console.error('[AEM Exp] Error during experiment initiation:', error);
      }
  }

  // Handle both button clicks and URL parameters
  function initialize() {
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');

      if (experimentParam) {
          const [experimentId, variantId] = decodeURIComponent(experimentParam).split('/');
          if (experimentId) {
              handleExperimentInitiation(experimentId, variantId);
              return;
          }
      }

      // Set up sidekick button handler
      const setupSidekickListener = (sidekick) => {
          sidekick.addEventListener('custom:aem-experimentation-sidekick', () => {
              handleExperimentInitiation('default');
          });
      };

      // Initialize Sidekick
      const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
      if (sidekick) {
          setupSidekickListener(sidekick);
      } else {
          document.addEventListener('sidekick-ready', () => {
              const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekickElement) {
                  setupSidekickListener(sidekickElement);
              }
          }, { once: true });
      }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
  } else {
      initialize();
  }
})();