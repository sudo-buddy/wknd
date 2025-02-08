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

  function simulateButtonClick() {
      const sidekick = document.querySelector('aem-sidekick');
      if (sidekick) {
          // Find the actual button in sidekick
          const buttons = sidekick.shadowRoot.querySelectorAll('button');
          let expButton;
          for (const button of buttons) {
              if (button.textContent.includes('Experimentation')) {
                  expButton = button;
                  break;
              }
          }
          
          if (expButton) {
              console.log('[AEM Exp] Found experimentation button, clicking');
              expButton.click();
              return true;
          }
      }
      return false;
  }

  function checkExperimentParams() {
      console.log('[AEM Exp] Starting checkExperimentParams');
      waitForSidekick()
          .then(() => {
              // Try to simulate the button click
              if (!simulateButtonClick()) {
                  console.log('[AEM Exp] Could not find button, falling back to event dispatch');
                  const sidekick = document.querySelector('aem-sidekick');
                  if (sidekick) {
                      const event = new CustomEvent('custom:aem-experimentation-sidekick');
                      sidekick.dispatchEvent(event);
                  }
              }
          })
          .catch(error => {
              console.error('[AEM Exp] Failed in checkExperimentParams:', error);
          });
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