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
    // First check if we already have an authenticated container
    const existingContainer = document.getElementById('aemExperimentation');
    if (existingContainer) {
        console.log('xinyiyiyiyiyiyiy Using existing container');
        return Promise.resolve().then(() => {
            toggleExperimentPanel(true);
        });
    }

    // Only create new if doesn't exist
    if (scriptLoadPromise) {
        console.log('xinyiyiyiyiyiyiy Using existing promise');
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

        script.onload = function () {
            isAEMExperimentationAppLoaded = true;
            const waitForContainer = (retries = 0, maxRetries = 20) => {
                const container = document.getElementById('aemExperimentation');
                if (container) {
                    console.log('xinyiyiyiyiyiyiy New container created');
                    toggleExperimentPanel(true);
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

  // function checkExperimentParams() {
  //     const urlParams = new URLSearchParams(window.location.search);
  //     const experimentParam = urlParams.get('experiment');

  //     if (experimentParam && !isHandlingSimulation) {
  //         const decodedParam = decodeURIComponent(experimentParam);

  //         const [experimentId, variantId] = decodedParam.split('/');
  //         if (experimentId) {
  //             isHandlingSimulation = true;
  //             // Set simulation state
  //             const simulationState = {
  //                 isSimulation: true,
  //                 source: 'plugin',
  //                 experimentId: experimentId,
  //                 variantId: variantId || 'control',
  //             };
  //             console.log('[AEM Exp] Setting simulation state:', simulationState);

  //             sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
  //             sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
  //             sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
  //             sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

  //             // Load app and force show
  //             loadAEMExperimentationApp()
  //                 .then(() => {
  //                     const panel = document.getElementById('aemExperimentation');
  //                     if (panel) {
  //                         panel.classList.remove('aemExperimentationHidden');
  //                     }
  //                 })
  //                 .catch((error) => {
  //                     console.error('[AEM Exp] Error loading app:', error);
  //                 });
  //         }
  //     }
  // }

//   function checkExperimentParams() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const experimentParam = urlParams.get('experiment');

//     if (experimentParam && !isHandlingSimulation) {
//         const [experimentId, variantId] = decodeURIComponent(experimentParam).split('/');
//         if (experimentId) {
//             isHandlingSimulation = true;
//             const simulationState = {
//                 isSimulation: true,
//                 source: 'plugin',
//                 experimentId,
//                 variantId: variantId || 'control',
//             };
            
//             sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
            
//             // If panel exists, show it and let the app handle the view change
//             const panel = document.getElementById('aemExperimentation');
//             if (panel) {
//               console.log('xinyiyiyiyiyiyiy Panel exists - showing it');
//                 panel.classList.remove('aemExperimentationHidden');
//             } else {
//                 // Only create new if doesn't exist
//                 console.log('xinyiyiyiyiyiyiy Panel does not exist - creating it');
//                 loadAEMExperimentationApp();
//             }
//         }
//     }
// }

function loadAEMExperimentationApp() {
  // Log the current state
  console.log('Current container state:', {
      exists: !!document.getElementById('aemExperimentation'),
      isLoaded: isAEMExperimentationAppLoaded,
      hasPromise: !!scriptLoadPromise
  });

  // If app is already loaded and container exists, just show it
  if (isAEMExperimentationAppLoaded) {
      const existingPanel = document.getElementById('aemExperimentation');
      if (existingPanel) {
          console.log('xinyiyiyiyiyiyiy Using existing authenticated panel');
          toggleExperimentPanel(true);
          return Promise.resolve();
      }
  }

  // If we have a pending promise, return it
  if (scriptLoadPromise) {
      console.log('xinyiyiyiyiyiyiy Using existing load promise');
      return scriptLoadPromise;
  }

  console.log('xinyiyiyiyiyiyiy Creating new panel instance');
  scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

      script.onload = function () {
          isAEMExperimentationAppLoaded = true;
          const waitForContainer = (retries = 0, maxRetries = 20) => {
              const container = document.getElementById('aemExperimentation');
              if (container) {
                  console.log('xinyiyiyiyiyiyiy Container ready');
                  toggleExperimentPanel(true);
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

          // Set simulation state before checking panel
          sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
          sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
          sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
          sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

          // Check for existing authenticated panel first
          const existingPanel = document.getElementById('aemExperimentation');
          if (existingPanel && isAEMExperimentationAppLoaded) {
              console.log('xinyiyiyiyiyiyiy Reusing existing authenticated panel for simulation');
              existingPanel.classList.remove('aemExperimentationHidden');
              return;
          }

          // Only load new if necessary
          loadAEMExperimentationApp()
              .catch((error) => {
                  console.error('[AEM Exp] Error loading app:', error);
              });
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
})();