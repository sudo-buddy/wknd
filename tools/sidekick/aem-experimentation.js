(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

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
                      console.log('[AEM Exp] Found container, ensuring visible');
                      // Remove hidden class if it exists
                      container.classList.remove('aemExperimentationHidden');
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

            // Check existing simulation state for source
            const existingState = sessionStorage.getItem('simulationState');
            let source = 'plugin'; // default source

            if (existingState) {
                // If there's existing state, preserve its source (e.g., 'adminUI')
                source = JSON.parse(existingState).source;
            }

              // Set simulation state as an object
              const simulationState = {
                  isSimulation: true,
                  source: source,
                  experimentId: experimentId,
                  variantId: variantId || 'control',
              };
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));

              // Ensure storage is set
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Then directly load the app
              console.log('[AEM Exp] Loading experimentation app...');
              loadAEMExperimentationApp()
                  .then(() => {
                      // Wait for container to be created
                      const waitForContainer = (retries = 0, maxRetries = 20) => {
                          const container = document.getElementById('aemExperimentation');
                          if (container) {
                              console.log('[AEM Exp] Found container, removing hidden class');
                              container.classList.remove('aemExperimentationHidden');
                                                  // Add this: Trigger reopening of the app
                              const shouldAutoOpen = sessionStorage.getItem('aemExperimentation_autoOpen');
                              if (shouldAutoOpen === 'true') {
                                  const experimentId = sessionStorage.getItem('aemExperimentation_experimentId');
                                  const variantId = sessionStorage.getItem('aemExperimentation_variantId');
                                  
                                  // Assuming aemExperimentationService is available from client.js
                                  window.aemExperimentationService?.reopenApp(experimentId, variantId);
                                  
                                  // Clear storage after reopening
                                  sessionStorage.removeItem('aemExperimentation_autoOpen');
                                  sessionStorage.removeItem('aemExperimentation_experimentId');
                                  sessionStorage.removeItem('aemExperimentation_variantId');
                              }
                                    } else if (retries < maxRetries) {
                              console.log(`[AEM Exp] Container not found, retry ${retries + 1}/${maxRetries}`);
                              setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
                          } else {
                              console.log('[AEM Exp] Container not found after max retries');
                          }
                      };

                      waitForContainer();
                  })
                  .catch((error) => {
                      console.error('[AEM Exp] Error loading app:', error);
                  });
          }
      }
  }

  function handlePluginButtonClick() {
      console.log('[AEM Exp] Plugin button clicked');
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp().catch((error) => {
              console.error('[AEM Exp] Failed to load:', error);
          });
      } else {
          // Toggle the iframe visibility if it's already loaded
          const container = document.getElementById('aemExperimentation');
          if (container) {
              container.classList.toggle('aemExperimentationHidden');
              console.log('[AEM Exp] Panel visibility:', {
                  isHidden: container.classList.contains('aemExperimentationHidden'),
                  classList: container.classList.toString()
              });
          }
      }
  }

  // Initialize Sidekick
  const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
      document.addEventListener(
          'sidekick-ready',
          () => {
              const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekickElement) {
                  sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
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