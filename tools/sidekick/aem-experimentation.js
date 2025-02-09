(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function checkAndRefresh() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');
      const hasRefreshed = sessionStorage.getItem('hasRefreshed');

      if (experimentParam && !hasRefreshed) {
          console.log('[AEM Exp] First load with experiment param, refreshing page');
          sessionStorage.setItem('hasRefreshed', 'true');
          window.location.reload();
          return true;
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
      if (checkAndRefresh()) {
          return; // Skip the rest if we're refreshing
      }

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

              // Find and click the button directly
              const findAndClickButton = (retries = 0, maxRetries = 10) => {
                  const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
                  const button = sidekick?.shadowRoot?.querySelector('button[data-plugin="aem-experimentation-sidekick"]');
                  
                  if (button) {
                      console.log('[AEM Exp] Found button, clicking');
                      button.click();
                  } else if (retries < maxRetries) {
                      console.log('[AEM Exp] Button not found, retrying...', retries);
                      setTimeout(() => findAndClickButton(retries + 1, maxRetries), 500);
                  } else {
                      console.error('[AEM Exp] Failed to find button after max retries');
                      // If button click fails, try refreshing again
                      sessionStorage.removeItem('hasRefreshed');
                      window.location.reload();
                  }
              };

              findAndClickButton();
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
                  // If loading fails, try refreshing
                  sessionStorage.removeItem('hasRefreshed');
                  window.location.reload();
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