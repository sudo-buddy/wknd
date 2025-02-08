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
    console.log('[AEM Exp] Starting to load app');
    if (!isAEMExperimentationAppLoaded) {
        scriptLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
            script.onload = function() {
                isAEMExperimentationAppLoaded = true;
                console.log('[AEM Exp] Script loaded successfully');
                resolve();
            };
            script.onerror = (error) => {
                console.error('[AEM Exp] Script load error:', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }
    return scriptLoadPromise;
}

function handleExperimentOpen(isAuto = false) {
    console.log('[AEM Exp] Handling experiment open, isAuto:', isAuto);
    const panel = document.getElementById('aemExperimentation');
    
    if (!isAEMExperimentationAppLoaded) {
        loadAEMExperimentationApp()
            .then(() => {
                if (panel) {
                    console.log('[AEM Exp] Panel found, showing it');
                    toggleExperimentPanel(true);
                    
                    if (isAuto) {
                        console.log('[AEM Exp] Auto mode - dispatching event');
                        const sidekick = document.querySelector('aem-sidekick');
                        if (sidekick) {
                            const event = new CustomEvent('custom:aem-experimentation-sidekick');
                            sidekick.dispatchEvent(event);
                            console.log('[AEM Exp] Event dispatched');
                        } else {
                            console.log('[AEM Exp] No sidekick found for event dispatch');
                        }
                    }
                } else {
                    console.log('[AEM Exp] No panel found');
                }
            })
            .catch(error => {
                console.error('[AEM Exp] Failed in handleExperimentOpen:', error);
            });
    } else {
        console.log('[AEM Exp] App already loaded, toggling panel');
        toggleExperimentPanel(false);
    }
}

function checkExperimentParams() {
    console.log('[AEM Exp] Starting checkExperimentParams');
    waitForSidekick()
        .then((sidekick) => {
            console.log('[AEM Exp] Sidekick found, opening experiment');
            handleExperimentOpen(true);
        })
        .catch(error => {
            console.error('[AEM Exp] Failed in checkExperimentParams:', error);
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