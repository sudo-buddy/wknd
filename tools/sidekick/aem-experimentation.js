(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;

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
          script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-58-315f2b1cabd9555d7ce63b131331d1407b05ea15';
          
          script.onload = function () {
              console.log('[AEM Exp] Script loaded successfully');
              isAEMExperimentationAppLoaded = true;
              resolve();
          };
          
          script.onerror = function (error) {
              console.error('[AEM Exp] Error loading script:', error);
              scriptLoadPromise = null;
              reject(error);
          };

          document.head.appendChild(script);
      });

      return scriptLoadPromise;
  }

  function checkExperimentParams(retryCount = 0) {
      const maxRetries = 5;
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');
      
      if (experimentParam) {
          console.log('[AEM Exp] Raw experiment param:', experimentParam);
          
          if (experimentParam.includes('%2F') || experimentParam.includes('/')) {
              const decodedParam = decodeURIComponent(experimentParam);
              const [experimentId, variantId] = decodedParam.split('/');
              
              if (experimentId && (
                  variantId?.toLowerCase().includes('challenger') || 
                  variantId?.toLowerCase().includes('control')
              )) {
                  try {
                      sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
                      sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
                      sessionStorage.setItem('aemExperimentation_variantId', variantId);
                      
                      // Load app directly for auto-open
                      loadAEMExperimentationApp()
                          .catch(error => {
                              console.error('[AEM Exp] Failed to load:', error);
                          });
                  } catch (error) {
                      console.error('[AEM Exp] Error:', error);
                  }
              } else {
                  console.log('[AEM Exp] Did not match variant pattern');
              }
          } else {
              console.log('[AEM Exp] Did not match URL pattern');
          }
      }
  }

  function handlePluginButtonClick() {
      console.log('[AEM Exp] Plugin button clicked');
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .catch(error => {
                  console.error('[AEM Exp] Failed to load:', error);
              });
      }
  }

  // Initialize Sidekick V1
  const sidekick = document.querySelector('helix-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
      document.addEventListener('sidekick-ready', () => {
          const helixSidekick = document.querySelector('helix-sidekick');
          if (helixSidekick) {
              helixSidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
          }
      }, { once: true });
  }

  // Initialize Sidekick V2
  const sidekickV2 = document.querySelector('aem-sidekick');
  if (sidekickV2) {
      sidekickV2.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
  } else {
      document.addEventListener('sidekick-ready', () => {
          const aemSidekick = document.querySelector('aem-sidekick');
          if (aemSidekick) {
              aemSidekick.addEventListener('custom:aem-experimentation-sidekick', handlePluginButtonClick);
          }
      }, { once: true });
  }

  // Check for experiment parameters on load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }

  // Also listen for sidekick-ready event
  document.addEventListener('sidekick-ready', () => {
      console.log('[AEM Exp] Sidekick ready event received');
      checkExperimentParams();
  }, { once: true });

  // Handle messages from iframe
  window.addEventListener('message', (event) => {
      if (event.data?.source === 'AEMExperimentation') {
          if (event.data?.action === 'autoOpenAfterSimulate') {
              try {
                  sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
                  sessionStorage.setItem('aemExperimentation_experimentId', event.data.experimentId);
                  sessionStorage.setItem('aemExperimentation_variantId', event.data.variantId);
              } catch (error) {
                  console.error('[AEM Exp] Storage error:', error);
              }
          }
      }
  });
})();
