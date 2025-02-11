export function initAEMExperimentation() {
    console.log('[AEM Exp Debug] Waiting for plugin initialization...');
    
    // Check if plugin eager phase is complete
    const checkPluginStatus = () => {
        if (!window.hlx?.experiments) {
            console.log('[AEM Exp Debug] Plugin eager phase not ready, waiting...');
            setTimeout(checkPluginStatus, 100);
            return;
        }

        console.log('[AEM Exp Debug] Plugin eager phase complete');
        const hasExperimentParams = checkExperimentParams();
        
        // Only proceed with initialization if we're not handling a simulation
        if (!isHandlingSimulation) {
            initSidekickListeners();
        }
        
        if (hasExperimentParams) {
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
    };

    checkPluginStatus();
}

export function checkExperimentParams() {
    console.log('[AEM Exp Debug] Checking experiment params');
    const urlParams = new URLSearchParams(window.location.search);
    const experimentParam = urlParams.get('experiment');

    if (experimentParam && !isHandlingSimulation) {
        console.log('[AEM Exp Debug] Found experiment param:', experimentParam);
        const decodedParam = decodeURIComponent(experimentParam);

        const [experimentId, variantId] = decodedParam.split('/');
        if (experimentId) {
            console.log('[AEM Exp Debug] Starting simulation for:', { experimentId, variantId });
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
            return true;
        }
    }
    return false;
}

export function initSidekickListeners() {
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
}

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
    console.log('[AEM Exp Debug] Loading AEM Experimentation App');
    if (scriptLoadPromise) {
        console.log('[AEM Exp Debug] Using existing script load promise');
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise((resolve, reject) => {
        if (isAEMExperimentationAppLoaded) {
            console.log('[AEM Exp Debug] App already loaded');
            resolve();
            return;
        }

        console.log('[AEM Exp Debug] Creating script element');
        const script = document.createElement('script');
        script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

        script.onload = function () {
            console.log('[AEM Exp Debug] Script loaded successfully');
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