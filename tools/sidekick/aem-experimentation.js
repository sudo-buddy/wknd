(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function toggleExperimentPanel(forceShow = false) {
    const container = document.getElementById('aemExperimentation');
    if (container) {
      console.log('[AEM Exp] Panel action:', forceShow ? 'showing' : 'toggling');
      if (forceShow) {
        container.classList.remove('aemExperimentationHidden');
      } else {
        // Explicitly check current state and toggle
        const isCurrentlyHidden = container.classList.contains('aemExperimentationHidden');
        if (isCurrentlyHidden) {
          container.classList.remove('aemExperimentationHidden');
        } else {
          container.classList.add('aemExperimentationHidden');
        }
      }
      console.log('[AEM Exp] Panel visibility:', {
        isHidden: container.classList.contains('aemExperimentationHidden'),
        classList: container.classList.toString()
      });
    }
  }

  function loadAEMExperimentationApp() {
      if (scriptLoadPromise) {
          return scriptLoadPromise;
      }

      console.log('[AEM Exp] Starting to load AEM Experimentation App');

      scriptLoadPromise = new Promise((resolve, reject) => {
          if (isAEMExperimentationAppLoaded) {
              resolve();
              return;
          }

          const script = document.createElement('script');
          script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-58-693263519c7251bdd9a675d6aa559ef858375b2a';

          script.onload = function () {
              console.log('[AEM Exp] Script loaded successfully');
              isAEMExperimentationAppLoaded = true;
              
              // Wait for container to be created
              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      console.log('[AEM Exp] Found container on initial load');
                      toggleExperimentPanel(true); // Force show on initial load
                      resolve();
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

      if (experimentParam && !isHandlingSimulation) {
          console.log('[AEM Exp] Raw experiment param:', experimentParam);
          const decodedParam = decodeURIComponent(experimentParam);
          console.log('[AEM Exp] Decoded experiment param:', decodedParam);

          const [experimentId, variantId] = decodedParam.split('/');
          if (experimentId) {
              console.log('[AEM Exp] Found experiment params, auto-opening...');
              isHandlingSimulation = true;

              // Set simulation state
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Load app and force show
              loadAEMExperimentationApp()
                  .then(() => {
                      toggleExperimentPanel(true); // Force show for simulation
                  })
                  .catch((error) => {
                      console.error('[AEM Exp] Error loading app:', error);
                  });
          }
      }
  }

  function handleSidekickPluginButtonClick() {
    const panel = document.getElementById('aemExperimentation');
    if (!panel) return;

    // Always use toggle behavior, regardless of simulation state
    console.log('[AEM Exp] Toggling panel visibility');
    const isCurrentlyHidden = panel.classList.contains('aemExperimentationHidden');
    if (isCurrentlyHidden) {
        panel.classList.remove('aemExperimentationHidden');
        aemExperimentationService.reopenApp();
    } else {
        panel.classList.add('aemExperimentationHidden');
    }
  }

  // Initialize Sidekick
  const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
  } else {
      document.addEventListener(
          'sidekick-ready',
          () => {
              const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekickElement) {
                  sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
              }
          },
          { once: true }
      );
  }

  // Check for experiment parameters on load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }

  // Handle messages from iframe
  // window.addEventListener('message', (event) => {
  //     if (event.data?.source === 'AEMExperimentation') {
  //         if (event.data?.action === 'autoOpenAfterSimulate' && !isHandlingSimulation) {
  //             isHandlingSimulation = true;
  //             try {
  //                 const simulationState = {
  //                     isSimulation: true,
  //                     source: source,
  //                     experimentId: event.data.experimentId,
  //                     variantId: event.data.variantId || '',
  //                 };
  //                 sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
  //                 sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
  //                 sessionStorage.setItem('aemExperimentation_experimentId', event.data.experimentId);
  //                 sessionStorage.setItem('aemExperimentation_variantId', event.data.variantId || '');
  //             } catch (error) {
  //                 console.error('[AEM Exp] Storage error:', error);
  //             } finally {
  //                 setTimeout(() => {
  //                     isHandlingSimulation = false;
  //                 }, 500);
  //             }
  //         }
  //     }
  // });
})();