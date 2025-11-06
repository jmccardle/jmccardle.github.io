// Code tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all tab buttons
    var tabs = document.querySelectorAll('[data-toggle-tab]');

    // Restore saved preference from localStorage
    var savedPref = localStorage.getItem('configLangPref');
    if (savedPref) {
        activateTab(savedPref);
    }

    // Add click event listeners to all tabs
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            var tabName = this.getAttribute('data-toggle-tab');

            // Save preference to localStorage
            localStorage.setItem('configLangPref', tabName);

            // Activate the selected tab
            activateTab(tabName);
        });
    });

    function activateTab(tabName) {
        // Deactivate all tabs
        var allTabs = document.querySelectorAll('[data-toggle-tab]');
        allTabs.forEach(function(tab) {
            tab.classList.remove('active');
        });

        // Deactivate all panes
        var allPanes = document.querySelectorAll('[data-pane]');
        allPanes.forEach(function(pane) {
            pane.classList.remove('active');
        });

        // Activate selected tabs and panes
        var selectedTabs = document.querySelectorAll('[data-toggle-tab="' + tabName + '"]');
        selectedTabs.forEach(function(tab) {
            tab.classList.add('active');
        });

        var selectedPanes = document.querySelectorAll('[data-pane="' + tabName + '"]');
        selectedPanes.forEach(function(pane) {
            pane.classList.add('active');
        });
    }
});
