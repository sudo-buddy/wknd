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
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return scriptLoadPromise;
}

function handleExperimentOpen(isAuto = false) {
    const panel = document.getElementById('aemExperimentation');
    
    if (!isAEMExperimentationAppLoaded) {
        loadAEMExperimentationApp()
            .then(() => {
                if (panel) {
                    console.log('[AEM Exp] First load - showing panel');
                    toggleExperimentPanel(true);
                    
                    // If auto-opening, dispatch the event that manual click would create
                    if (isAuto) {
                        const sidekick = document.querySelector('aem-sidekick');
                        if (sidekick) {
                            const event = new CustomEvent('custom:aem-experimentation-sidekick');
                            sidekick.dispatchEvent(event);
                        }
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
    waitForSidekick()
        .then(() => {
            handleExperimentOpen(true); // true indicates auto-open
        })
        .catch(error => {
            console.error('[AEM Exp] Failed to initialize:', error);
        });
}

function handleSidekickPluginButtonClick() {
    handleExperimentOpen(false); // false indicates manual click
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