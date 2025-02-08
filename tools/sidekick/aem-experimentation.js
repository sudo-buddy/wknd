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
                  
                  // Check if we have an existing auth session
                  const existingAuth = sessionStorage.getItem('aemExpAuth');
                  if (existingAuth) {
                      console.log('[AEM Exp] Found existing auth session');
                  }
                  
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

  function waitForAuth() {
      return new Promise((resolve) => {
          const checkAuth = () => {
              const iframe = document.querySelector('#aemExperimentationIFrameContent');
              if (iframe?.contentWindow?.location?.href?.includes('experience-qa.adobe.com')) {
                  console.log('[AEM Exp] Auth ready');
                  // Store auth session when it works
                  sessionStorage.setItem('aemExpAuth', 'true');
                  resolve();
              } else {
                  console.log('[AEM Exp] Waiting for auth...');
                  setTimeout(checkAuth, 100);
              }
          };
          checkAuth();
      });
  }

  function createExperimentPanel() {
    console.log('[AEM Exp] Creating experiment panel');
    const panel = document.createElement('div');
    panel.id = 'aemExperimentation';

    const mover = document.createElement('div');
    mover.id = 'aemExperimentationMover';
    
    const iframe = document.createElement('iframe');
    iframe.id = 'aemExperimentationIFrameContent';
    iframe.src = `https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick.html?env=qa&pageUrl=${encodeURIComponent(window.location.href)}&source=plugin&t=${Date.now()}`;
    
    panel.appendChild(mover);
    panel.appendChild(iframe);
    document.body.appendChild(panel);
    return panel;
}

function handleExperimentOpen(isAuto = false) {
    console.log('[AEM Exp] Handling experiment open, isAuto:', isAuto);
    let panel = document.getElementById('aemExperimentation');
    
    if (!isAEMExperimentationAppLoaded) {
        loadAEMExperimentationApp()
            .then(() => {
                if (!panel) {
                    console.log('[AEM Exp] Creating new panel');
                    panel = createExperimentPanel();
                }
                console.log('[AEM Exp] Panel ready, showing it');
                toggleExperimentPanel(true);
                
                return waitForAuth().then(() => {
                    if (isAuto) {
                        console.log('[AEM Exp] Auto mode - dispatching event after auth');
                        const sidekick = document.querySelector('aem-sidekick');
                        if (sidekick) {
                            const event = new CustomEvent('custom:aem-experimentation-sidekick');
                            sidekick.dispatchEvent(event);
                            console.log('[AEM Exp] Event dispatched');
                        }
                    }
                });
            })
            .catch(error => {
                console.error('[AEM Exp] Failed in handleExperimentOpen:', error);
            });
    } else {
        if (!panel) {
            console.log('[AEM Exp] Recreating panel for existing app');
            panel = createExperimentPanel();
            toggleExperimentPanel(true);
        } else {
            console.log('[AEM Exp] App already loaded, toggling panel');
            toggleExperimentPanel(false);
        }
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
      handleExperimentOpen(false);
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