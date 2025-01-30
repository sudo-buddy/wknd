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
          script.src = 'https://experience-stage.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';

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

              // IMPORTANT: Preserve auth data BEFORE setting simulation state
              const authToken = sessionStorage.getItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations');
              const authProfile = sessionStorage.getItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations');
              const metricsId = sessionStorage.getItem('adobeMetrics.instanceId');

              // Set simulation state
              const simulationState = {
                  isSimulation: true,
                  source: 'plugin',
                  experimentId: experimentId,
                  variantId: variantId || 'control',
                  // Include auth data in simulation state
                  auth: {
                      token: authToken,
                      profile: authProfile,
                      metrics: metricsId
                  }
              };
              
              console.log('[AEM Exp] Setting simulation state:', simulationState);
              sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || 'control');

              // Immediately restore auth data
              if (authToken && authProfile) {
                  sessionStorage.setItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authToken);
                  sessionStorage.setItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', authProfile);
                  if (metricsId) {
                      sessionStorage.setItem('adobeMetrics.instanceId', metricsId);
                  }
              }

              // Load app and force show
              loadAEMExperimentationApp()
                  .then(() => {
                      // Double-check auth data is still present
                      const simState = JSON.parse(sessionStorage.getItem('simulationState') || '{}');
                      if (simState.auth) {
                          sessionStorage.setItem('adobeid_ims_access_token/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', simState.auth.token);
                          sessionStorage.setItem('adobeid_ims_profile/aem-contextual-experimentation-ui/false/AdobeID,additional_info.projectedProductContext,additional_info.roles,openid,read_organizations', simState.auth.profile);
                          if (simState.auth.metrics) {
                              sessionStorage.setItem('adobeMetrics.instanceId', simState.auth.metrics);
                          }
                      }

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