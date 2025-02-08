(function () {
  let isAEMExperimentationAppLoaded = false;
  let scriptLoadPromise = null;
  let isHandlingSimulation = false;

  function createExperimentContainer() {
      // Create the floating iframe container with all necessary elements
      const currentUrl = stripTrailingSlash(window.location.href);
      const additionalParams = {
          env: 'qa',
          pageUrl: currentUrl,
          source: 'plugin',
          t: new Date().getTime(),
      };
      
      const iframeUrl = addQueryParams(
          'https://experience-qa.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/sidekick.html',
          additionalParams
      );

      const iframeContainer = document.createElement('div');
      iframeContainer.id = 'aemExperimentation';

      const iframeMover = document.createElement('div');
      iframeMover.id = 'aemExperimentationMover';

      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.id = 'aemExperimentationIFrameContent';

      const iframeContainerResizer = document.createElement('div');
      iframeContainerResizer.id = 'aemExperimentationResizer';
      iframeContainerResizer.innerHTML = '&nbsp;';

      iframeContainer.appendChild(iframeMover);
      iframeContainer.appendChild(iframe);
      iframeContainer.appendChild(iframeContainerResizer);
      document.body.appendChild(iframeContainer);

      return iframeContainer;
  }

  function loadAEMExperimentationApp(isSimulation = false) {
      if (isSimulation) {
          console.log('[AEM Exp] Starting simulation');
          
          // Remove existing container if any
          const existingContainer = document.getElementById('aemExperimentation');
          if (existingContainer) {
              existingContainer.remove();
          }

          // Reset states
          isAEMExperimentationAppLoaded = false;
          scriptLoadPromise = null;

          // Create new container immediately
          createExperimentContainer();

          return waitForAuth().then(() => {
              const container = document.getElementById('aemExperimentation');
              if (container) {
                  container.classList.remove('aemExperimentationHidden');
                  console.log('[AEM Exp] Container shown after auth ready');
              }
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

  // Helper functions from client.js
  function stripTrailingSlash(url) {
      return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  function addQueryParams(url, params) {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      for (const key in params) {
          searchParams.set(key, params[key]);
      }
      urlObj.search = searchParams.toString();
      return urlObj.toString();
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