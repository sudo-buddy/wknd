function checkExperimentParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const experimentParam = urlParams.get('experiment');
  
  if (experimentParam) {
      console.log('[AEM Exp] Raw experiment param:', experimentParam);
      const decodedParam = decodeURIComponent(experimentParam);
      console.log('[AEM Exp] Decoded experiment param:', decodedParam);
      
      const [experimentId, variantId] = decodedParam.split('/');
      if (experimentId) {
          console.log('[AEM Exp] Found experiment params, auto-opening...');
          
          // First ensure storage is set
          sessionStorage.setItem('aemExperimentation_autoOpen', 'true');
          sessionStorage.setItem('aemExperimentation_experimentId', experimentId);
          sessionStorage.setItem('aemExperimentation_variantId', variantId || '');
          
          // Then directly load the app
          console.log('[AEM Exp] Loading experimentation app...');
          loadAEMExperimentationApp().then(() => {
              // Wait for container to be created
              const waitForContainer = (retries = 0, maxRetries = 10) => {
                  const container = document.getElementById('aemExperimentation');
                  if (container) {
                      console.log('[AEM Exp] Found container, removing hidden class');
                      container.classList.remove('aemExperimentationHidden');
                      
                      // Trigger sidekick event after ensuring container is visible
                      const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
                      if (sidekick) {
                          console.log('[AEM Exp] Triggering sidekick event');
                          sidekick.dispatchEvent(new CustomEvent('custom:aem-experimentation-sidekick'));
                      }
                  } else if (retries < maxRetries) {
                      console.log(`[AEM Exp] Container not found, retry ${retries + 1}/${maxRetries}`);
                      setTimeout(() => waitForContainer(retries + 1, maxRetries), 100);
                  } else {
                      console.log('[AEM Exp] Container not found after max retries');
                  }
              };
              
              waitForContainer();
          }).catch(error => {
              console.error('[AEM Exp] Error loading app:', error);
          });
      }
  }
}
