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
      console.log('[AEM Exp] Button clicked');
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
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
              console.log('[AEM Exp] Setting simulation state:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              
              // Find the button and click it directly
              const button = document.querySelector('helix-sidekick, aem-sidekick')
                  ?.shadowRoot?.querySelector('button[data-plugin="aem-experimentation-sidekick"]');
              
              if (button) {
                  console.log('[AEM Exp] Found button, triggering click');
                  button.click();
              } else {
                  console.log('[AEM Exp] Button not found, waiting for sidekick');
                  document.addEventListener('sidekick-ready', () => {
                      const newButton = document.querySelector('helix-sidekick, aem-sidekick')
                          ?.shadowRoot?.querySelector('button[data-plugin="aem-experimentation-sidekick"]');
                      if (newButton) {
                          console.log('[AEM Exp] Found button after wait, triggering click');
                          newButton.click();
                      }
                  }, { once: true });
              }
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