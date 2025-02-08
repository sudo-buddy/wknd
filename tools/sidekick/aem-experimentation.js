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

  function loadAEMExperimentationApp(isSimulation = false) {
      if (isSimulation && !isHandlingSimulation) {
          console.log('[AEM Exp] Starting simulation');
          isHandlingSimulation = true;

          // Instead of creating our own iframe, dispatch the event to let client.js handle it
          const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
          if (sidekick) {
              const event = new CustomEvent('custom:aem-experimentation-sidekick');
              sidekick.dispatchEvent(event);
          }

          return waitForAuth().then(() => {
              const container = document.getElementById('aemExperimentation');
              if (container) {
                  container.classList.remove('aemExperimentationHidden');
                  console.log('[AEM Exp] Container shown after auth ready');
              }
              isHandlingSimulation = false;
          });
      }

      // Original first-load logic
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

  function waitForSidekick() {
      return new Promise((resolve) => {
          const check = () => {
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekick) {
                  resolve(sidekick);
              } else {
                  setTimeout(check, 100);
              }
          };
          check();
      });
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('simulate')) {
          waitForSidekick().then(() => {
              loadAEMExperimentationApp(true);
          });
      }
  }

  // Initialize Sidekick
  const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
  if (sidekick) {
      sidekick.addEventListener('custom:aem-experimentation-sidekick', () => {
          if (!isHandlingSimulation) {
              loadAEMExperimentationApp();
          }
      });
  } else {
      document.addEventListener(
          'sidekick-ready',
          () => {
              const sidekickElement = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekickElement) {
                  sidekickElement.addEventListener('custom:aem-experimentation-sidekick', () => {
                      if (!isHandlingSimulation) {
                          loadAEMExperimentationApp();
                      }
                  });
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