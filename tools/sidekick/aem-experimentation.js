(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;

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

  function waitForAuth() {
      return new Promise((resolve) => {
          const checkAuth = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              if (iframe?.contentWindow?.location?.href?.includes('experience-qa.adobe.com')) {
                  console.log('[AEM Exp] Auth ready');
                  resolve();
              } else {
                  console.log('[AEM Exp] Waiting for auth...');
                  setTimeout(checkAuth, 100);
              }
          };
          checkAuth();
      });
  }

  function waitForSidekick() {
      return new Promise((resolve) => {
          const check = () => {
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekick) {
                  console.log('[AEM Exp] Sidekick ready');
                  resolve(sidekick);
              } else {
                  console.log('[AEM Exp] Waiting for sidekick...');
                  setTimeout(check, 100);
              }
          };
          check();
      });
  }

  function loadAEMExperimentationApp(isSimulation = false) {
      if (!isAEMExperimentationAppLoaded) {
          scriptLoadPromise = new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
              script.onload = function() {
                  isAEMExperimentationAppLoaded = true;
                  resolve();
              };
              script.onerror = reject;
              document.head.appendChild(script);
          });
      }
      return scriptLoadPromise;
  }

  function handleSidekickPluginButtonClick(isAuto = false) {
      console.log('[AEM Exp] Handle button click, isAuto:', isAuto);
      const panel = document.getElementById('aemExperimentation');

      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => {
                  if (panel) {
                      console.log('[AEM Exp] First load - showing panel');
                      toggleExperimentPanel(true);
                      
                      // If auto mode, wait for auth and then trigger the real click
                      if (isAuto) {
                          return waitForAuth().then(() => {
                              console.log('[AEM Exp] Auth ready, triggering real click');
                              const sidekick = document.querySelector('aem-sidekick');
                              if (sidekick) {
                                  const event = new CustomEvent('custom:aem-experimentation-sidekick');
                                  sidekick.dispatchEvent(event);
                              }
                          });
                      }
                  }
              })
              .catch(error => {
                  console.error('[AEM Exp] Failed to load:', error);
              });
      } else {
          toggleExperimentPanel(false);
      }
  }

  function checkExperimentParams() {
      console.log('[AEM Exp] Starting checkExperimentParams');
      waitForSidekick()
          .then(() => {
              handleSidekickPluginButtonClick(true); // Pass true for auto mode
          })
          .catch(error => {
              console.error('[AEM Exp] Failed in checkExperimentParams:', error);
          });
  }

  // Initialize Sidekick
  const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', () => handleSidekickPluginButtonClick(false));
  } else {
      document.addEventListener(
          'sidekick-ready',
          () => {
              const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekickElement) {
                  sidekickElement.addEventListener('custom:aem-experimentation-sidekick', () => handleSidekickPluginButtonClick(false));
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