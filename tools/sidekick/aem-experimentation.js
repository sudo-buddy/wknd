// (function () {
//   // Define a variable to track iframe readiness
//   let iframeIsReady = false;

//   // Add the handshake listener so that when the iframe sends the "iframeReady" message,
//   // we mark it as ready and send the simulation state.
//   window.addEventListener('message', (event) => {
//     if (event.data && event.data.type === 'iframeReady') {
//       console.log('[Parent] Iframe reports ready.');
//       iframeIsReady = true;
      
//       // Now that the iframe is ready, send the simulation state if it exists.
//       const storedState = sessionStorage.getItem('simulationState');
//       if (storedState) {
//         sendSimulationStateToIframe(JSON.parse(storedState));
//       }
//     }
//   });

//   function sendSimulationStateToIframe(simulationState) {
//     const iframe = document.getElementById('aemExperimentationIFrameContent');
//     if (iframe && iframe.contentWindow) {
//       iframe.contentWindow.postMessage(
//         {
//           type: 'simulationState',
//           simulationState
//         },
//         '*' // Use '*' if your iframe performs origin validation
//       );
//       console.log('[Parent] Sent simulation state to iframe:', simulationState);
//     } else {
//       console.warn('[Parent] Iframe not found to send simulation state.');
//     }
//   }

//   // Existing code in your IIFE
//   let isAEMExperimentationAppLoaded = false;
//   let scriptLoadPromise = null;
//   let isHandlingSimulation = false;

//   function toggleExperimentPanel(forceShow = false) {
//     const container = document.getElementById('aemExperimentation');
//     if (container) {     
//       if (forceShow) {
//         container.classList.remove('aemExperimentationHidden');
//       } else {
//         container.classList.toggle('aemExperimentationHidden');
//       }
//     }
//   }

//   function loadAEMExperimentationApp() {
//     if (scriptLoadPromise) {
//       return scriptLoadPromise;
//     }

//     scriptLoadPromise = new Promise((resolve, reject) => {
//       if (isAEMExperimentationAppLoaded) {
//         resolve();
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-88-53ae8328d81dfce4d4500a99c9e56c49de17bf91';

//       script.onload = function () {
//         isAEMExperimentationAppLoaded = true;
//         // Wait for container to be created
//         const waitForContainer = (retries = 0, maxRetries = 20) => {
//           const container = document.getElementById('aemExperimentation');
//           if (container) {
//             toggleExperimentPanel(true); // Force show on initial load
//             resolve();
//           } else if (retries < maxRetries) {
//             setTimeout(() => waitForContainer(retries + 1, maxRetries), 200);
//           } else {
//             resolve();
//           }
//         };
        
//         waitForContainer();
//       };

//       script.onerror = reject;
//       document.head.appendChild(script);
//     });

//     return scriptLoadPromise;
//   }

//   function checkExperimentParams() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const experimentParam = urlParams.get('experiment');

//     if (experimentParam && !isHandlingSimulation) {
//       const decodedParam = decodeURIComponent(experimentParam);
//       const [experimentId, variantId] = decodedParam.split('/');
//       if (experimentId) {
//         isHandlingSimulation = true;
//         // Set simulation state in the parent's sessionStorage
//         const simulationState = {
//           isSimulation: true,
//           source: 'plugin',
//           experimentId: experimentId,
//           variantId: variantId || 'control',
//         };
//         console.log('[AEM Exp] Setting simulation state:', simulationState);
//         sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
//         sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
//         sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
//         sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

//         // Load AEM Experimentation App
//         loadAEMExperimentationApp()
//           .then(() => {
//             const panel = document.getElementById('aemExperimentation');
//             if (panel) {
//               panel.classList.remove('aemExperimentationHidden');
//             }
//             // Instead of immediately sending postMessage,
//             // wait for the iframe's "iframeReady" handshake.
//             if (iframeIsReady) {
//               sendSimulationStateToIframe(simulationState);
//             }
//             // Otherwise, the "iframeReady" listener above will send it.
//           })
//           .catch((error) => {
//             console.error('[AEM Exp] Error loading app:', error);
//           });
//       }
//     }
//   }

//   function handleSidekickPluginButtonClick() {
//     const panel = document.getElementById('aemExperimentation');

//     if (!isAEMExperimentationAppLoaded) {
//       loadAEMExperimentationApp()
//         .then(() => {
//           if (panel) {
//             console.log('[AEM Exp] First load - showing panel');
//             toggleExperimentPanel(true); 
//           }
//         })
//         .catch(error => {
//           console.error('[AEM Exp] Failed to load:', error);
//         });
//     } else {
//       toggleExperimentPanel(false);
//     }
//   }

//   // Initialize Sidekick
//   const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
//   if (sidekick) {
//     sidekick.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
//   } else {
//     document.addEventListener(
//       'sidekick-ready',
//       () => {
//         const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
//         if (sidekickElement) {
//           sidekickElement.addEventListener('custom:aem-experimentation-sidekick', handleSidekickPluginButtonClick);
//         }
//       },
//       { once: true }
//     );
//   }

//   // Check for experiment parameters on load
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', checkExperimentParams);
//   } else {
//     checkExperimentParams();
//   }
// })();

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
          script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-88-45bd1c5cbc208523dc0b1f12152e8bb24f4773db';

          script.onload = function () {
              isAEMExperimentationAppLoaded = true;
              // Wait for container to be created
              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
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
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Load app and force show
              loadAEMExperimentationApp()
                  .then(() => {
                      const panel = document.getElementById('aemExperimentation');
                      if (panel) {
                          panel.classList.remove('aemExperimentationHidden');
                      }
                  })
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