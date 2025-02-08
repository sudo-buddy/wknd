(function () {
  function waitForSidekick() {
      return new Promise((resolve) => {
          const check = () => {
              const sidekick = document.querySelector('helix-sidekick, aem-sidekick');
              if (sidekick) {
                  console.log('[AEM Exp] Sidekick found');
                  resolve(sidekick);
              } else {
                  console.log('[AEM Exp] Waiting for sidekick...');
                  setTimeout(check, 100);
              }
          };
          check();
      });
  }

  function simulateSidekickClick(sidekick) {
      console.log('[AEM Exp] Simulating sidekick click');
      const event = new CustomEvent('custom:aem-experimentation-sidekick');
      sidekick.dispatchEvent(event);
  }

  function checkExperimentParams() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('simulate')) {
          console.log('[AEM Exp] Simulate parameter detected');
          waitForSidekick().then(simulateSidekickClick);
      }
  }

  // Check for experiment parameters on load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExperimentParams);
  } else {
      checkExperimentParams();
  }
})();