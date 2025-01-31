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
    // Look for stored auth token with the specific IMS key pattern
    const tokenKey = Object.keys(sessionStorage).find(key => 
      key.startsWith('adobeid_ims_access_token/aem-contextual-experimentation-ui')
    );
    
    if (tokenKey) {
      try {
        const tokenData = JSON.parse(sessionStorage.getItem(tokenKey));
        if (tokenData?.tokenValue) {
          // Store the token in the format expected by the app
          const newTokenKey = 'adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations';
          sessionStorage.setItem(newTokenKey, JSON.stringify({
            valid: true,
            client_id: 'aem-contextual-experimentation-ui',
            tokenValue: tokenData.tokenValue,
            scope: 'AdobeID,openid,read_organizations,additional_info.projectedProductContext,additional_info.roles'
          }));
          return true;
        }
      } catch (error) {
        console.error('[AEM Exp] Error restoring auth state:', error);
      }
    }
    return false;
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
      script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-81-e7290652d57c86a04efefe92a9037eb35a3292f7';

      script.onload = function () {
        isAEMExperimentationAppLoaded = true;
        
        // Wait for container to be created
        const waitForContainer = async (retries = 0, maxRetries = 20) => {
          const container = document.getElementById('aemExperimentation');
          if (container) {
            // Restore auth state before showing panel
            await restoreAuthState();
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