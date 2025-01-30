(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function preserveAuthData() {
      const authData = {
          token: sessionStorage.getItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations'),
          profile: sessionStorage.getItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations'),
          metrics: sessionStorage.getItem('adobeMetrics.instanceId')
      };
      
      console.log('[AEM Exp Debug] Attempting to preserve auth data:', {
          hasToken: !!authData.token,
          hasProfile: !!authData.profile,
          hasMetrics: !!authData.metrics
      });
      
      if (authData.token && authData.profile) {
          localStorage.setItem('aem_exp_preserved_auth', JSON.stringify(authData));
          console.log('[AEM Exp Debug] Auth data preserved in localStorage');
      } else {
          console.log('[AEM Exp Debug] No auth data to preserve');
      }
  }

  function restoreAuthData() {
      console.log('[AEM Exp Debug] Attempting to restore auth data');
      const savedAuth = localStorage.getItem('aem_exp_preserved_auth');
      if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          console.log('[AEM Exp Debug] Found saved auth data:', {
              hasToken: !!authData.token,
              hasProfile: !!authData.profile,
              hasMetrics: !!authData.metrics
          });
          
          sessionStorage.setItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authData.token);
          sessionStorage.setItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authData.profile);
          if (authData.metrics) {
              sessionStorage.setItem('adobeMetrics.instanceId', authData.metrics);
          }
          console.log('[AEM Exp Debug] Auth data restored to sessionStorage');
      } else {
          console.log('[AEM Exp Debug] No saved auth data found in localStorage');
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
      console.log('[AEM Exp Debug] Loading app, current auth status:', {
          hasToken: !!sessionStorage.getItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations'),
          hasProfile: !!sessionStorage.getItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations')
      });

      if (scriptLoadPromise) {
          return scriptLoadPromise;
      }

      scriptLoadPromise = new Promise((resolve, reject) => {
          if (isAEMExperimentationAppLoaded) {
              resolve();
              return;
          }

          console.log('[AEM Exp Debug] Before loading script - attempting to restore auth');
          restoreAuthData();

          const script = document.createElement('script');
          script.src = 'https://experience-stage.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

          script.onload = function () {
              console.log('[AEM Exp Debug] Script loaded, checking auth status');
              isAEMExperimentationAppLoaded = true;
              
              // Double-check auth after script load
              restoreAuthData();

              const waitForContainer = (retries = 0, maxRetries = 20) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      console.log('[AEM Exp Debug] Container created, final auth check');
                      restoreAuthData();
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
              console.error('[AEM Exp Debug] Script load error:', error);
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
          console.log('[AEM Exp Debug] Starting experiment param check');
          const decodedParam = decodeURIComponent(experimentParam);

          const [experimentId, variantId] = decodedParam.split('/');
          if (experimentId) {
              isHandlingSimulation = true;
              console.log('[AEM Exp Debug] Before simulation - preserving auth');
              preserveAuthData();

              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control'
              };

              console.log('[AEM Exp Debug] Setting simulation state:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              loadAEMExperimentationApp()
                  .then(() => {
                      console.log('[AEM Exp Debug] App loaded in simulation mode');
                      restoreAuthData();
                      
                      const panel = document.getElementById('aemExperimentation');
                      if (panel) {
                          panel.classList.remove('aemExperimentationHidden');
                      }
                  })
                  .catch((error) => {
                      console.error('[AEM Exp Debug] Error loading app:', error);
                  });
          }
      }
  }

  function handleSidekickPluginButtonClick() {
      console.log('[AEM Exp Debug] Sidekick button clicked');
      preserveAuthData();
      
      const panel = document.getElementById('aemExperimentation');

      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => {
                  if (panel) {
                      console.log('[AEM Exp Debug] First load - showing panel');
                      toggleExperimentPanel(true);
                  }
              })
              .catch(error => {
                  console.error('[AEM Exp Debug] Failed to load:', error);
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

  console.log('[AEM Exp Debug] Plugin initialized');
  // Check for experiment parameters on load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }

  // Initial auth check
  console.log('[AEM Exp Debug] Initial auth check');
  restoreAuthData();
})();