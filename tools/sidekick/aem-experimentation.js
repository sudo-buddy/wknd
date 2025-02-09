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

  function handleSidekickPluginButtonClick() {
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => {
                  const panel = document.getElementById('aemExperimentation');
                  if (panel) {
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
              
              // Just trigger a click on the button
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekick) {
                  sidekick.dispatchEvent(new CustomEvent('custom:aem-experimentation-sidekick'));
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