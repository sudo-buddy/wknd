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

  function loadAEMExperimentationApp(isSimulation = false) {
    if (!isAEMExperimentationAppLoaded) {
        scriptLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
            script.onload = function() {
                isAEMExperimentationAppLoaded = true;
                // Show panel immediately after script loads
                const panel = document.getElementById('aemExperimentation');
                if (panel) {
                    console.log('[AEM Exp] First load - showing panel');
                    toggleExperimentPanel(true); 
                }
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return scriptLoadPromise;
}

function checkExperimentParams() {
    // First check if sidekick is open
    const sidekick = document.querySelector('aem-sidekick');
    if (!sidekick.hasAttribute('open')) {
        sidekick.setAttribute('open', 'true');
    }
    
    // Then load app and handle auth
    loadAEMExperimentationApp(true)
        .then(() => waitForAuth())
        .then(() => {
            console.log('[AEM Exp] Auth complete');
        })
        .catch(error => {
            console.error('[AEM Exp] Failed to initialize:', error);
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
// Initialize Sidekick event listener
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

// Check for experiment parameters on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkExperimentParams);
} else {
    checkExperimentParams();
}
})();