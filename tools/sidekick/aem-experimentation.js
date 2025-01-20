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
          script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=bookmarklet&ExpSuccess-aem-experimentation-mfe_version=PR-58-04ad066bca038eb4d807523d8818495558448078';
          
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

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const experimentParam = urlParams.get('experiment');
      
      if (experimentParam) {
          const [experimentId, variantId] = experimentParam.split('/');
          if (experimentId) {
              console.log('[AEM Exp] Found experiment params, auto-opening...');
              sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
              sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
              sessionStorage.setItem('aemExperimentation_variantId', variantId || '');
              
              // Trigger plugin button click
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekick) {
                  sidekick.dispatchEvent(new CustomEvent('custom:aem-experimentation-sidekick'));
              }
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