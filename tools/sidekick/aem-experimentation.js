(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  // Add new function to handle auth preservation
  function preserveAuthData() {
      const authData = {
          token: sessionStorage.getItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations'),
          profile: sessionStorage.getItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations'),
          metrics: sessionStorage.getItem('adobeMetrics.instanceId')
      };
      
      if (authData.token && authData.profile) {
          localStorage.setItem('aem_exp_preserved_auth', JSON.stringify(authData));
      }
  }

  // Add new function to restore auth data
  function restoreAuthData() {
      const savedAuth = localStorage.getItem('aem_exp_preserved_auth');
      if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          sessionStorage.setItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authData.token);
          sessionStorage.setItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authData.profile);
          if (authData.metrics) {
              sessionStorage.setItem('adobeMetrics.instanceId', authData.metrics);
          }
      }
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

          // Try to restore auth data before loading the app
          restoreAuthData();

          const script = document.createElement('script');
          script.src = 'https://experience-stage.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

          script.onload = function () {
              isAEMExperimentationAppLoaded = true;
              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
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

              // Preserve auth data before simulation
              preserveAuthData();

              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control'
              };

              console.log('[AEM Exp] Setting simulation state:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              loadAEMExperimentationApp()
                  .then(() => {
                      // Try to restore auth data again after app loads
                      restoreAuthData();
                      
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
      // Preserve auth data before any action
      preserveAuthData();
      
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

  // Try to restore auth data on initial load
  restoreAuthData();
})();