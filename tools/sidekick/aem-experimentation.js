(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  // Creates (or updates) the experiment panel AND its iframe.
  // This forces a new load of the simulation/auth environment.
  function createExperimentPanel() {
      let panel = document.getElementById('aemExperimentation');
      if (!panel) {
          panel = document.createElement('div');
          panel.id = 'aemExperimentation';
          // Optionally, add any additional classes/styles here.
          document.body.appendChild(panel);
      }
      // Create or update the iframe inside the panel.
      let iframe = document.getElementById('aemExperimentationIFrameContent');
      if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'aemExperimentationIFrameContent';
          panel.appendChild(iframe);
      }
      // Force a fresh URL (with a timestamp) so that simulation/auth is reloaded.
      iframe.src =
          'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick.html?env=qa&pageUrl=' +
          encodeURIComponent(window.location.href) +
          '&source=plugin&t=' +
          Date.now();
      return panel;
  }

  // Simply toggles the panel’s visibility.
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

  // Polls until the iframe URL shows that authentication is complete.
  function waitForAuth() {
      return new Promise((resolve) => {
          const checkAuth = () => {
              const iframe = document.getElementById('aemExperimentationIFrameContent');
              if (
                  iframe &&
                  iframe.contentWindow &&
                  iframe.contentWindow.location &&
                  iframe.contentWindow.location.href &&
                  iframe.contentWindow.location.href.includes('experience-qa.adobe.com')
              ) {
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

  // Loads the AEM experimentation app. In simulation mode (when isSimulation is true),
  // we “recreate” the panel (and iframe) so that a fresh auth session is triggered.
  function loadAEMExperimentationApp(isSimulation = false) {
      if (isSimulation && !isHandlingSimulation) {
          console.log('[AEM Exp] Starting simulation');
          isHandlingSimulation = true;
          // Create (or update) the panel so that we get a new iframe load.
          createExperimentPanel();
          // Wait for the new iframe to get its auth state
          return waitForAuth().then(() => {
              const container = document.getElementById('aemExperimentation');
              if (container) {
                  container.classList.remove('aemExperimentationHidden');
                  console.log('[AEM Exp] Container shown after auth ready');
              }
              isHandlingSimulation = false;
          });
      }

      // Otherwise, proceed with the original first-load logic.
      if (!isAEMExperimentationAppLoaded) {
          scriptLoadPromise = new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src =
                  'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick/client.js?source=plugin';
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

  // This is the manual (sidekick) click handler.
  // It now calls createExperimentPanel() to ensure a proper panel/iframe exists.
  function handleSidekickPluginButtonClick() {
      createExperimentPanel();
      if (!isAEMExperimentationAppLoaded) {
          loadAEMExperimentationApp()
              .then(() => {
                  console.log('[AEM Exp] First load - showing panel');
                  toggleExperimentPanel(true);
              })
              .catch(error => {
                  console.error('[AEM Exp] Failed to load:', error);
              });
      } else {
          // For subsequent clicks, simply toggle the panel.
          toggleExperimentPanel(false);
      }
  }

  // Helper: waits for the sidekick element to be ready.
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

  // Checks the URL parameters and triggers simulation if the "simulate" parameter is present.
  function checkExperimentParams() {
      console.log('[AEM Exp] Starting checkExperimentParams');
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('simulate')) {
          console.log('[AEM Exp] Simulation parameter detected');
          loadAEMExperimentationApp(true)
              .then(() => {
                  console.log('[AEM Exp] Simulation branch completed.');
              })
              .catch((err) => {
                  console.error('[AEM Exp] Simulation branch error:', err);
              });
      }
  }

  // Initialize Sidekick event listener (manual trigger)
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

  // Kick off check for experiment parameters on load.
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }
})();