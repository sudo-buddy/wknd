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

  function restoreAuthState() {
    console.log('[AEM Exp] Attempting to restore auth state');
    
    // Check for stored auth token
    const storedAuth = sessionStorage.getItem('aemExperimentation_authToken');
    if (!storedAuth) {
        console.log('[AEM Exp] No stored auth found');
        return false;
    }

    try {
        const authData = JSON.parse(storedAuth);
        console.log('[AEM Exp] Found stored auth data:', authData);
        
        // Check if token is still valid (1 hour expiry)
        if (Date.now() - authData.timestamp > 3600000) {
            console.log('[AEM Exp] Stored auth expired');
            sessionStorage.removeItem('aemExperimentation_authToken');
            return false;
        }

        // Restore token with original key
        sessionStorage.setItem(authData.key, JSON.stringify(authData.data));
        console.log('[AEM Exp] Successfully restored auth state');
        return true;
    } catch (error) {
        console.error('[AEM Exp] Error restoring auth:', error);
        return false;
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

        console.log('[AEM Exp] Loading experimentation app');
        const script = document.createElement('script');
        script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-81-34d72ac00977136bb5c4c7dc2926f8d1173e23b8';

        script.onload = function () {
            console.log('[AEM Exp] App script loaded');
            isAEMExperimentationAppLoaded = true;
            
            // Wait for container to be created
            const waitForContainer = async (retries = 0, maxRetries = 20) => {
                const container = document.getElementById('aemExperimentation');
                if (container) {
                    console.log('[AEM Exp] Container found, restoring auth');
                    const authRestored = await restoreAuthState();
                    console.log('[AEM Exp] Auth restored:', authRestored);
                    
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

        script.onerror = (error) => {
            console.error('[AEM Exp] Failed to load app script:', error);
            reject(error);
        };
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

        // Get stored simulation state which might include auth info
        const storedState = sessionStorage.getItem('aemExperimentation_simulationState');
        const simulationState = {
          isSimulation: true,
          source: 'plugin',
          experimentId: experimentId,
          variantId: variantId || 'control',
          timestamp: Date.now()
        };

        if (storedState) {
          try {
            const parsedState = JSON.parse(storedState);
            // Merge with any additional stored state (like auth)
            Object.assign(simulationState, parsedState);
          } catch (error) {
            console.error('[AEM Exp] Error parsing stored state:', error);
          }
        }

        console.log('[AEM Exp] Setting simulation state:', simulationState);
        sessionStorage.setItem('aemExperimentation_simulationState', JSON.stringify(simulationState));
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