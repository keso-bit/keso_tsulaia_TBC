/**
 * კესო წულაიას პორტფოლიო - JavaScript
 * - Burger Menu ფუნქციონალი და მოვლენების დამუშავება
 * - Employees (თანამშრომლების) მონაცემების მიღება JSONPlaceholder API-დან
 * - ჩატვირთვის სტატუსი (Loading) და შეცდომების დამუშავება (Error handling)
 */

// Tailwind CSS კონფიგურაცია (თუ CDN ჩატვირთულია)
if (typeof window !== 'undefined' && window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['"Noto Sans Georgian"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                },
                colors: {
                    brand: {
                        50: '#eef2ff',
                        100: '#e0e7ff',
                        200: '#c7d2fe',
                        300: '#a5b4fc',
                        400: '#818cf8',
                        500: '#6366f1',
                        600: '#4f46e5',
                        700: '#4338ca',
                        800: '#3730a3',
                        900: '#312e81',
                    }
                }
            }
        }
    };
}

(function () {
    'use strict';

    // API მისამართი თანამშრომლების მონაცემებისთვის
    const EMPLOYEES_API_URL = 'https://jsonplaceholder.typicode.com/users';

    /**
     * ტექსტის უსაფრთხო ექსქეიპინგი (XSS პრევენცია)
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * ინიციალების გენერირება სახელისგან
     * @param {string} name
     * @returns {string}
     */
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Burger Menu-ს გაუმჯობესებული ფუნქციონალი:
     * - ბმულზე დაჭერისას მენიუს ავტომატური დახურვა
     * - Escape ღილაკით დახურვა
     * - მენიუს გარეთ დაწკაპუნებისას დახურვა
     */
    function initBurgerMenu() {
        const toggle = document.getElementById('mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        const header = document.querySelector('header');

        if (!toggle) return;

        // ნავიგაციის ნებისმიერ ბმულზე დაკლიკებისას ბურგერ მენიუს დახურვა
        if (nav) {
            const navLinks = nav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (toggle.checked) {
                        toggle.checked = false;
                    }
                });
            });
        }

        // Escape ღილაკზე დაჭერისას მენიუს დახურვა
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && toggle.checked) {
                toggle.checked = false;
            }
        });

        // ჰედერის გარეთ დაკლიკებისას მენიუს დახურვა
        document.addEventListener('click', (event) => {
            if (toggle.checked && header && !header.contains(event.target)) {
                toggle.checked = false;
            }
        });
    }

    /**
     * ჩატვირთვის (Loading) ინდიკატორის გამოჩენა
     * @param {HTMLElement} container
     */
    function showLoadingState(container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-sm" role="status">
                <div class="relative w-14 h-14 mb-4">
                    <div class="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
                        👥
                    </div>
                </div>
                <h3 class="text-base sm:text-lg font-bold text-slate-800">თანამშრომლების სია იტვირთება...</h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
                    გთხოვთ დაელოდოთ, მონაცემები იგზავნება სერვერიდან (JSONPlaceholder API).
                </p>
            </div>
        `;
    }

    /**
     * შეცდომის (Error) შეტყობინების გამოჩენა
     * @param {HTMLElement} container
     * @param {string} errorMessage
     */
    function showErrorState(container, errorMessage) {
        container.innerHTML = `
            <div class="rounded-3xl bg-red-50/90 border border-red-200/90 p-8 sm:p-10 text-center max-w-xl mx-auto shadow-sm" role="alert">
                <div class="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                    ⚠️
                </div>
                <h3 class="text-lg sm:text-xl font-bold text-red-900 mb-2">მონაცემების ჩატვირთვა ვერ მოხერხდა</h3>
                <p class="text-sm text-red-700 leading-relaxed mb-6">
                    ${escapeHtml(errorMessage || 'დაფიქსირდა შეცდომა სერვერთან დაკავშირებისას. გთხოვთ შეამოწმოთ ინტერნეტის კავშირი და სცადოთ ხელახლა.')}
                </p>
                <button id="retry-employees-btn" type="button" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-red-500/25 transition-all duration-200 cursor-pointer active:scale-95">
                    <span>🔄</span> ხელახლა ცდა
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('retry-employees-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                fetchEmployees();
            });
        }
    }

    /**
     * თანამშრომლის ერთი ბარათის HTML-ის გენერირება
     * მოთხოვნილი ველები: სახელი, ელფოსტა, ტელეფონის ნომერი, ქალაქი
     * @param {Object} user
     * @returns {string}
     */
    function createEmployeeCard(user) {
        const initials = getInitials(user.name);
        const name = escapeHtml(user.name || 'უსახელო');
        const username = escapeHtml(user.username || '');
        const email = escapeHtml(user.email || 'უცნობია');
        const phone = escapeHtml(user.phone || 'უცნობია');
        const city = escapeHtml(user.address && user.address.city ? user.address.city : 'უცნობია');
        const company = escapeHtml(user.company && user.company.name ? user.company.name : 'კომპანია');

        return `
            <article class="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between">
                <div class="space-y-4">
                    <!-- თანამშრომლის ავატარი და სახელი -->
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform duration-200 ring-2 ring-indigo-100">
                            ${initials}
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition truncate" title="${name}">
                                ${name}
                            </h3>
                            ${username ? `<p class="text-xs text-slate-500 font-medium truncate">@${username}</p>` : ''}
                        </div>
                    </div>

                    <!-- საკონტაქტო და ლოკაციის მონაცემები -->
                    <ul class="space-y-2.5 text-xs sm:text-sm text-slate-600 pt-3 border-t border-slate-100/90">
                        <!-- ელფოსტა -->
                        <li class="flex items-center gap-2.5 min-w-0">
                            <span class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 text-xs shadow-xs" title="ელფოსტა">
                                ✉️
                            </span>
                            <span class="truncate">
                                <a href="mailto:${email}" class="text-slate-700 hover:text-indigo-600 hover:underline transition font-medium" title="${email}">
                                    ${email}
                                </a>
                            </span>
                        </li>

                        <!-- ტელეფონის ნომერი -->
                        <li class="flex items-center gap-2.5 min-w-0">
                            <span class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 text-xs shadow-xs" title="ტელეფონი">
                                📞
                            </span>
                            <span class="truncate">
                                <a href="tel:${phone}" class="text-slate-700 hover:text-indigo-600 hover:underline transition font-medium" title="${phone}">
                                    ${phone}
                                </a>
                            </span>
                        </li>

                        <!-- ქალაქი -->
                        <li class="flex items-center gap-2.5 min-w-0">
                            <span class="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 text-xs shadow-xs" title="ქალაქი">
                                📍
                            </span>
                            <span class="truncate text-slate-700 font-medium" title="ქალაქი: ${city}">
                                ${city}
                            </span>
                        </li>
                    </ul>
                </div>

                <!-- ბარათის ქვედა ნაწილი: კომპანია და ID -->
                <div class="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between text-xs text-slate-500">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 font-medium border border-slate-100 truncate max-w-[170px]" title="${company}">
                        <span>🏢</span>
                        <span class="truncate">${company}</span>
                    </span>
                    <span class="text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-md">
                        #${user.id}
                    </span>
                </div>
            </article>
        `;
    }

    /**
     * თანამშრომლების მონაცემების მიღება fetch() ფუნქციით
     */
    async function fetchEmployees() {
        const container = document.getElementById('employees-container');
        if (!container) return;

        showLoadingState(container);

        try {
            const response = await fetch(EMPLOYEES_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`სერვერმა დააბრუნა სტატუსი: ${response.status} (${response.statusText})`);
            }

            const employees = await response.json();

            if (!Array.isArray(employees) || employees.length === 0) {
                showErrorState(container, 'თანამშრომლების მონაცემები ცარიელია.');
                return;
            }

            // თითოეული მიღებული მომხმარებლის სახელის გამოტანა კონსოლში console.log()-ის გამოყენებით
            employees.forEach(user => {
                console.log(user.name);
            });

            // მონაცემების წარმატებით ასახვა ბარათების ბადეში
            const cardsHtml = employees.map(createEmployeeCard).join('');
            container.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${cardsHtml}
                </div>
            `;
        } catch (error) {
            console.error('Employees fetch error:', error);
            showErrorState(container, error && error.message ? error.message : 'ვერ მოხერხდა API-სთან დაკავშირება.');
        }
    }

    // ინიციალიზაცია DOM-ის ჩატვირთვის შემდეგ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initBurgerMenu();
            fetchEmployees();
        });
    } else {
        initBurgerMenu();
        fetchEmployees();
    }
})();
