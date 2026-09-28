document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;

    const sidebarToggle =
        document.getElementById('sidebarToggle');

    const userMenuButton =
        document.querySelector('.user-menu-button');

    const userDropdown =
        document.querySelector('.user-dropdown');


    /*
     * ========================================
     * SIDEBAR
     * ========================================
     */

    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            'click',
            () => {

                if (window.innerWidth <= 768) {

                    body.classList.toggle(
                        'sidebar-open'
                    );

                } else {

                    body.classList.toggle(
                        'sidebar-collapsed'
                    );

                    localStorage.setItem(
                        'sidebarCollapsed',
                        body.classList.contains(
                            'sidebar-collapsed'
                        )
                    );
                }
            }
        );
    }


    /*
     * Restaurer l'état de la sidebar
     */

    if (
        window.innerWidth > 768 &&
        localStorage.getItem(
            'sidebarCollapsed'
        ) === 'true'
    ) {

        body.classList.add(
            'sidebar-collapsed'
        );
    }


    /*
     * ========================================
     * USER DROPDOWN
     * ========================================
     */

    if (
        userMenuButton &&
        userDropdown
    ) {

        userMenuButton.addEventListener(
            'click',
            (event) => {

                event.stopPropagation();

                userDropdown.classList.toggle(
                    'show'
                );
            }
        );


        document.addEventListener(
            'click',
            () => {

                userDropdown.classList.remove(
                    'show'
                );
            }
        );
    }


    /*
     * ========================================
     * MOBILE
     * ========================================
     */

    document.addEventListener(
        'click',
        (event) => {

            if (window.innerWidth > 768) {
                return;
            }

            const sidebar =
                document.querySelector(
                    '.main-sidebar'
                );

            if (
                body.classList.contains(
                    'sidebar-open'
                ) &&
                sidebar &&
                !sidebar.contains(event.target) &&
                !sidebarToggle.contains(event.target)
            ) {

                body.classList.remove(
                    'sidebar-open'
                );
            }
        }
    );

    /*
    * ========================================
    * TABLE SEARCH
    * ========================================
    */

    document
        .querySelectorAll('[data-table-search]')
        .forEach(input => {

            const selector =
                input.getAttribute(
                    'data-table-search'
                );

            const table =
                document.querySelector(selector);

            if (!table) {
                return;
            }

            input.addEventListener(
                'input',
                () => {

                    const search =
                        input.value
                            .trim()
                            .toLowerCase();

                    const rows =
                        table.querySelectorAll(
                            'tbody tr'
                        );

                    rows.forEach(row => {

                        const text =
                            row.textContent
                                .toLowerCase();

                        row.style.display =
                            text.includes(search)
                                ? ''
                                : 'none';
                    });
                }
            );
        });


    /*
    * ========================================
    * SIDEBAR DROPDOWN
    * ========================================
    */

    window.toggleSidebarDropdown = function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('open');
            console.log('Toggling dropdown:', dropdownId, 'Current classes:', dropdown.className);
        } else {
            console.log('Dropdown not found:', dropdownId);
        }
    };

    // Ouvrir automatiquement le menu contenant la page active
    const activeLink = document.querySelector('.sidebar-link.active');
    if (activeLink) {
        const dropdownContent = activeLink.closest('.sidebar-dropdown-content');
        if (dropdownContent) {
            const dropdown = dropdownContent.closest('.sidebar-dropdown');
            if (dropdown) {
                dropdown.classList.add('open');
                console.log('Auto-opening dropdown for active page');
            }
        }
    }

});