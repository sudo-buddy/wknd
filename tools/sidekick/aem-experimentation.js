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
      const hasInitialized = sessionStorage.getItem('experimentInitialized');

      if (experimentParam && !hasInitialized) {
          // First time seeing the experiment parameter - set state and refresh
          const [experimentId, variantId] = decodeURIComponent(experimentParam).split('/');
          
          if (experimentId) {
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };
              console.log('[AEM Exp] Setting simulation state and refreshing:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('experimentInitialized', 'true');
              window.location.reload();
              return;
          }
      }

      // After refresh or if already initialized, proceed with normal flow
      if (experimentParam && !isHandlingSimulation) {
          isHandlingSimulation = true;
          const findAndClickButton = (retries = 0, maxRetries = 10) => {
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              const button = sidekick?.shadowRoot?.querySelector('button[data-plugin="aem-experimentation-sidekick"]');
              
              if (button) {
                  console.log('[AEM Exp] Found button, clicking');
                  button.click();
              } else if (retries < maxRetries) {
                  console.log('[AEM Exp] Button not found, retrying...', retries);
                  setTimeout(() => findAndClickButton(retries + 1, maxRetries), 500);
              }
          };

          findAndClickButton();
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